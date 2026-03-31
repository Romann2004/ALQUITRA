import { Request, Response } from 'express';
import { Traje } from '../models/Traje';

export const getDashboardStats = async (req: Request, res: Response) => {
    try {
        // Ejecutamos todas las consultas en paralelo para que sea más rápido
        const [total, disponibles, alquilados] = await Promise.all([
            Traje.count(), // 1. Contamos cuántos trajes hay en total
            Traje.count({ where: { estado: 'Disponible' } }), // 2. Contamos cuántos trajes están disponibles
            Traje.count({ where: { estado: 'Alquilado' } }) // 3. Contamos los que están en alquiler
        ]);

        res.json({
            ok: true,
            stats: {
                totalTrajes: total,
                disponibles,
                alquilados,
                otros: total - (disponibles + alquilados)
            }
        });

    } catch (error) {
        console.error(error);
        res.status(500).json({ ok: false, msg: 'Error al obtener estadísticas' });
    }
};