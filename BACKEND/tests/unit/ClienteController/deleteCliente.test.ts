import { Request, Response } from 'express';
import { deleteCliente } from '../../../src/controllers/ClienteController';
import Cliente from '../../../src/models/Cliente';
import { Log } from '../../../src/models/Log';

const mockResponse = () => {
    const res: any = {};
    res.status = jest.fn().mockReturnValue(res);
    res.json = jest.fn().mockReturnValue(res);
    return res as Response;
};

describe('deleteCliente', () => {
    let findByPkSpy: jest.SpyInstance;
    let logCreateSpy: jest.SpyInstance;

    beforeEach(() => {
        logCreateSpy = jest.spyOn(Log, 'create').mockResolvedValue({} as any);
    });

    afterEach(() => {
        jest.restoreAllMocks();
    });

    // --- CASO 1: Cliente inexistente ---
    test('debería responder 404 si el cliente no existe', async () => {
        findByPkSpy = jest.spyOn(Cliente, 'findByPk').mockResolvedValue(null);

        const req = { params: { id: '999' } } as unknown as Request;
        const res = mockResponse();

        await deleteCliente(req, res);

        expect(res.status).toHaveBeenCalledWith(404);
        expect(res.json).toHaveBeenCalledWith({ msg: 'Cliente no encontrado' });
    });

    // --- CASO 2: Borrado lógico exitoso ---
    // No debe borrar el registro de la base de datos: solo debe marcar
    // "activo: false" y dejar constancia en el log.
    test('debería desactivar al cliente (borrado lógico) en vez de eliminarlo', async () => {
        const updateMock = jest.fn().mockResolvedValue(true);
        findByPkSpy = jest.spyOn(Cliente, 'findByPk').mockResolvedValue(
            { id: 1, nombre: 'Manuel', activo: true, update: updateMock } as any
        );

        const req = { params: { id: '1' } } as unknown as Request;
        const res = mockResponse();

        await deleteCliente(req, res);

        expect(updateMock).toHaveBeenCalledWith({ activo: false });
        expect(logCreateSpy).toHaveBeenCalledWith(
            expect.objectContaining({ accion: 'ELIMINAR_CLIENTE_LÓGICO' })
        );
        expect(res.json).toHaveBeenCalledWith({ msg: 'Cliente eliminado con éxito' });
    });

    // --- CASO 3: Error interno ---
    test('debería responder 500 si ocurre un error inesperado', async () => {
        findByPkSpy = jest.spyOn(Cliente, 'findByPk').mockRejectedValue(new Error('DB caída'));

        const req = { params: { id: '1' } } as unknown as Request;
        const res = mockResponse();

        await deleteCliente(req, res);

        expect(res.status).toHaveBeenCalledWith(500);
        expect(res.json).toHaveBeenCalledWith(
            expect.objectContaining({ msg: 'Error al eliminar el cliente' })
        );
    });
});
