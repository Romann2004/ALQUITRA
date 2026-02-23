import { Request, Response } from 'express';
import { Traje } from '../models/Traje';

export const crearTraje = async (req: Request, res: Response) => {
    try {
        // Extraemos los datos que vienen del frontend o Postman
        const { codigoEtiqueta, talle, color, categoria, precioAlquilerBase } = req.body;

        // Creamos el registro en PostgreSQL usando Sequelize
        const nuevoTraje = await Traje.create({
            codigoEtiqueta,
            talle,
            color,
            categoria,
            precioAlquilerBase,
            estado: 'Disponible' // Por defecto nace disponible
        });

        res.status(201).json({
            ok: true,
            msg: 'Traje registrado con éxito',
            traje: nuevoTraje
        });
    } catch (error: any) {
        console.error(error);
        res.status(500).json({
            ok: false,
            msg: 'Error al crear el traje',
            error: error.message
        });
    }
};

export const obtenerTrajes = async (_req: Request, res: Response) => {
    try {
        const trajes = await Traje.findAll();
        res.json({ ok: true, trajes });
    } catch (error) {
        res.status(500).json({ ok: false, msg: 'Error al obtener trajes' });
    }
};