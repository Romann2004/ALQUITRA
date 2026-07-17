import { Request, Response } from 'express';
import { getClientes } from '../../../src/controllers/ClienteController';
import Cliente from '../../../src/models/Cliente';

const mockResponse = () => {
    const res: any = {};
    res.status = jest.fn().mockReturnValue(res);
    res.json = jest.fn().mockReturnValue(res);
    return res as Response;
};

describe('getClientes', () => {
    let findAllSpy: jest.SpyInstance;

    afterEach(() => {
        jest.restoreAllMocks();
    });

    // --- CASO 1: Listado exitoso ---
    // Debe pedir solo los clientes con activo: true (los borrados
    // lógicamente no deben aparecer en el listado general).
    test('debería devolver solo los clientes activos', async () => {
        const clientesActivos = [
            { id: 1, nombre: 'Manuel', activo: true },
            { id: 2, nombre: 'Ana', activo: true },
        ];
        findAllSpy = jest.spyOn(Cliente, 'findAll').mockResolvedValue(clientesActivos as any);

        const req = {} as Request;
        const res = mockResponse();

        await getClientes(req, res);

        expect(findAllSpy).toHaveBeenCalledWith({ where: { activo: true } });
        expect(res.json).toHaveBeenCalledWith(clientesActivos);
    });

    // --- CASO 2: Error interno ---
    // Si la consulta a la base de datos falla, debe responder 500.
    test('debería responder 500 si falla la consulta a la base de datos', async () => {
        findAllSpy = jest.spyOn(Cliente, 'findAll').mockRejectedValue(new Error('DB caída'));

        const req = {} as Request;
        const res = mockResponse();

        await getClientes(req, res);

        expect(res.status).toHaveBeenCalledWith(500);
        expect(res.json).toHaveBeenCalledWith(
            expect.objectContaining({ msg: 'Error al obtener los clientes' })
        );
    });
});
