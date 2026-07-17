import { Request, Response } from 'express';
import { getDashboardStats } from '../../../src/controllers/DashboardController';
import { Traje } from '../../../src/models/Traje';
import Reserva from '../../../src/models/Reserva';
import Cliente from '../../../src/models/Cliente';

const mockResponse = () => {
    const res: any = {};
    res.status = jest.fn().mockReturnValue(res);
    res.json = jest.fn().mockReturnValue(res);
    return res as Response;
};

const NOMBRES_MESES = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];

describe('getDashboardStats', () => {
    let trajeCountSpy: jest.SpyInstance;
    let reservaFindAllSpy: jest.SpyInstance;
    let clienteFindByPkSpy: jest.SpyInstance;

    afterEach(() => {
        jest.restoreAllMocks();
    });

    // --- CASO 1: Happy path completo ---
    // Cubre en un solo test todas las piezas del dashboard: los 3 conteos
    // de trajes (total/disponibles/alquilados), el histórico mensual, las
    // últimas reservas, y el ranking de clientes fieles (incluyendo el
    // caso de un cliente que ya no existe -> "Cliente Anónimo").
    test('debería armar stats, histórico, últimas reservas y clientes fieles correctamente', async () => {
        // Traje.count se llama 3 veces dentro de un Promise.all, en este orden:
        // total, disponibles, alquilados.
        trajeCountSpy = jest.spyOn(Traje, 'count')
            .mockResolvedValueOnce(10) // total
            .mockResolvedValueOnce(4)  // disponibles
            .mockResolvedValueOnce(3); // alquilados (ALQUILADO + RESERVADO)

        // Dos reservas retiradas "hoy" para poder verificar de forma
        // determinística el conteo del mes actual en el histórico,
        // sin depender de una fecha fija que se vuelva vieja con el tiempo.
        const hoyISO = new Date().toISOString().split('T')[0];
        const reservasRecientesMock = [
            { id: 1, fechaRetiro: hoyISO },
            { id: 2, fechaRetiro: hoyISO },
        ];
        const ultimasReservasMock = [{ id: 4 }, { id: 3 }, { id: 2 }, { id: 1 }];
        const topReservasMock = [
            { clienteId: 1, totalAlquileres: '5' },
            { clienteId: 2, totalAlquileres: '3' },
        ];

        // Reserva.findAll también se llama 3 veces en secuencia (no en
        // paralelo): reservasRecientes, ultimasReservas y topReservas.
        reservaFindAllSpy = jest.spyOn(Reserva, 'findAll')
            .mockResolvedValueOnce(reservasRecientesMock as any)
            .mockResolvedValueOnce(ultimasReservasMock as any)
            .mockResolvedValueOnce(topReservasMock as any);

        // clienteId 1 existe, clienteId 2 ya no (fue borrado/no encontrado).
        clienteFindByPkSpy = jest.spyOn(Cliente, 'findByPk').mockImplementation((id: any) => {
            if (id === 1) return Promise.resolve({ nombre: 'Manuel' } as any);
            return Promise.resolve(null);
        });

        const req = {} as Request;
        const res = mockResponse();

        await getDashboardStats(req, res);

        expect(trajeCountSpy).toHaveBeenCalledTimes(3);
        expect(reservaFindAllSpy).toHaveBeenCalledTimes(3);

        const body = (res.json as jest.Mock).mock.calls[0][0];

        expect(body.ok).toBe(true);

        // otros = total - (disponibles + alquilados) = 10 - (4 + 3) = 3
        expect(body.stats).toEqual({
            totalTrajes: 10,
            disponibles: 4,
            alquilados: 3,
            otros: 3,
        });

        // El histórico cubre 6 meses (mes actual + 5 anteriores) y el mes
        // actual queda siempre último en el array, con las 2 reservas de hoy.
        const mesActual = NOMBRES_MESES[new Date().getMonth()];
        expect(body.historico.categorias).toHaveLength(6);
        expect(body.historico.categorias[5]).toBe(mesActual);
        expect(body.historico.datos[5]).toBe(2);
        expect(body.historico.rawReservas).toBe(reservasRecientesMock);

        expect(body.ultimasReservas).toBe(ultimasReservasMock);

        expect(body.clientesFieles).toEqual([
            { id: 1, nombre: 'Manuel', totalAlquileres: 5 },
            { id: 2, nombre: 'Cliente Anónimo', totalAlquileres: 3 },
        ]);
    });

    // --- CASO 2: Sin clientes frecuentes ---
    // Si no hay reservas todavía, el ranking de clientes fieles debe
    // quedar vacío sin romper nada (no debería llamarse a Cliente.findByPk).
    test('debería devolver clientesFieles vacío si no hay reservas', async () => {
        trajeCountSpy = jest.spyOn(Traje, 'count')
            .mockResolvedValueOnce(0)
            .mockResolvedValueOnce(0)
            .mockResolvedValueOnce(0);

        reservaFindAllSpy = jest.spyOn(Reserva, 'findAll')
            .mockResolvedValueOnce([] as any)
            .mockResolvedValueOnce([] as any)
            .mockResolvedValueOnce([] as any);

        clienteFindByPkSpy = jest.spyOn(Cliente, 'findByPk');

        const req = {} as Request;
        const res = mockResponse();

        await getDashboardStats(req, res);

        expect(clienteFindByPkSpy).not.toHaveBeenCalled();

        const body = (res.json as jest.Mock).mock.calls[0][0];
        expect(body.clientesFieles).toEqual([]);
        expect(body.stats).toEqual({ totalTrajes: 0, disponibles: 0, alquilados: 0, otros: 0 });
    });

    // --- CASO 3: Error interno ---
    // Si cualquiera de las consultas falla, debe responder 500 sin filtrar
    // el detalle del error.
    test('debería responder 500 si ocurre un error inesperado', async () => {
        trajeCountSpy = jest.spyOn(Traje, 'count').mockRejectedValue(new Error('DB caída'));

        const req = {} as Request;
        const res = mockResponse();

        await getDashboardStats(req, res);

        expect(res.status).toHaveBeenCalledWith(500);
        expect(res.json).toHaveBeenCalledWith({ ok: false, msg: 'Error al obtener estadísticas' });
    });
});
