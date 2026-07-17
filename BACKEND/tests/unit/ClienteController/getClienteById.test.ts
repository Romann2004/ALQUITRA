import { Request, Response } from 'express';
import { getClienteById } from '../../../src/controllers/ClienteController';
import Cliente from '../../../src/models/Cliente';

const mockResponse = () => {
    const res: any = {};
    res.status = jest.fn().mockReturnValue(res);
    res.json = jest.fn().mockReturnValue(res);
    return res as Response;
};

describe('getClienteById', () => {
    let findByPkSpy: jest.SpyInstance;

    afterEach(() => {
        jest.restoreAllMocks();
    });

    // --- CASO 1: Cliente encontrado y activo ---
    test('debería devolver el cliente si existe y está activo', async () => {
        const cliente = { id: 1, nombre: 'Manuel', activo: true };
        findByPkSpy = jest.spyOn(Cliente, 'findByPk').mockResolvedValue(cliente as any);

        const req = { params: { id: '1' } } as unknown as Request;
        const res = mockResponse();

        await getClienteById(req, res);

        expect(findByPkSpy).toHaveBeenCalledWith(1);
        expect(res.json).toHaveBeenCalledWith(cliente);
    });

    // --- CASO 2: Cliente inexistente ---
    test('debería responder 404 si el cliente no existe', async () => {
        findByPkSpy = jest.spyOn(Cliente, 'findByPk').mockResolvedValue(null);

        const req = { params: { id: '999' } } as unknown as Request;
        const res = mockResponse();

        await getClienteById(req, res);

        expect(res.status).toHaveBeenCalledWith(404);
        expect(res.json).toHaveBeenCalledWith({ msg: 'Cliente no encontrado' });
    });

    // --- CASO 3: Cliente desactivado (borrado lógico) ---
    // Para el front, un cliente inactivo debe comportarse como si no existiera.
    test('debería responder 404 si el cliente está desactivado', async () => {
        findByPkSpy = jest.spyOn(Cliente, 'findByPk').mockResolvedValue(
            { id: 1, nombre: 'Manuel', activo: false } as any
        );

        const req = { params: { id: '1' } } as unknown as Request;
        const res = mockResponse();

        await getClienteById(req, res);

        expect(res.status).toHaveBeenCalledWith(404);
        expect(res.json).toHaveBeenCalledWith({ msg: 'Cliente no encontrado' });
    });

    // --- CASO 4: Error interno ---
    test('debería responder 500 si falla la consulta', async () => {
        findByPkSpy = jest.spyOn(Cliente, 'findByPk').mockRejectedValue(new Error('DB caída'));

        const req = { params: { id: '1' } } as unknown as Request;
        const res = mockResponse();

        await getClienteById(req, res);

        expect(res.status).toHaveBeenCalledWith(500);
        expect(res.json).toHaveBeenCalledWith(
            expect.objectContaining({ msg: 'Error al obtener el cliente' })
        );
    });
});
