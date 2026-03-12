import { Request, Response } from 'express';
import { Traje } from '../models/Traje';
import { Log } from '../models/Log';
import { EstadoTraje } from '../models/Enums';

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
            estado: EstadoTraje.DISPONIBLE // Por defecto nace disponible
        });

        await Log.create({
            accion: 'CREAR_TRAJE',
            descripcion: `Se registró un nuevo traje: ${codigoEtiqueta}`,
            metadata: {trajeId: nuevoTraje.id},
        })

        res.status(201).json({
            ok: true,
            msg: 'Traje y Log registrados con éxito',
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

export const actualizarTraje = async (req: Request, res: Response) => {
    try {
        const id = Number(req.params.id);
        const { codigoEtiqueta, talle, color, categoria, precioAlquilerBase } = req.body;

        const traje = await Traje.findByPk(id);
        if (!traje) return res.status(404).json({ mensaje: 'Traje no encontrado' });

        // Actualizamos en Postgre
        await traje.update ({ codigoEtiqueta, talle, color, categoria, precioAlquilerBase });

        //Registramos el Log en Mongo
        await Log.create({
            accion: 'ACTUALIZAR_TRAJE',
            descripcion: `Se actualizó el traje con ID: ${id}`,
            metadata: { trajeId: id }
        });

        res.json({ ok: true, mensaje: 'Traje actualizado', traje });
    } catch (error) {
        res.status(500).json({ ok: false, error: 'Error al actualizar' })
    }
};

export const actualizarParcialTraje = async (req: Request, res: Response) => {
    try{
        const id = Number(req.params.id);
        const traje = await Traje.findByPk(id);

        if(!traje) return res.status(404).json({ ok: false, mensaje: 'No existe el traje' });

        // Solo actualizamos los campos que vienen en el body
        await traje.update(req.body);

        await Log.create({
            accion: 'ACTUALIZAR_PARCIAL_TRAJE',
            descripcion: `Se actualizaron algunos campos del traje con ID: ${id}`,
            metadata: { trajeId: id, camposCambiados: Object.keys(req.body) }
        });

        res.json({ ok: true, mensaje: 'Traje actualizado (parcial)', traje });
    }   catch (error) {
        res.status(500).json({ ok: false, error: 'Error al actualizar parcialmente' })       
    }

}

export const eliminarTraje = async (req: Request, res: Response) => {
    try{
        const id = Number(req.params.id);
        const traje = await Traje.findByPk(id);

        if (!traje) return res.status(404).json({ mensaje: 'No existe el traje' });

        const codigoCopiado = traje.codigoEtiqueta;
        await traje.destroy(); // Borra de postgre

        //Registramos el log en mongo
        await Log.create({
            accion: 'ELIMINAR_TRAJE',
            descripcion: `Se eliminó el traje con ID: ${id}`,
            metadata: { trajeId: id }
        });

        res.json({ ok: true, mensaje: 'Traje eliminado correctamente' });
    } catch (error) {
        res.status(500).json({ ok: false, error: 'Error al eliminar' });
    }
};
             

        