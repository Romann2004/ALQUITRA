import { Request, Response } from 'express';
import { crearTraje } from '../../../src/controllers/TrajeControllers';
import { Traje } from '../../../src/models/Traje';
import { Log } from '../../../src/models/Log';
import { EstadoTraje } from '../../../src/models/Enums';

const mockResponse = () => {
    const res: any = {};
    res.status = jest.fn().mockReturnValue(res);
    res.json = jest.fn().mockReturnValue(res);
    return res as Response;
};

describe('crearTraje', () => {
    let createSpy: jest.SpyInstance;
    let logCreateSpy: jest.SpyInstance;

    beforeEach(() => {
        logCreateSpy = jest.spyOn(Log, 'create').mockResolvedValue({} as any);
    });

    afterEach(() => {
        jest.restoreAllMocks();
    });

    // --- CASO 1: Creación exitosa ---
    // El traje debe nacer siempre con estado DISPONIBLE, sin importar lo
    // que venga en el body, y debe registrarse el log correspondiente.
    test('debería crear el traje con estado DISPONIBLE y registrar el log', async () => {
        createSpy = jest.spyOn(Traje, 'create').mockResolvedValue(
            { id: 1, codigoEtiqueta: 'ABC123', estado: EstadoTraje.DISPONIBLE } as any
        );

        const req = {
            body: {
                codigoEtiqueta: 'ABC123',
                talle: 'M',
                color: 'Negro',
                categoria: 'Smoking',
                precioAlquilerBase: 100,
            },
        } as Request;
        const res = mockResponse();

        await crearTraje(req, res);

        expect(createSpy).toHaveBeenCalledWith({
            codigoEtiqueta: 'ABC123',
            talle: 'M',
            color: 'Negro',
            categoria: 'Smoking',
            precioAlquilerBase: 100,
            estado: EstadoTraje.DISPONIBLE,
        });
        expect(logCreateSpy).toHaveBeenCalledWith(expect.objectContaining({ accion: 'CREAR_TRAJE' }));
        expect(res.status).toHaveBeenCalledWith(201);
        expect(res.json).toHaveBeenCalledWith(
            expect.objectContaining({ ok: true, msg: 'Traje y Log registrados con éxito' })
        );
    });

    // --- CASO 2: Error interno ---
    // Ej: código de etiqueta duplicado (constraint unique) u otro error de BD.
    test('debería responder 500 con el mensaje de error si falla la creación', async () => {
        createSpy = jest.spyOn(Traje, 'create').mockRejectedValue(new Error('codigoEtiqueta ya existe'));

        const req = {
            body: { codigoEtiqueta: 'ABC123', talle: 'M', color: 'Negro', categoria: 'Smoking', precioAlquilerBase: 100 },
        } as Request;
        const res = mockResponse();

        await crearTraje(req, res);

        expect(res.status).toHaveBeenCalledWith(500);
        expect(res.json).toHaveBeenCalledWith({
            ok: false,
            msg: 'Error al crear el traje',
            error: 'codigoEtiqueta ya existe',
        });
    });
});
