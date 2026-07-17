import { Request, Response } from 'express';
import { deleteReserva } from '../../../src/controllers/ReservaController';
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

const buildMockReserva = (estado: string, trajeId: number) => ({
    get: jest.fn((key: string) => (key === 'estado' ? estado : key === 'trajeId' ? trajeId : undefined)),
    destroy: jest.fn().mockResolvedValue(true),
});

describe('deleteReserva', () => {
    let findByPkSpy: jest.SpyInstance;
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

        const req = { params: { id: '999' } } as unknown as Request;
        const res = mockResponse();

        await deleteReserva(req, res);

        expect(res.status).toHaveBeenCalledWith(404);
        expect(res.json).toHaveBeenCalledWith({ msg: 'No existe una reserva con ese id' });
    });

    // --- CASO 2: Reserva PENDIENTE ---
    // Al borrar una reserva que todavía no se retiró, el traje debe volver
    // a quedar DISPONIBLE.
    test('debería liberar el traje si la reserva estaba PENDIENTE', async () => {
        const reservaMock = buildMockReserva('PENDIENTE', 5);
        findByPkSpy = jest.spyOn(Reserva, 'findByPk').mockResolvedValue(reservaMock as any);
        const trajeUpdateMock = jest.fn().mockResolvedValue(true);
        trajeFindByPkSpy = jest.spyOn(Traje, 'findByPk').mockResolvedValue({ update: trajeUpdateMock } as any);

        const req = { params: { id: '1' } } as unknown as Request;
        const res = mockResponse();

        await deleteReserva(req, res);

        expect(trajeFindByPkSpy).toHaveBeenCalledWith(5);
        expect(trajeUpdateMock).toHaveBeenCalledWith({ estado: EstadoTraje.DISPONIBLE });
        expect(reservaMock.destroy).toHaveBeenCalled();
        expect(logCreateSpy).toHaveBeenCalledWith(expect.objectContaining({ accion: 'ELIMINAR_RESERVA' }));
        expect(res.json).toHaveBeenCalledWith({ msg: 'Reserva eliminada con éxito' });
    });

    // --- CASO 3: Reserva RETIRADO ---
    // El traje estaba alquilado en el mundo real; al borrar la reserva
    // también debe liberarse.
    test('debería liberar el traje si la reserva estaba RETIRADO', async () => {
        const reservaMock = buildMockReserva('RETIRADO', 8);
        findByPkSpy = jest.spyOn(Reserva, 'findByPk').mockResolvedValue(reservaMock as any);
        const trajeUpdateMock = jest.fn().mockResolvedValue(true);
        trajeFindByPkSpy = jest.spyOn(Traje, 'findByPk').mockResolvedValue({ update: trajeUpdateMock } as any);

        const req = { params: { id: '1' } } as unknown as Request;
        const res = mockResponse();

        await deleteReserva(req, res);

        expect(trajeFindByPkSpy).toHaveBeenCalledWith(8);
        expect(trajeUpdateMock).toHaveBeenCalledWith({ estado: EstadoTraje.DISPONIBLE });
    });

    // --- CASO 4: Reserva ya COMPLETADO o CANCELADO ---
    // El traje ya fue liberado (o nunca se afectó) en un paso anterior del
    // flujo, así que no debe volver a tocarse.
    test('no debería tocar el traje si la reserva ya estaba COMPLETADO', async () => {
        const reservaMock = buildMockReserva('COMPLETADO', 3);
        findByPkSpy = jest.spyOn(Reserva, 'findByPk').mockResolvedValue(reservaMock as any);
        trajeFindByPkSpy = jest.spyOn(Traje, 'findByPk');

        const req = { params: { id: '1' } } as unknown as Request;
        const res = mockResponse();

        await deleteReserva(req, res);

        expect(trajeFindByPkSpy).not.toHaveBeenCalled();
        expect(reservaMock.destroy).toHaveBeenCalled();
        expect(res.json).toHaveBeenCalledWith({ msg: 'Reserva eliminada con éxito' });
    });

    // --- CASO 5: Error interno ---
    test('debería responder 500 si ocurre un error inesperado', async () => {
        findByPkSpy = jest.spyOn(Reserva, 'findByPk').mockRejectedValue(new Error('DB caída'));

        const req = { params: { id: '1' } } as unknown as Request;
        const res = mockResponse();

        await deleteReserva(req, res);

        expect(res.status).toHaveBeenCalledWith(500);
        expect(res.json).toHaveBeenCalledWith(
            expect.objectContaining({ msg: 'Error al eliminar la reserva' })
        );
    });
});
