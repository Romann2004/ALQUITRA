import { Request, Response } from 'express';
import { Traje } from '../models/Traje';
import { Log } from '../models/Log';
import { EstadoTraje } from '../models/Enums';
import { Op } from 'sequelize';

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

export const obtenerTrajes = async (req: Request, res: Response) => {
    try {
        // 1. Extraemos los posibles filtros de la query de la URL
        const { codigo, talle, color, categoria, estado } = req.query;

        // 2. Construimos el objeto de condiciones dinámicamente
        // Si el filtro no viene en la URL, Sequelize simplemente lo ignora
        const whereConditions: any = {};

        if (codigo) {
            whereConditions.codigoEtiqueta = { [Op.iLike]: `%${codigo}%` };
        }
        if (talle) {
            whereConditions.talle = talle; // Filtro exacto para talle
        }
        if (color) {
            whereConditions.color = { [Op.iLike]: `%${color}%` };
        }
        if (categoria) {
            whereConditions.categoria = { [Op.iLike]: `%${categoria}%` };
        }
        if (estado) {
            whereConditions.estado = estado; // Filtro exacto por ser Enum
        }

        // 3. Ejecutamos la búsqueda con el objeto 'where' dinámico
        const trajes = await Traje.findAll({ 
            where: whereConditions,
            order: [['id', 'ASC']] 
        }); 

        // MSJ DE TOMI: Log opcional en MongoDB para trackear qué está buscando la gente, es decir, para futuros análisis de "más buscados"
        /* if (Object.keys(req.query).length > 0) {
            await Log.create({
                accion: 'FILTRAR_TRAJES',
                descripcion: `Búsqueda con filtros: ${JSON.stringify(req.query)}`,
                metadata: { filtros: req.query, resultadosEncontrados: trajes.length }
            });
        } */

        res.json({ ok: true, trajes });
    } catch (error: any) {
        console.error(error);
        res.status(500).json({ 
            ok: false, 
            msg: 'Error al obtener trajes con filtros',
            error: error.message 
        });
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
             

        