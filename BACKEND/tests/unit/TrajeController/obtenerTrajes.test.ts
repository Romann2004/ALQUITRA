import { Request, Response } from 'express';
import { Op } from 'sequelize';
import { obtenerTrajes } from '../../../src/controllers/TrajeControllers';
import { Traje } from '../../../src/models/Traje';

const mockResponse = () => {
    const res: any = {};
    res.status = jest.fn().mockReturnValue(res);
    res.json = jest.fn().mockReturnValue(res);
    return res as Response;
};

describe('obtenerTrajes', () => {
    let findAllSpy: jest.SpyInstance;

    afterEach(() => {
        jest.restoreAllMocks();
    });

    // --- CASO 1: Sin filtros ---
    // Si no viene ningún query param, el where debe quedar vacío (trae todo).
    test('debería traer todos los trajes cuando no se envían filtros', async () => {
        findAllSpy = jest.spyOn(Traje, 'findAll').mockResolvedValue([{ id: 1 }] as any);

        const req = { query: {} } as unknown as Request;
        const res = mockResponse();

        await obtenerTrajes(req, res);

        expect(findAllSpy).toHaveBeenCalledWith({ where: {}, order: [['id', 'ASC']] });
        expect(res.json).toHaveBeenCalledWith({ ok: true, trajes: [{ id: 1 }] });
    });

    // --- CASO 2: Con todos los filtros ---
    // codigo/color/categoria deben armarse con Op.iLike (búsqueda parcial,
    // case-insensitive); talle/estado deben ser coincidencia exacta.
    test('debería construir el where dinámico según los filtros de la query', async () => {
        findAllSpy = jest.spyOn(Traje, 'findAll').mockResolvedValue([] as any);

        const req = {
            query: { codigo: 'ABC', talle: 'M', color: 'Negro', categoria: 'Smoking', estado: 'Disponible' },
        } as unknown as Request;
        const res = mockResponse();

        await obtenerTrajes(req, res);

        expect(findAllSpy).toHaveBeenCalledWith({
            where: {
                codigoEtiqueta: { [Op.iLike]: '%ABC%' },
                talle: 'M',
                color: { [Op.iLike]: '%Negro%' },
                categoria: { [Op.iLike]: '%Smoking%' },
                estado: 'Disponible',
            },
            order: [['id', 'ASC']],
        });
    });

    // --- CASO 3: Filtro parcial ---
    // Solo se debe agregar al where la condición del filtro que vino.
    test('debería agregar únicamente la condición del filtro enviado', async () => {
        findAllSpy = jest.spyOn(Traje, 'findAll').mockResolvedValue([] as any);

        const req = { query: { talle: 'S' } } as unknown as Request;
        const res = mockResponse();

        await obtenerTrajes(req, res);

        expect(findAllSpy).toHaveBeenCalledWith({ where: { talle: 'S' }, order: [['id', 'ASC']] });
    });

    // --- CASO 4: Error interno ---
    test('debería responder 500 con el mensaje de error si falla la consulta', async () => {
        findAllSpy = jest.spyOn(Traje, 'findAll').mockRejectedValue(new Error('DB caída'));

        const req = { query: {} } as unknown as Request;
        const res = mockResponse();

        await obtenerTrajes(req, res);

        expect(res.status).toHaveBeenCalledWith(500);
        expect(res.json).toHaveBeenCalledWith({
            ok: false,
            msg: 'Error al obtener trajes con filtros',
            error: 'DB caída',
        });
    });
});
