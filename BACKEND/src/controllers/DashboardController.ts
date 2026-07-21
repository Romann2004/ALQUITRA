import { Request, Response } from 'express';
import { Traje } from '../models/Traje';
import Reserva from '../models/Reserva'; 
import Cliente from '../models/Cliente'; 
import { Op } from 'sequelize';          
import { sequelize } from '../config/db';
import { EstadoTraje } from '../models/Enums'; 

export const getDashboardStats = async (req: Request, res: Response) => {
try {
        const [total, disponibles, alquilados] = await Promise.all([
            Traje.count(), 
            Traje.count({ where: { estado: EstadoTraje.DISPONIBLE } }), 
            Traje.count({ 
                where: { 
                    estado: {
                        [Op.in]: [EstadoTraje.BAJA]
                    } 
                } 
            }) 
        ]);

        const inicioBusqueda = new Date();
        inicioBusqueda.setMonth(inicioBusqueda.getMonth() - 5);
        inicioBusqueda.setDate(1); 

        // Histórico mensual para el gráfico
        const reservasRecientes = await Reserva.findAll({
            where: {
                fechaRetiro: {
                    [Op.gte]: inicioBusqueda.toISOString().split('T')[0]
                }
            },
            include: [
                {model: Cliente, attributes: ['nombre']},
                {model: Traje, attributes: ['categoria', 'talle', 'color']}
            ],
            order: [['fechaRetiro', 'DESC']]
        });

        // Últimos 4 alquileres con sus relaciones
        const ultimasReservas = await Reserva.findAll({
            limit: 4,
            order: [['id', 'DESC']], 
            include: [
                { model: Cliente, attributes: ['id', 'nombre'] },
                { model: Traje, attributes: ['id', 'categoria', 'color', 'talle'] }
            ]
        });

        // --- SOLUCIÓN BULLETPROOF PARA POSTGRESQL (GROUP BY) ---
        // 1. Conseguimos los IDs agrupados de forma pura y limpia
        const topReservas = await Reserva.findAll({
            attributes: [
                'clienteId',
                [sequelize.fn('COUNT', sequelize.col('id')), 'totalAlquileres']
            ],
            group: ['clienteId'],
            order: [[sequelize.fn('COUNT', sequelize.col('id')), 'DESC']],
            limit: 3,
            raw: true
        });

        // 2. Mapeamos los IDs para traer los nombres en paralelo sin romper la consulta
        const clientesFieles = await Promise.all(
            topReservas.map(async (item: any) => {
                const cliente = await Cliente.findByPk(item.clienteId, { attributes: ['nombre'] });
                return {
                    id: item.clienteId,
                    nombre: cliente ? (cliente as any).nombre : 'Cliente Anónimo',
                    totalAlquileres: parseInt(item.totalAlquileres, 10) || 0
                };
            })
        );

        // Procesamiento del mapa de meses
        const nombresMeses = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
        const historicoMap: { [key: string]: number } = {};

        for (let i = 5; i >= 0; i--) {
            const d = new Date();
            d.setMonth(d.getMonth() - i);
            historicoMap[nombresMeses[d.getMonth()]] = 0;
        }

        reservasRecientes.forEach((reserva: any) => {
            const fecha = new Date(reserva.fechaRetiro);
            const nombreMes = nombresMeses[fecha.getMonth()];
            if (historicoMap[nombreMes] !== undefined) historicoMap[nombreMes]++;
        });

        res.json({
            ok: true,
            stats: {
                totalTrajes: total,
                disponibles,
                alquilados,
                otros: total - (disponibles + alquilados)
            },
            historico: {
                categorias: Object.keys(historicoMap),
                datos: Object.values(historicoMap),
                rawReservas: reservasRecientes // <-- ¡ESTA ES LA LÍNEA QUE FALTA AGREGAR!
            },
            ultimasReservas,
            clientesFieles
        });

    } catch (error) {
        console.error("Error crítico en Dashboard:", error);
        res.status(500).json({ ok: false, msg: 'Error al obtener estadísticas' });
    }
};
