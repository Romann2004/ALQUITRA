import { Request, Response } from 'express';
import { actualizarParcialTraje } from '../../../src/controllers/TrajeControllers';
import { Traje } from '../../../src/models/Traje';
import { Log } from '../../../src/models/Log';

const mockResponse = () => {
    const res: any = {};
    res.status = jest.fn().mockReturnValue(res);
    res.json = jest.fn().mockReturnValue(res);
    return res as Response;
};

describe('actualizarParcialTraje', () => {
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

        await actualizarParcialTraje(req, res);

        expect(res.status).toHaveBeenCalledWith(404);
        expect(res.json).toHaveBeenCalledWith({ ok: false, mensaje: 'No existe el traje' });
    });

    // --- CASO 2: Actualización parcial exitosa ---
    // Debe pasar el body completo tal cual a traje.update() (permite
    // actualizar solo algunos campos) y loguear cuáles cambiaron.
    test('debería actualizar solo los campos enviados y registrar cuáles cambiaron', async () => {
        const updateMock = jest.fn().mockResolvedValue(true);
        findByPkSpy = jest.spyOn(Traje, 'findByPk').mockResolvedValue({ id: 1, update: updateMock } as any);

        const req = { params: { id: '1' }, body: { color: 'Rojo' } } as unknown as Request;
        const res = mockResponse();

        await actualizarParcialTraje(req, res);

        expect(updateMock).toHaveBeenCalledWith({ color: 'Rojo' });
        expect(logCreateSpy).toHaveBeenCalledWith(
            expect.objectContaining({
                accion: 'ACTUALIZAR_PARCIAL_TRAJE',
                metadata: expect.objectContaining({ trajeId: 1, camposCambiados: ['color'] }),
            })
        );
        expect(res.json).toHaveBeenCalledWith(
            expect.objectContaining({ ok: true, mensaje: 'Traje actualizado (parcial)' })
        );
    });

    // --- CASO 3: Error interno ---
    test('debería responder 500 si ocurre un error inesperado', async () => {
        findByPkSpy = jest.spyOn(Traje, 'findByPk').mockRejectedValue(new Error('DB caída'));

        const req = { params: { id: '1' }, body: {} } as unknown as Request;
        const res = mockResponse();

        await actualizarParcialTraje(req, res);

        expect(res.status).toHaveBeenCalledWith(500);
        expect(res.json).toHaveBeenCalledWith({ ok: false, error: 'Error al actualizar parcialmente' });
    });
});
