import { Request, Response } from "express";
import { Traje } from "../models/Traje";
import { Op } from "sequelize";
import { Log } from "../models/Log";
import Reserva from "../models/Reserva";
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

export const updateReserva = async (req: Request, res: Response) => {
    const id = req.params.id as string; 

    try {
        const reserva = await Reserva.findByPk(id) as any;
        if (!reserva) {
            return res.status(404).json({ msg: 'No existe esa reserva' });
        }
       
        await reserva.update(req.body);
        
        res.json({ msg: 'Reserva actualizada', reserva });
    } catch (error) {
        console.error("Error técnico:", error);
        res.status(500).json({ msg: 'Error al actualizar la reserva', error });
    }
};

export const updateEstadoReserva = async (req: Request, res: Response) => {
    const id = req.params.id as string;
    const { estado } = req.body;

    const estadosValidos = ['PENDIENTE', 'RETIRADO', 'COMPLETADO', 'CANCELADO'];
    if (!estadosValidos.includes(estado)) {
        return res.status(400).json({ msg: 'Estado no válido' });
    }

    try {
        const reserva = await Reserva.findByPk(id);
        if (!reserva) return res.status(404).json({ msg: 'No existe esa reserva' });

        await reserva.update({ estado });
        res.json({ msg: 'Estado actualizado' });
    } catch (error) {
        res.status(500).json({ msg: 'Error al cambiar el estado de la reserva' });
    }
};

export const deleteReserva = async (req: Request, res: Response) => {
    const id = req.params.id as string;
    try {
        const reserva = await Reserva.findByPk(id);
        if (!reserva) {
            return res.status(404).json({ msg: 'No existe una reserva con ese id' });
        }
        await reserva.destroy();
        res.json({ msg: 'Reserva eliminada con éxito' });
    } catch (error) {
        res.status(500).json({ msg: 'Error al eliminar la reserva', error });
    }
}
