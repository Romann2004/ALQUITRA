import { Request, Response } from 'express';
import { actualizarTraje } from '../../../src/controllers/TrajeControllers';
import { Traje } from '../../../src/models/Traje';
import { Log } from '../../../src/models/Log';

const mockResponse = () => {
    const res: any = {};
    res.status = jest.fn().mockReturnValue(res);
    res.json = jest.fn().mockReturnValue(res);
    return res as Response;
};

describe('actualizarTraje', () => {
    let findByPkSpy: jest.SpyInstance;
    let logCreateSpy: jest.SpyInstance;

    beforeEach(() => {
        logCreateSpy = jest.spyOn(Log, 'create').mockResolvedValue({} as any);
    });

    afterEach(() => {
        jest.restoreAllMocks();
    });

    // --- CASO 1: Traje inexistente ---
    test('debería responder 404 si el traje no existe', async () => {
        findByPkSpy = jest.spyOn(Traje, 'findByPk').mockResolvedValue(null);

        const req = { params: { id: '999' }, body: {} } as unknown as Request;
        const res = mockResponse();

        await actualizarTraje(req, res);

        expect(res.status).toHaveBeenCalledWith(404);
        expect(res.json).toHaveBeenCalledWith({ mensaje: 'Traje no encontrado' });
    });

    // --- CASO 2: Actualización exitosa (reemplazo completo) ---
    test('debería actualizar el traje con los campos del body y registrar el log', async () => {
        const updateMock = jest.fn().mockResolvedValue(true);
        findByPkSpy = jest.spyOn(Traje, 'findByPk').mockResolvedValue({ id: 1, update: updateMock } as any);

        const req = {
            params: { id: '1' },
            body: { codigoEtiqueta: 'XYZ789', talle: 'L', color: 'Azul', categoria: 'Gala', precioAlquilerBase: 150 },
        } as unknown as Request;
        const res = mockResponse();

        await actualizarTraje(req, res);

        expect(updateMock).toHaveBeenCalledWith({
            codigoEtiqueta: 'XYZ789',
            talle: 'L',
            color: 'Azul',
            categoria: 'Gala',
            precioAlquilerBase: 150,
        });
        expect(logCreateSpy).toHaveBeenCalledWith(expect.objectContaining({ accion: 'ACTUALIZAR_TRAJE' }));
        expect(res.json).toHaveBeenCalledWith(
            expect.objectContaining({ ok: true, mensaje: 'Traje actualizado' })
        );
    });

    // --- CASO 3: Error interno ---
    test('debería responder 500 si ocurre un error inesperado', async () => {
        findByPkSpy = jest.spyOn(Traje, 'findByPk').mockRejectedValue(new Error('DB caída'));

        const req = { params: { id: '1' }, body: {} } as unknown as Request;
        const res = mockResponse();

        await actualizarTraje(req, res);

        expect(res.status).toHaveBeenCalledWith(500);
        expect(res.json).toHaveBeenCalledWith({ ok: false, error: 'Error al actualizar' });
    });
});
