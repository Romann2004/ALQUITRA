import { Request, Response } from 'express';
import { eliminarTraje } from '../../../src/controllers/TrajeControllers';
import { Traje } from '../../../src/models/Traje';
import Reserva from '../../../src/models/Reserva';
import { Log } from '../../../src/models/Log';

// IMPORTANTE: no usamos jest.mock('.../Traje') ni jest.mock('.../Reserva')
// porque TrajeControllers.ts importa Reserva.ts, y ese archivo define las
// asociaciones de Sequelize (Traje.hasMany(Reserva), Reserva.belongsTo(Traje),
// etc.) al cargarse. Un jest.mock() de módulo completo reemplaza la clase
// entera y rompe esas asociaciones. jest.spyOn solo pisa el método puntual
// que necesitamos, dejando las clases reales intactas.

const mockResponse = () => {
    const res: any = {};
    res.status = jest.fn().mockReturnValue(res);
    res.json = jest.fn().mockReturnValue(res);
    return res as Response;
};

describe('eliminarTraje', () => {
    let findByPkSpy: jest.SpyInstance;
    let countSpy: jest.SpyInstance;
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

        const req = { params: { id: '999' } } as unknown as Request;
        const res = mockResponse();

        await eliminarTraje(req, res);

        expect(res.status).toHaveBeenCalledWith(404);
        expect(res.json).toHaveBeenCalledWith({ mensaje: 'No existe el traje' });
    });

    // --- CASO 2: Traje con reservas activas ---
    // No debe permitir borrar un traje que tiene reservas PENDIENTE o
    // RETIRADO asociadas (destroy no debe llamarse).
    test('debería impedir el borrado si el traje tiene reservas pendientes o retiradas', async () => {
        const destroyMock = jest.fn();
        findByPkSpy = jest.spyOn(Traje, 'findByPk').mockResolvedValue(
            { id: 1, codigoEtiqueta: 'ABC123', destroy: destroyMock } as any
        );
        countSpy = jest.spyOn(Reserva, 'count').mockResolvedValue(2);

        const req = { params: { id: '1' } } as unknown as Request;
        const res = mockResponse();

        await eliminarTraje(req, res);

        expect(destroyMock).not.toHaveBeenCalled();
        expect(res.status).toHaveBeenCalledWith(400);
        expect(res.json).toHaveBeenCalledWith({
            ok: false,
            mensaje: 'No se puede eliminar: El traje tiene reservas pendientes o está alquilado.',
        });
    });

    // --- CASO 3: Borrado exitoso ---
    // Sin reservas activas, debe destruir el registro y loguear la acción.
    test('debería eliminar el traje si no tiene reservas activas', async () => {
        const destroyMock = jest.fn().mockResolvedValue(true);
        findByPkSpy = jest.spyOn(Traje, 'findByPk').mockResolvedValue(
            { id: 1, codigoEtiqueta: 'ABC123', destroy: destroyMock } as any
        );
        countSpy = jest.spyOn(Reserva, 'count').mockResolvedValue(0);

        const req = { params: { id: '1' } } as unknown as Request;
        const res = mockResponse();

        await eliminarTraje(req, res);

        expect(destroyMock).toHaveBeenCalled();
        expect(logCreateSpy).toHaveBeenCalledWith(expect.objectContaining({ accion: 'ELIMINAR_TRAJE' }));
        expect(res.json).toHaveBeenCalledWith({ ok: true, mensaje: 'Traje eliminado correctamente' });
    });

    // --- CASO 4: Error interno ---
    test('debería responder 500 si ocurre un error inesperado', async () => {
        findByPkSpy = jest.spyOn(Traje, 'findByPk').mockRejectedValue(new Error('DB caída'));

        const req = { params: { id: '1' } } as unknown as Request;
        const res = mockResponse();

        await eliminarTraje(req, res);

        expect(res.status).toHaveBeenCalledWith(500);
        expect(res.json).toHaveBeenCalledWith({ ok: false, error: 'Error al eliminar' });
    });
});
