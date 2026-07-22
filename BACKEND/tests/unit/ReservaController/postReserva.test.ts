import { Request, Response } from 'express';
import { postReserva } from '../../../src/controllers/ReservaController';
import Reserva from '../../../src/models/Reserva';
import { Traje } from '../../../src/models/Traje';
import { Log } from '../../../src/models/Log';
import { EstadoReserva, EstadoTraje } from '../../../src/models/Enums';

const mockResponse = () => {
    const res: any = {};
    res.status = jest.fn().mockReturnValue(res);
    res.json = jest.fn().mockReturnValue(res);
    return res as Response;
};

// Fechas dinámicas para que el test no dependa de una fecha fija que
// eventualmente queda en el pasado (esNuevaReserva exige retiro >= hoy).
const fechaFutura = (diasDesdeHoy: number) => {
    const d = new Date();
    d.setDate(d.getDate() + diasDesdeHoy);
    return d.toISOString().split('T')[0];
};

describe('postReserva', () => {
    let createSpy: jest.SpyInstance;
    let trajeFindByPkSpy: jest.SpyInstance;
    let reservasFindAllSpy: jest.SpyInstance;
    let reservasCountSpy: jest.SpyInstance;
    let logCreateSpy: jest.SpyInstance;

    beforeEach(() => {
        logCreateSpy = jest.spyOn(Log, 'create').mockResolvedValue({} as any);
    });

    afterEach(() => {
        jest.restoreAllMocks();
    });

    // --- CASO 1: Seña inválida ---
    // Debe cortar antes de tocar la base de datos.
    test('debería responder 400 si la seña es inválida', async () => {
        reservasFindAllSpy = jest.spyOn(Reserva, 'findAll');

        const req = {
            body: {
                fechaRetiro: fechaFutura(5),
                fechaDevolucion: fechaFutura(10),
                senia: 999,
                clienteId: 1,
                trajeId: 1,
            },
        } as Request;
        const res = mockResponse();

        await postReserva(req, res);

        expect(reservasFindAllSpy).not.toHaveBeenCalled();
        expect(res.status).toHaveBeenCalledWith(400);
        expect(res.json).toHaveBeenCalledWith({ msg: 'La seña no puede ser negativa.' });
    });

    // --- CASO 2: Fechas inválidas ---
    test('debería responder 400 si la fecha de devolución no es posterior al retiro', async () => {
        const req = {
            body: {
                fechaRetiro: fechaFutura(10),
                fechaDevolucion: fechaFutura(5),
                senia: 100,
                clienteId: 1,
                trajeId: 1,
            },
        } as Request;
        const res = mockResponse();

        await postReserva(req, res);

        expect(res.status).toHaveBeenCalledWith(400);
        expect(res.json).toHaveBeenCalledWith({
            msg: 'La fecha de devolución debe ser posterior al retiro.',
        });
    });

    // --- CASO 3: Superposición con otra reserva ---
    // Si ya existe una reserva activa para ese traje en fechas que se
    // solapan, no debe crearse la nueva.
    test('debería responder 400 si el traje ya está reservado para esas fechas', async () => {
        trajeFindByPkSpy = jest.spyOn(Traje, 'findByPk').mockResolvedValue({
            cantidad: 1,
            estado: EstadoTraje.DISPONIBLE,
        } as any);
        reservasFindAllSpy = jest.spyOn(Reserva, 'findAll').mockResolvedValue([
            {
                fechaRetiro: fechaFutura(5),
                fechaDevolucion: fechaFutura(10),
                cantidad: 1,
            },
        ] as any);
        createSpy = jest.spyOn(Reserva, 'create');

        const req = {
            body: {
                fechaRetiro: fechaFutura(5),
                fechaDevolucion: fechaFutura(10),
                senia: 100,
                clienteId: 1,
                trajeId: 1,
            },
        } as Request;
        const res = mockResponse();

        await postReserva(req, res);

        expect(createSpy).not.toHaveBeenCalled();
        expect(res.status).toHaveBeenCalledWith(400);
        expect(res.json).toHaveBeenCalledWith({ msg: 'El traje ya está reservado para esas fechas.' });
    });

    // --- CASO 4: Creación exitosa ---
    // Debe crear la reserva en PENDIENTE, marcar el traje como ALQUILADO y
    // registrar el log.
    test('debería crear la reserva y marcar el traje como ALQUILADO', async () => {
        reservasFindAllSpy = jest.spyOn(Reserva, 'findAll').mockResolvedValue([] as any);
        createSpy = jest.spyOn(Reserva, 'create').mockResolvedValue(
            { id: 1, clienteId: 1, trajeId: 1, estado: EstadoReserva.PENDIENTE } as any
        );
        const trajeUpdateMock = jest.fn().mockResolvedValue(true);
        trajeFindByPkSpy = jest.spyOn(Traje, 'findByPk').mockResolvedValue({
            cantidad: 1,
            estado: EstadoTraje.DISPONIBLE,
            update: trajeUpdateMock,
        } as any);
        reservasCountSpy = jest.spyOn(Reserva, 'count').mockResolvedValue(1 as any);

        const req = {
            body: {
                fechaRetiro: fechaFutura(5),
                fechaDevolucion: fechaFutura(10),
                senia: 100,
                clienteId: 1,
                trajeId: 1,
            },
        } as Request;
        const res = mockResponse();

        await postReserva(req, res);

        expect(createSpy).toHaveBeenCalledWith(
            expect.objectContaining({ senia: 100, clienteId: 1, trajeId: 1, estado: EstadoReserva.PENDIENTE })
        );
        expect(trajeFindByPkSpy).toHaveBeenCalledWith(1);
        expect(reservasCountSpy).toHaveBeenCalled();
        expect(trajeUpdateMock).toHaveBeenCalledWith({ estado: EstadoTraje.ALQUILADO });
        expect(logCreateSpy).toHaveBeenCalledWith(expect.objectContaining({ accion: 'CREAR_RESERVA' }));
        expect(res.json).toHaveBeenCalledWith(
            expect.objectContaining({ msg: 'Reserva creada con éxito' })
        );
    });

    // --- CASO 5: Error interno ---
    test('debería responder 500 si ocurre un error inesperado', async () => {
        reservasFindAllSpy = jest.spyOn(Reserva, 'findAll').mockResolvedValue([] as any);
        trajeFindByPkSpy = jest.spyOn(Traje, 'findByPk').mockResolvedValue({ cantidad: 1, estado: EstadoTraje.DISPONIBLE } as any);
        createSpy = jest.spyOn(Reserva, 'create').mockRejectedValue(new Error('DB caída'));

        const req = {
            body: {
                fechaRetiro: fechaFutura(5),
                fechaDevolucion: fechaFutura(10),
                senia: 100,
                clienteId: 1,
                trajeId: 1,
            },
        } as Request;
        const res = mockResponse();

        await postReserva(req, res);

        expect(res.status).toHaveBeenCalledWith(500);
        expect(res.json).toHaveBeenCalledWith(
            expect.objectContaining({ msg: 'Error al crear la reserva' })
        );
    });
});
