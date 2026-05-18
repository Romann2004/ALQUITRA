import { Request, Response } from "express";
import { Traje } from "../models/Traje";
import { Op } from "sequelize";
import { Log } from "../models/Log";
import Reserva from "../models/Reserva";
import Cliente from "../models/Cliente";
import { EstadoReserva } from "../models/Enums";

export const postReserva = async (req: Request, res: Response) => {
  const { fechaRetiro, fechaDevolucion, senia, clienteId, trajeId } = req.body;

  try {
    // --- 1. VALIDACIONES BÁSICAS ---
    if (senia < 0) {
      return res.status(400).json({ msg: "La seña no puede ser negativa." });
    }

    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0); // Reseteamos la hora para comparar solo fechas
    const retiro = new Date(fechaRetiro);
    const devolucion = new Date(fechaDevolucion);

    if (retiro < hoy) {
      return res
        .status(400)
        .json({ msg: "La fecha de retiro no puede ser anterior a hoy." });
    }
    if (devolucion <= retiro) {
      return res
        .status(400)
        .json({ msg: "La fecha de devolución debe ser posterior al retiro." });
    }

    // --- 2. VALIDACIÓN DE SUPERPOSICIÓN (Fórmula segura) ---
    const reservaExistente = await Reserva.findOne({
      where: {
        trajeId,
        estado: {
          [Op.notIn]: [EstadoReserva.CANCELADO, EstadoReserva.COMPLETADO],
        }, // Solo consideramos reservas activas
        fechaRetiro: { [Op.lt]: fechaDevolucion },
        fechaDevolucion: { [Op.gt]: fechaRetiro },
      },
    });

    if (reservaExistente) {
      return res
        .status(400)
        .json({ msg: "El traje ya está reservado para esas fechas." });
    }

    const nuevaReserva: any = await Reserva.create({
      fechaRetiro,
      fechaDevolucion,
      senia,
      clienteId,
      trajeId,
      estado: EstadoReserva.PENDIENTE,
    });

    await Log.create({
      accion: "CREAR_RESERVA",
      descripcion: `Se creó la reserva #${nuevaReserva.id} para el cliente ${clienteId} y traje ${trajeId}`,
      metadata: { clienteId: clienteId, trajeId: trajeId },
    });

    res.json({ msg: "Reserva creada con éxito", reserva: nuevaReserva });
  } catch (error) {
    console.error("Error técnico:", error);
    res.status(500).json({ msg: "Error al crear la reserva", error });
  }
};

export const getReservas = async (req: Request, res: Response) => {
  try {
    const reservas = await Reserva.findAll({
      include: [
        { model: Cliente, attributes: ["nombre", "dni"] },
        { model: Traje, attributes: ["categoria", "talle", "color"] },
      ],
    });
    res.json(reservas);
  } catch (error) {
    res.status(500).json({ msg: "Error al obtener reservas", error });
  }
};

export const updateReserva = async (req: Request, res: Response) => {
  const id = req.params.id as string;
  const { fechaRetiro, fechaDevolucion, senia, trajeId, estado } = req.body;

  try {
    const reserva = (await Reserva.findByPk(id)) as any;
    if (!reserva) {
      return res.status(404).json({ msg: "No existe esa reserva" });
    }

    // --- 1. VALIDACIONES BÁSICAS EN EDICIÓN ---
    if (senia !== undefined && senia < 0) {
      return res.status(400).json({ msg: "La seña no puede ser negativa" });
    }

    // Solo validamos las fechas si ambas vienen en el body
    if (fechaRetiro && fechaDevolucion) {
      const retiro = new Date(fechaRetiro);
      const devolucion = new Date(fechaDevolucion);

      if (devolucion <= retiro) {
        return res
          .status(400)
          .json({
            msg: "La fecha de devolución debe ser posterior al retiro.",
          });
      }

      // --- 2. VALIDACIÓN DE SUPERPOSICIÓN EN EDICIÓN ---
      // Verificamos que no pise otra reserva distinta a la que estamos editando
      const reservaExistente = await Reserva.findOne({
        where: {
          trajeId: trajeId || reserva.trajeId, //usamos el nuevo traje o el que ya tenía
          id: { [Op.ne]: id }, //Excluímos esta misma reserva de la búsqueda
          estado: {
            [Op.notIn]: [EstadoReserva.CANCELADO, EstadoReserva.COMPLETADO],
          },
          fechaRetiro: { [Op.lt]: fechaDevolucion },
          fechaDevolucion: { [Op.gt]: fechaRetiro },
        },
      });

      if (reservaExistente) {
        return res
          .status(400)
          .json({
            msg: "El traje ya está reservado en esas fechas por otro cliente.",
          });
      }
    }

    await reserva.update(req.body);
    await registrarLog(
      "ACTUALIZAR_RESERVA",
      Number(id),
      "Se actualizó la reserva",
    );

    res.json({ msg: "Reserva actualizada", reserva });
  } catch (error) {
    console.error("Error técnico:", error);
    res.status(500).json({ msg: "Error al actualizar la reserva", error });
  }
};

export const updateEstadoReserva = async (req: Request, res: Response) => {
  const id = req.params.id as string;
  const { estado } = req.body;

  const estadosValidos = ["PENDIENTE", "RETIRADO", "COMPLETADO", "CANCELADO"];
  if (!estadosValidos.includes(estado)) {
    return res.status(400).json({ msg: "Estado no válido" });
  }

  try {
    const reserva = await Reserva.findByPk(id);
    if (!reserva) return res.status(404).json({ msg: "No existe esa reserva" });

    await reserva.update({ estado });
    await registrarLog(
      "ACTUALIZAR_ESTADO_RESERVA",
      Number(id),
      `Se actualizó el estado de la reserva a ${estado}`,
    );
    res.json({ msg: "Estado actualizado" });
  } catch (error) {
    res.status(500).json({ msg: "Error al cambiar el estado de la reserva" });
  }
};

export const deleteReserva = async (req: Request, res: Response) => {
  const id = req.params.id as string;
  try {
    const reserva = await Reserva.findByPk(id);
    if (!reserva) {
      return res.status(404).json({ msg: "No existe una reserva con ese id" });
    }
    await reserva.destroy();
    await registrarLog("ELIMINAR_RESERVA", Number(id), "Se eliminó la reserva");
    res.json({ msg: "Reserva eliminada con éxito" });
  } catch (error) {
    res.status(500).json({ msg: "Error al eliminar la reserva", error });
  }
};

const registrarLog = async (accion: string, id: number, detalle: string) => {
  await Log.create({
    accion,
    descripcion: `Reserva #${id}: ${detalle}`,
    metadata: { reservaId: id },
  });
};
