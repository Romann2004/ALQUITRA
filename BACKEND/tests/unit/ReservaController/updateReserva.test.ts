import { Request, Response } from 'express';
import { updateReserva } from '../../../src/controllers/ReservaController';
import Reserva from '../../../src/models/Reserva';
import { Traje } from '../../../src/models/Traje';
import { Log } from '../../../src/models/Log';
import { EstadoTraje } from '../../../src/models/Enums';

const mockResponse = () => {
    const res: any = {};
    res.status = jest.fn().mockReturnValue(res);
    res.json = jest.fn().mockReturnValue(res);
    return res as Response;
};

// Simula una instancia de Sequelize: necesita tanto .get(campo) (que usa el
// controller para leer trajeId/estado actuales) como .update(body).
const buildMockReserva = (data: Record<string, any>, updateMock = jest.fn().mockResolvedValue(true)) => ({
    get: jest.fn((key: string) => data[key]),
    update: updateMock,
    ...data,
});

describe('updateReserva', () => {
    let findByPkSpy: jest.SpyInstance;
    let findOneSpy: jest.SpyInstance;
    let trajeFindByPkSpy: jest.SpyInstance;
    let logCreateSpy: jest.SpyInstance;

    beforeEach(() => {
        logCreateSpy = jest.spyOn(Log, 'create').mockResolvedValue({} as any);
    });

    afterEach(() => {
        jest.restoreAllMocks();
    });

    // --- CASO 1: Reserva inexistente ---
    test('debería responder 404 si la reserva no existe', async () => {
        findByPkSpy = jest.spyOn(Reserva, 'findByPk').mockResolvedValue(null);

        const req = { params: { id: '999' }, body: {} } as unknown as Request;
        const res = mockResponse();

        await updateReserva(req, res);

        expect(res.status).toHaveBeenCalledWith(404);
        expect(res.json).toHaveBeenCalledWith({ msg: 'No existe esa reserva' });
    });

    // --- CASO 2: Seña inválida ---
    test('debería responder 400 si la seña es inválida', async () => {
        findByPkSpy = jest.spyOn(Reserva, 'findByPk').mockResolvedValue(
            buildMockReserva({ trajeId: 1, estado: 'PENDIENTE' }) as any
        );

        const req = { params: { id: '1' }, body: { senia: -50 } } as unknown as Request;
        const res = mockResponse();

        await updateReserva(req, res);

        expect(res.status).toHaveBeenCalledWith(400);
        expect(res.json).toHaveBeenCalledWith({ msg: 'La seña no puede ser negativa.' });
    });

    // --- CASO 3: Fechas inválidas ---
    // Solo se valida si vienen AMBAS fechas en el body.
    test('debería responder 400 si la fecha de devolución no es posterior al retiro', async () => {
        findByPkSpy = jest.spyOn(Reserva, 'findByPk').mockResolvedValue(
            buildMockReserva({ trajeId: 1, estado: 'PENDIENTE' }) as any
        );

        const req = {
            params: { id: '1' },
            body: { fechaRetiro: '2026-08-20', fechaDevolucion: '2026-08-15' },
        } as unknown as Request;
        const res = mockResponse();

        await updateReserva(req, res);

        expect(res.status).toHaveBeenCalledWith(400);
        expect(res.json).toHaveBeenCalledWith({
            msg: 'La fecha de devolución debe ser posterior al retiro.',
        });
    });

    // --- CASO 4: Superposición con otra reserva ---
    test('debería responder 400 si las nuevas fechas se superponen con otra reserva', async () => {
        findByPkSpy = jest.spyOn(Reserva, 'findByPk').mockResolvedValue(
            buildMockReserva({ trajeId: 1, estado: 'PENDIENTE' }) as any
        );
        findOneSpy = jest.spyOn(Reserva, 'findOne').mockResolvedValue({ id: 55 } as any);

        const req = {
            params: { id: '1' },
            body: { fechaRetiro: '2026-08-15', fechaDevolucion: '2026-08-20' },
        } as unknown as Request;
        const res = mockResponse();

        await updateReserva(req, res);

        expect(res.status).toHaveBeenCalledWith(400);
        expect(res.json).toHaveBeenCalledWith({ msg: 'El traje ya está reservado para esas fechas.' });
    });

    // --- CASO 5: Cambio de traje + cambio de estado ---
    // Si se asigna un traje distinto, el traje viejo debe liberarse
    // (DISPONIBLE) y el traje nuevo debe sincronizarse según el estado
    // final de la reserva (RETIRADO -> ALQUILADO).
    test('debería liberar el traje viejo y sincronizar el traje nuevo al cambiar de traje', async () => {
        const reservaMock = buildMockReserva({ trajeId: 1, estado: 'PENDIENTE' });
        findByPkSpy = jest.spyOn(Reserva, 'findByPk').mockResolvedValue(reservaMock as any);

        const trajeUpdateMock = jest.fn().mockResolvedValue(true);
        trajeFindByPkSpy = jest.spyOn(Traje, 'findByPk').mockResolvedValue({ update: trajeUpdateMock } as any);

        const req = {
            params: { id: '1' },
            body: { trajeId: 2, estado: 'RETIRADO' },
        } as unknown as Request;
        const res = mockResponse();

        await updateReserva(req, res);

        expect(reservaMock.update).toHaveBeenCalledWith(req.body);
        // 1ra llamada: se libera el traje viejo (id 1) -> DISPONIBLE
        expect(trajeFindByPkSpy).toHaveBeenNthCalledWith(1, 1);
        expect(trajeUpdateMock).toHaveBeenNthCalledWith(1, { estado: EstadoTraje.DISPONIBLE });
        // 2da llamada: se sincroniza el traje nuevo (id 2) según el estado RETIRADO -> ALQUILADO
        expect(trajeFindByPkSpy).toHaveBeenNthCalledWith(2, 2);
        expect(trajeUpdateMock).toHaveBeenNthCalledWith(2, { estado: EstadoTraje.ALQUILADO });
        expect(logCreateSpy).toHaveBeenCalledWith(expect.objectContaining({ accion: 'ACTUALIZAR_RESERVA' }));
        expect(res.json).toHaveBeenCalledWith(
            expect.objectContaining({ msg: 'Reserva actualizada' })
        );
    });

    // --- CASO 6: Actualización sin cambiar de traje ni estado explícito ---
    // Si no se manda "trajeId" no debe tocar ningún traje viejo, y si no se
    // manda "estado" debe usar el estado que ya tenía la reserva.
    test('no debería liberar ningún traje si no se cambia el trajeId, y debe usar el estado actual', async () => {
        const reservaMock = buildMockReserva({ trajeId: 3, estado: 'PENDIENTE' });
        findByPkSpy = jest.spyOn(Reserva, 'findByPk').mockResolvedValue(reservaMock as any);

        const trajeUpdateMock = jest.fn().mockResolvedValue(true);
        trajeFindByPkSpy = jest.spyOn(Traje, 'findByPk').mockResolvedValue({ update: trajeUpdateMock } as any);

        const req = { params: { id: '1' }, body: { senia: 50 } } as unknown as Request;
        const res = mockResponse();

        await updateReserva(req, res);

        // Solo debe llamarse una vez: la sincronización con el traje actual (id 3)
        expect(trajeFindByPkSpy).toHaveBeenCalledTimes(1);
        expect(trajeFindByPkSpy).toHaveBeenCalledWith(3);
        expect(trajeUpdateMock).toHaveBeenCalledWith({ estado: EstadoTraje.RESERVADO });
    });

    // --- CASO 7: Error interno ---
    test('debería responder 500 si ocurre un error inesperado', async () => {
        findByPkSpy = jest.spyOn(Reserva, 'findByPk').mockRejectedValue(new Error('DB caída'));

        const req = { params: { id: '1' }, body: {} } as unknown as Request;
        const res = mockResponse();

        await updateReserva(req, res);

        expect(res.status).toHaveBeenCalledWith(500);
        expect(res.json).toHaveBeenCalledWith(
            expect.objectContaining({ msg: 'Error al actualizar la reserva' })
        );
    });
});
