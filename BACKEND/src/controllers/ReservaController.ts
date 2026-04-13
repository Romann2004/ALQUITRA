import { Request, Response } from "express";
import Reserva from "../models/Reserva";
import { Traje } from "../models/Traje";
import { Op } from "sequelize";
import { Log } from "../models/Log";
import Cliente from "../models/Cliente";

export const postReserva = async (req: Request, res: Response) => {
    const { fechaRetiro, fechaDevolucion, senia, clienteId, trajeId } = req.body;

    try {
        // 1. Validar que el traje no esté reservado en esas fechas
        const reservaExistente = await Reserva.findOne({
            where: {
                trajeId,
                [Op.or]: [
                    {
                        fechaRetiro: { [Op.between]: [fechaRetiro, fechaDevolucion] }
                    },
                    {
                        fechaDevolucion: { [Op.between]: [fechaRetiro, fechaDevolucion] }
                    }
                ]
            }
        });

        if (reservaExistente) {
            return res.status(400).json({
                msg: 'El traje ya está reservado para esas fechas.'
            });
        }

        // 2. Si está libre, creamos la reserva
        const nuevaReserva: any = await Reserva.create({
            fechaRetiro,
            fechaDevolucion,
            senia,
            clienteId,
            trajeId
        });

        await Log.create({
            accion: 'CREAR_RESERVA',
            descripcion: `Se creó la reserva #${nuevaReserva.id} para el cliente ${clienteId} y traje ${trajeId}`,
            metadata: { clienteId: clienteId, trajeId: trajeId }
        });

        res.json({
            msg: 'Reserva creada con éxito',
            nuevaReserva
        });
    } catch (error) {
        res.status(500).json({
            msg: 'Error al crear la reserva',
            error
        });
    }
}

export const getReservas = async (req: Request, res: Response) => {
    try {

        const reservas = await Reserva.findAll({
            include: [
                { model: Cliente, attributes: ['nombre', 'dni'] },
                { model: Traje, attributes: ['categoria', 'talle', 'color'] }
            ]
        });
        res.json(reservas);
    } catch (error) {
        res.status(500).json({ msg: 'Error al obtener reservas', error });
    }
}
