import { Request, Response } from 'express';
import { postCliente } from '../../../src/controllers/ClienteController';
import Cliente from '../../../src/models/Cliente';
import { Log } from '../../../src/models/Log';

const mockResponse = () => {
    const res: any = {};
    res.status = jest.fn().mockReturnValue(res);
    res.json = jest.fn().mockReturnValue(res);
    return res as Response;
};

describe('postCliente', () => {
    let findOneSpy: jest.SpyInstance;
    let createSpy: jest.SpyInstance;
    let logCreateSpy: jest.SpyInstance;

    beforeEach(() => {
        logCreateSpy = jest.spyOn(Log, 'create').mockResolvedValue({} as any);
    });

    afterEach(() => {
        jest.restoreAllMocks();
    });

    // --- CASO 1: Campos obligatorios faltantes ---
    // Sin nombre o sin DNI debe rechazar antes de tocar la base de datos.
    test('debería responder 400 si falta el nombre o el DNI', async () => {
        const req = { body: { nombre: '', dni: '', email: 'a@a.com', telefono: '123' } } as Request;
        const res = mockResponse();

        await postCliente(req, res);

        expect(res.status).toHaveBeenCalledWith(400);
        expect(res.json).toHaveBeenCalledWith({ msg: 'El nombre y el DNI son campos obligatorios.' });
    });

    // --- CASO 2: DNI duplicado ---
    test('debería responder 400 indicando DNI duplicado si el DNI ya existe', async () => {
        findOneSpy = jest.spyOn(Cliente, 'findOne').mockResolvedValue(
            { id: 1, dni: '12345678', email: 'otro@mail.com' } as any
        );

        const req = {
            body: { nombre: 'Manuel', dni: '12345678', email: 'nuevo@mail.com', telefono: '123' },
        } as Request;
        const res = mockResponse();

        await postCliente(req, res);

        expect(res.status).toHaveBeenCalledWith(400);
        expect(res.json).toHaveBeenCalledWith({
            msg: 'El DNI ingresado ya se encuentra registrado en el sistema.',
        });
    });

    // --- CASO 3: Email duplicado ---
    test('debería responder 400 indicando Email duplicado si el email ya existe', async () => {
        findOneSpy = jest.spyOn(Cliente, 'findOne').mockResolvedValue(
            { id: 1, dni: '00000000', email: 'repetido@mail.com' } as any
        );

        const req = {
            body: { nombre: 'Manuel', dni: '12345678', email: 'repetido@mail.com', telefono: '123' },
        } as Request;
        const res = mockResponse();

        await postCliente(req, res);

        expect(res.status).toHaveBeenCalledWith(400);
        expect(res.json).toHaveBeenCalledWith({
            msg: 'El Email ingresado ya se encuentra registrado en el sistema.',
        });
    });

    // --- CASO 4: Creación exitosa ---
    // Verifica que los datos se sanitizan (trim y email en minúsculas), que
    // el cliente nace activo, y que se registra el log correspondiente.
    test('debería crear el cliente con los datos sanitizados y registrar el log', async () => {
        findOneSpy = jest.spyOn(Cliente, 'findOne').mockResolvedValue(null);
        createSpy = jest.spyOn(Cliente, 'create').mockResolvedValue(
            { id: 1, nombre: 'Manuel', dni: '12345678', email: 'manuel@mail.com', telefono: '123', activo: true } as any
        );

        const req = {
            body: {
                nombre: '  Manuel  ',
                dni: '  12345678  ',
                email: '  MANUEL@MAIL.COM  ',
                telefono: '  123  ',
            },
        } as Request;
        const res = mockResponse();

        await postCliente(req, res);

        expect(createSpy).toHaveBeenCalledWith({
            nombre: 'Manuel',
            dni: '12345678',
            email: 'manuel@mail.com',
            telefono: '123',
            activo: true,
        });
        expect(logCreateSpy).toHaveBeenCalledWith(expect.objectContaining({ accion: 'CREAR_CLIENTE' }));
        expect(res.json).toHaveBeenCalledWith(
            expect.objectContaining({ msg: 'Cliente creado con éxito' })
        );
    });

    // --- CASO 5: Error interno ---
    test('debería responder 500 si falla la creación del cliente', async () => {
        findOneSpy = jest.spyOn(Cliente, 'findOne').mockResolvedValue(null);
        createSpy = jest.spyOn(Cliente, 'create').mockRejectedValue(new Error('DB caída'));

        const req = {
            body: { nombre: 'Manuel', dni: '12345678', email: 'manuel@mail.com', telefono: '123' },
        } as Request;
        const res = mockResponse();

        await postCliente(req, res);

        expect(res.status).toHaveBeenCalledWith(500);
        expect(res.json).toHaveBeenCalledWith(
            expect.objectContaining({ msg: 'Error interno en el servidor al crear el cliente' })
        );
    });
});
