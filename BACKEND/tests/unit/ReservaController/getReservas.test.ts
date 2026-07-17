import { Request, Response } from 'express';
import { getReservas } from '../../../src/controllers/ReservaController';
import Reserva from '../../../src/models/Reserva';
import Cliente from '../../../src/models/Cliente';
import { Traje } from '../../../src/models/Traje';

const mockResponse = () => {
    const res: any = {};
    res.status = jest.fn().mockReturnValue(res);
    res.json = jest.fn().mockReturnValue(res);
    return res as Response;
};

describe('getReservas', () => {
    let findAllSpy: jest.SpyInstance;

    afterEach(() => {
        jest.restoreAllMocks();
    });

    // --- CASO 1: Listado exitoso ---
    // Debe incluir los datos relacionados de Cliente y Traje que necesita
    // el listado del front (nombre/dni del cliente, categoría/talle/color
    // del traje).
    test('debería devolver las reservas con los datos de cliente y traje incluidos', async () => {
        const reservas = [{ id: 1, clienteId: 1, trajeId: 1 }];
        findAllSpy = jest.spyOn(Reserva, 'findAll').mockResolvedValue(reservas as any);

        const req = {} as Request;
        const res = mockResponse();

        await getReservas(req, res);

        expect(findAllSpy).toHaveBeenCalledWith({
            include: [
                { model: Cliente, attributes: ['nombre', 'dni'] },
                { model: Traje, attributes: ['categoria', 'talle', 'color'] },
            ],
        });
        expect(res.json).toHaveBeenCalledWith(reservas);
    });

    // --- CASO 2: Error interno ---
    test('debería responder 500 si falla la consulta', async () => {
        findAllSpy = jest.spyOn(Reserva, 'findAll').mockRejectedValue(new Error('DB caída'));

        const req = {} as Request;
        const res = mockResponse();

        await getReservas(req, res);

        expect(res.status).toHaveBeenCalledWith(500);
        expect(res.json).toHaveBeenCalledWith(
            expect.objectContaining({ msg: 'Error al obtener reservas' })
        );
    });
});
