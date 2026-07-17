import { Request, Response } from 'express';
import { putCliente } from '../../../src/controllers/ClienteController';
import Cliente from '../../../src/models/Cliente';
import { Log } from '../../../src/models/Log';

const mockResponse = () => {
    const res: any = {};
    res.status = jest.fn().mockReturnValue(res);
    res.json = jest.fn().mockReturnValue(res);
    return res as Response;
};

describe('putCliente', () => {
    let findByPkSpy: jest.SpyInstance;
    let findOneSpy: jest.SpyInstance;
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

        const req = { params: { id: '1' }, body: {} } as unknown as Request;
        const res = mockResponse();

        await putCliente(req, res);

        expect(res.status).toHaveBeenCalledWith(404);
        expect(res.json).toHaveBeenCalledWith({ msg: 'Cliente no encontrado' });
    });

    // --- CASO 2: Cliente desactivado ---
    test('debería responder 404 si el cliente está desactivado', async () => {
        findByPkSpy = jest.spyOn(Cliente, 'findByPk').mockResolvedValue({ activo: false } as any);

        const req = { params: { id: '1' }, body: {} } as unknown as Request;
        const res = mockResponse();

        await putCliente(req, res);

        expect(res.status).toHaveBeenCalledWith(404);
        expect(res.json).toHaveBeenCalledWith({ msg: 'Cliente no encontrado' });
    });

    // --- CASO 3: DNI ya usado por otro cliente ---
    test('debería responder 400 si el DNI ya pertenece a otro cliente', async () => {
        findByPkSpy = jest.spyOn(Cliente, 'findByPk').mockResolvedValue(
            { id: 1, activo: true, nombre: 'Manuel', dni: '111', email: 'a@a.com', telefono: '1', update: jest.fn() } as any
        );
        findOneSpy = jest.spyOn(Cliente, 'findOne').mockResolvedValue(
            { id: 2, dni: '999', email: 'otro@mail.com' } as any
        );

        const req = { params: { id: '1' }, body: { dni: '999' } } as unknown as Request;
        const res = mockResponse();

        await putCliente(req, res);

        expect(res.status).toHaveBeenCalledWith(400);
        expect(res.json).toHaveBeenCalledWith({
            msg: 'No se pudo actualizar: El DNI ya pertenece a otro cliente.',
        });
    });

    // --- CASO 4: Email ya usado por otro cliente ---
    test('debería responder 400 si el Email ya pertenece a otro cliente', async () => {
        findByPkSpy = jest.spyOn(Cliente, 'findByPk').mockResolvedValue(
            { id: 1, activo: true, nombre: 'Manuel', dni: '111', email: 'a@a.com', telefono: '1', update: jest.fn() } as any
        );
        findOneSpy = jest.spyOn(Cliente, 'findOne').mockResolvedValue(
            { id: 2, dni: '222', email: 'nuevo@mail.com' } as any
        );

        const req = { params: { id: '1' }, body: { email: 'nuevo@mail.com' } } as unknown as Request;
        const res = mockResponse();

        await putCliente(req, res);

        expect(res.status).toHaveBeenCalledWith(400);
        expect(res.json).toHaveBeenCalledWith({
            msg: 'No se pudo actualizar: El Email ya pertenece a otro cliente.',
        });
    });

    // --- CASO 5: Actualización exitosa, con fallback a los valores actuales ---
    // Si el body no manda "telefono", debe conservar el telefono que ya
    // tenía el cliente en vez de pisarlo con undefined.
    test('debería actualizar solo los campos enviados y conservar el resto', async () => {
        const updateMock = jest.fn().mockResolvedValue(true);
        findByPkSpy = jest.spyOn(Cliente, 'findByPk').mockResolvedValue({
            id: 1,
            activo: true,
            nombre: 'Manuel Viejo',
            dni: '111',
            email: 'viejo@mail.com',
            telefono: '111-1111',
            update: updateMock,
        } as any);
        findOneSpy = jest.spyOn(Cliente, 'findOne').mockResolvedValue(null);

        const req = {
            params: { id: '1' },
            body: { nombre: '  Manuel Nuevo  ' }, // solo mandamos el nombre
        } as unknown as Request;
        const res = mockResponse();

        await putCliente(req, res);

        expect(updateMock).toHaveBeenCalledWith({
            nombre: 'Manuel Nuevo',
            dni: '111',
            email: 'viejo@mail.com',
            telefono: '111-1111',
        });
        expect(logCreateSpy).toHaveBeenCalledWith(expect.objectContaining({ accion: 'ACTUALIZAR_CLIENTE' }));
        expect(res.json).toHaveBeenCalledWith(
            expect.objectContaining({ msg: 'Cliente actualizado con éxito' })
        );
    });

    // --- CASO 6: Error interno ---
    test('debería responder 500 si ocurre un error inesperado', async () => {
        findByPkSpy = jest.spyOn(Cliente, 'findByPk').mockRejectedValue(new Error('DB caída'));

        const req = { params: { id: '1' }, body: {} } as unknown as Request;
        const res = mockResponse();

        await putCliente(req, res);

        expect(res.status).toHaveBeenCalledWith(500);
        expect(res.json).toHaveBeenCalledWith(
            expect.objectContaining({ msg: 'Error interno en el servidor al actualizar el cliente' })
        );
    });
});
