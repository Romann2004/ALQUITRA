import { Request, Response } from 'express';
import { updateEstadoReserva } from '../../../src/controllers/ReservaController';
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

describe('updateEstadoReserva', () => {
    let findByPkSpy: jest.SpyInstance;
    let trajeFindByPkSpy: jest.SpyInstance;
    let logCreateSpy: jest.SpyInstance;

    beforeEach(() => {
        logCreateSpy = jest.spyOn(Log, 'create').mockResolvedValue({} as any);
    });

    afterEach(() => {
        jest.restoreAllMocks();
    });

    // --- CASO 1: Estado inválido ---
    // Debe cortar antes de siquiera buscar la reserva en la base de datos.
    test('debería responder 400 si el estado no es válido', async () => {
        findByPkSpy = jest.spyOn(Reserva, 'findByPk');

        const req = { params: { id: '1' }, body: { estado: 'INVALIDO' } } as unknown as Request;
        const res = mockResponse();

        await updateEstadoReserva(req, res);

        expect(findByPkSpy).not.toHaveBeenCalled();
        expect(res.status).toHaveBeenCalledWith(400);
        expect(res.json).toHaveBeenCalledWith({ msg: 'Estado no válido' });
    });

    // --- CASO 2: Reserva inexistente ---
    test('debería responder 404 si la reserva no existe', async () => {
        findByPkSpy = jest.spyOn(Reserva, 'findByPk').mockResolvedValue(null);

        const req = { params: { id: '999' }, body: { estado: 'RETIRADO' } } as unknown as Request;
        const res = mockResponse();

        await updateEstadoReserva(req, res);

        expect(res.status).toHaveBeenCalledWith(404);
        expect(res.json).toHaveBeenCalledWith({ msg: 'No existe esa reserva' });
    });

    // --- CASO 3: Actualización exitosa ---
    // Debe actualizar el estado de la reserva Y sincronizar el estado del
    // traje asociado (RETIRADO -> ALQUILADO).
    test('debería actualizar el estado y sincronizar el stock del traje', async () => {
        const updateReservaMock = jest.fn().mockResolvedValue(true);
        const reservaMock = {
            get: jest.fn((key: string) => (key === 'trajeId' ? 7 : undefined)),
            update: updateReservaMock,
        };
        findByPkSpy = jest.spyOn(Reserva, 'findByPk').mockResolvedValue(reservaMock as any);

        const trajeUpdateMock = jest.fn().mockResolvedValue(true);
        trajeFindByPkSpy = jest.spyOn(Traje, 'findByPk').mockResolvedValue({ update: trajeUpdateMock } as any);

        const req = { params: { id: '1' }, body: { estado: 'RETIRADO' } } as unknown as Request;
        const res = mockResponse();

        await updateEstadoReserva(req, res);

        expect(updateReservaMock).toHaveBeenCalledWith({ estado: 'RETIRADO' });
        expect(trajeFindByPkSpy).toHaveBeenCalledWith(7);
        expect(trajeUpdateMock).toHaveBeenCalledWith({ estado: EstadoTraje.ALQUILADO });
        expect(logCreateSpy).toHaveBeenCalledWith(expect.objectContaining({ accion: 'ACTUALIZAR_ESTADO_RESERVA' }));
        expect(res.json).toHaveBeenCalledWith({ msg: 'Estado actualizado y stock sincronizado' });
    });

    // --- CASO 4: Error interno ---
    test('debería responder 500 si ocurre un error inesperado', async () => {
        findByPkSpy = jest.spyOn(Reserva, 'findByPk').mockRejectedValue(new Error('DB caída'));

        const req = { params: { id: '1' }, body: { estado: 'RETIRADO' } } as unknown as Request;
        const res = mockResponse();

        await updateEstadoReserva(req, res);

        expect(res.status).toHaveBeenCalledWith(500);
        expect(res.json).toHaveBeenCalledWith({ msg: 'Error al cambiar el estado de la reserva' });
    });
});
