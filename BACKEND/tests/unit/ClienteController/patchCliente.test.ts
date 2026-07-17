import { Request, Response } from 'express';
import { patchCliente } from '../../../src/controllers/ClienteController';
import Cliente from '../../../src/models/Cliente';
import { Log } from '../../../src/models/Log';

const mockResponse = () => {
    const res: any = {};
    res.status = jest.fn().mockReturnValue(res);
    res.json = jest.fn().mockReturnValue(res);
    return res as Response;
};

describe('patchCliente', () => {
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

        const req = { params: { id: '1' }, body: { nombre: 'Nuevo' } } as unknown as Request;
        const res = mockResponse();

        await patchCliente(req, res);

        expect(res.status).toHaveBeenCalledWith(404);
        expect(res.json).toHaveBeenCalledWith({ msg: 'Cliente no encontrado' });
    });

    // --- CASO 2: Cliente desactivado ---
    test('debería responder 404 si el cliente está desactivado', async () => {
        findByPkSpy = jest.spyOn(Cliente, 'findByPk').mockResolvedValue({ activo: false } as any);

        const req = { params: { id: '1' }, body: { nombre: 'Nuevo' } } as unknown as Request;
        const res = mockResponse();

        await patchCliente(req, res);

        expect(res.status).toHaveBeenCalledWith(404);
        expect(res.json).toHaveBeenCalledWith({ msg: 'Cliente no encontrado' });
    });

    // --- CASO 3: DNI o Email duplicados ---
    // Solo se dispara la validación de duplicados si vienen dni y/o email
    // en el body (a diferencia de nombre/telefono, que no se chequean).
    test('debería responder 400 si el nuevo DNI o Email ya pertenecen a otro cliente', async () => {
        findByPkSpy = jest.spyOn(Cliente, 'findByPk').mockResolvedValue(
            { id: 1, activo: true, nombre: 'Manuel', update: jest.fn() } as any
        );
        findOneSpy = jest.spyOn(Cliente, 'findOne').mockResolvedValue({ id: 2, dni: '999' } as any);

        const req = { params: { id: '1' }, body: { dni: '999' } } as unknown as Request;
        const res = mockResponse();

        await patchCliente(req, res);

        expect(findOneSpy).toHaveBeenCalled();
        expect(res.status).toHaveBeenCalledWith(400);
        expect(res.json).toHaveBeenCalledWith({
            msg: 'El DNI o Email ya corresponden a otro cliente registrado.',
        });
    });

    // --- CASO 4: Actualización parcial de un solo campo (sin chequeo de duplicados) ---
    // Si solo se manda "telefono", no debe llamar a Cliente.findOne (dni/email
    // no vinieron) y debe actualizar únicamente ese campo.
    test('debería actualizar únicamente el campo enviado', async () => {
        const updateMock = jest.fn().mockResolvedValue(true);
        findByPkSpy = jest.spyOn(Cliente, 'findByPk').mockResolvedValue({
            id: 1,
            activo: true,
            nombre: 'Manuel',
            update: updateMock,
        } as any);
        findOneSpy = jest.spyOn(Cliente, 'findOne');

        const req = { params: { id: '1' }, body: { telefono: '555-5555' } } as unknown as Request;
        const res = mockResponse();

        await patchCliente(req, res);

        expect(findOneSpy).not.toHaveBeenCalled();
        expect(updateMock).toHaveBeenCalledWith({ telefono: '555-5555' });
        expect(logCreateSpy).toHaveBeenCalledWith(
            expect.objectContaining({
                accion: 'ACTUALIZAR_PARCIAL_CLIENTE',
                metadata: expect.objectContaining({ camposModificados: ['telefono'] }),
            })
        );
        expect(res.json).toHaveBeenCalledWith(
            expect.objectContaining({ msg: 'Cliente actualizado parcialmente con éxito' })
        );
    });

    // --- CASO 5: Sanitización de nombre y dni cuando se envían ambos ---
    test('debería sanitizar (trim) nombre y dni antes de guardar', async () => {
        const updateMock = jest.fn().mockResolvedValue(true);
        findByPkSpy = jest.spyOn(Cliente, 'findByPk').mockResolvedValue({
            id: 1,
            activo: true,
            nombre: 'Manuel',
            update: updateMock,
        } as any);
        findOneSpy = jest.spyOn(Cliente, 'findOne').mockResolvedValue(null);

        const req = {
            params: { id: '1' },
            body: { nombre: '  Manuel Nuevo  ', dni: '  12345678  ' },
        } as unknown as Request;
        const res = mockResponse();

        await patchCliente(req, res);

        expect(updateMock).toHaveBeenCalledWith({ nombre: 'Manuel Nuevo', dni: '12345678' });
    });

    // --- CASO 6: Error interno ---
    test('debería responder 500 si ocurre un error inesperado', async () => {
        findByPkSpy = jest.spyOn(Cliente, 'findByPk').mockRejectedValue(new Error('DB caída'));

        const req = { params: { id: '1' }, body: {} } as unknown as Request;
        const res = mockResponse();

        await patchCliente(req, res);

        expect(res.status).toHaveBeenCalledWith(500);
        expect(res.json).toHaveBeenCalledWith(
            expect.objectContaining({ msg: 'Error al actualizar parcialmenteel cliente' })
        );
    });
});
