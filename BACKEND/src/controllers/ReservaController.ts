import { Request, Response } from "express";
import { Traje } from "../models/Traje";
import { Op } from "sequelize";
import { Log } from "../models/Log";
import Reserva from "../models/Reserva";
import Cliente from "../models/Cliente";
import { EstadoReserva, EstadoTraje } from "../models/Enums";

export const postReserva = async (req: Request, res: Response) => {
  const { fechaRetiro, fechaDevolucion, senia, clienteId, trajeId } = req.body;

  try {
    // 1. Validaciones
    const errorSenia = validarSenia(senia);
    if (errorSenia) return res.status(400).json({ msg: errorSenia });

    const errorFechas = validarFechas(fechaRetiro, fechaDevolucion, true);
    if (errorFechas) return res.status(400).json({ msg: errorFechas });

    const errorSuperposicion = await validarSuperposicion(trajeId, fechaRetiro, fechaDevolucion);
    if (errorSuperposicion) return res.status(400).json({ msg: errorSuperposicion });

    // 2. Creación
    const nuevaReserva: any = await Reserva.create({
      fechaRetiro,
      fechaDevolucion,
      senia,
      clienteId,
      trajeId,
      estado: EstadoReserva.PENDIENTE,
    });

    // 3. Lógica de negocio: Si la reserva se crea, el traje pasa a "RESERVADO"
    const trajeReservado = await Traje.findByPk(trajeId);
    if (trajeReservado) {
      await trajeReservado.update({ estado: EstadoTraje.RESERVADO });
    }

    await registrarLog(
      "CREAR_RESERVA",
      nuevaReserva.id,
      `Se creó la reserva para el cliente ${clienteId} y traje ${trajeId}`
    );

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
  // Añadimos 'estado' a la desestructuración
  const { fechaRetiro, fechaDevolucion, senia, trajeId, estado } = req.body;

  try {
    const reserva = (await Reserva.findByPk(id)) as any;
    if (!reserva) return res.status(404).json({ msg: "No existe esa reserva" });

    const oldTrajeId = reserva.get('trajeId') as number;

    // 1. Validaciones extraídas
    const errorSenia = validarSenia(senia);
    if (errorSenia) return res.status(400).json({ msg: errorSenia });

    if (fechaRetiro && fechaDevolucion) {
      const errorFechas = validarFechas(fechaRetiro, fechaDevolucion, false);
      if (errorFechas) return res.status(400).json({ msg: errorFechas });

      const errorSuperposicion = await validarSuperposicion(
        trajeId || oldTrajeId, 
        fechaRetiro, 
        fechaDevolucion, 
        id
      );
      if (errorSuperposicion) return res.status(400).json({ msg: errorSuperposicion });
    }

    // 2. Actualización de la Reserva en la BD
    await reserva.update(req.body);

    // 3. --- LÓGICA DE NEGOCIO: Sincronización de Trajes ---
    // Si en el formulario se cambió el traje por uno distinto, liberamos el viejo
    if (trajeId && Number(trajeId) !== Number(oldTrajeId)) {
      const trajeViejo = await Traje.findByPk(oldTrajeId);
      if (trajeViejo) {
        await trajeViejo.update({ estado: EstadoTraje.DISPONIBLE });
      }
    }

    // Sincronizamos el traje actual con el estado final de la reserva
    const estadoFinal = estado || reserva.get('estado');
    const trajeActualId = trajeId || oldTrajeId;
    
    await sincronizarEstadoTraje(Number(trajeActualId), estadoFinal);
    // ------------------------------------------------------

    await registrarLog("ACTUALIZAR_RESERVA", Number(id), "Se actualizó la reserva");

    res.json({ msg: "Reserva actualizada", reserva });
  } catch (error) {
    console.error("Error técnico:", error);
    res.status(500).json({ msg: "Error al actualizar la reserva", error });
  }
};

export const updateEstadoReserva = async (req: Request, res: Response) => {
  const id = req.params.id as string;
  const { estado } = req.body;

  const errorEstado = validarEstadoEnum(estado);
  if (errorEstado) return res.status(400).json({ msg: errorEstado });

  try {
    const reserva = await Reserva.findByPk(id);
    if (!reserva) return res.status(404).json({ msg: "No existe esa reserva" });

    // Actualizamos la reserva
    await reserva.update({ estado });

    // --- Usamos nuestra nueva función reutilizable ---
    await sincronizarEstadoTraje(reserva.get('trajeId') as number, estado);

    await registrarLog(
      "ACTUALIZAR_ESTADO_RESERVA",
      Number(id),
      `Se actualizó el estado a ${estado}`
    );
    res.json({ msg: "Estado actualizado y stock sincronizado" });
  } catch (error) {
    res.status(500).json({ msg: "Error al cambiar el estado de la reserva" });
  }
};

export const deleteReserva = async (req: Request, res: Response) => {
  const id = req.params.id as string;
  try {
    const reserva = await Reserva.findByPk(id);
    if (!reserva) return res.status(404).json({ msg: "No existe una reserva con ese id" });

    const estadoReserva = reserva.get('estado') as string;
    const trajeId = reserva.get('trajeId') as number;

    if (estadoReserva === "RETIRADO" || estadoReserva === "PENDIENTE") {
      const traje = await Traje.findByPk(trajeId);
      if (traje) {
        await traje.update({ estado: EstadoTraje.DISPONIBLE });
      }
    }

    await reserva.destroy();
    await registrarLog("ELIMINAR_RESERVA", Number(id), "Se eliminó la reserva");
    res.json({ msg: "Reserva eliminada con éxito" });
  } catch (error) {
    res.status(500).json({ msg: "Error al eliminar la reserva", error });
  }
};

// =========================================================
//      FUNCIONES AUXILIARES (Validaciones, Logs, etc)
// =========================================================

const validarSenia = (senia?: number): string | null => {
  if (senia !== undefined && senia < 0) {
    return "La seña no puede ser negativa.";
  }
  return null;
};

const validarFechas = (fechaRetiro: string, fechaDevolucion: string, esNuevaReserva: boolean): string | null => {
  const retiro = new Date(fechaRetiro);
  const devolucion = new Date(fechaDevolucion);

  if (esNuevaReserva) {
    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0); 
    if (retiro < hoy) return "La fecha de retiro no puede ser anterior a hoy.";
  }

  if (devolucion <= retiro) {
    return "La fecha de devolución debe ser posterior al retiro.";
  }
  return null;
};

const validarSuperposicion = async (trajeId: number, fechaRetiro: string, fechaDevolucion: string, reservaIdExcluida?: string | number): Promise<string | null> => {
  const whereClause: any = {
    trajeId,
    estado: {
      [Op.notIn]: [EstadoReserva.CANCELADO, EstadoReserva.COMPLETADO],
    },
    fechaRetiro: { [Op.lt]: fechaDevolucion },
    fechaDevolucion: { [Op.gt]: fechaRetiro },
  };

  // Si estamos editando, omitimos la reserva actual en la búsqueda
  if (reservaIdExcluida) {
    whereClause.id = { [Op.ne]: reservaIdExcluida };
  }

  const reservaExistente = await Reserva.findOne({ where: whereClause });
  
  if (reservaExistente) return "El traje ya está reservado para esas fechas.";
  return null;
};

const validarEstadoEnum = (estado: string): string | null => {
  const estadosValidos = ["PENDIENTE", "RETIRADO", "COMPLETADO", "CANCELADO"];
  if (!estadosValidos.includes(estado)) {
    return "Estado no válido";
  }
  return null;
};

const registrarLog = async (accion: string, id: number, detalle: string) => {
  await Log.create({
    accion,
    descripcion: `Reserva #${id}: ${detalle}`,
    metadata: { reservaId: id },
  });
};

const sincronizarEstadoTraje = async (trajeId: number, estadoReserva: string) => {
  const traje = await Traje.findByPk(trajeId);
  if (!traje) return;

  if (estadoReserva === "RETIRADO") {
    await traje.update({ estado: EstadoTraje.ALQUILADO });
  } else if (estadoReserva === "COMPLETADO" || estadoReserva === "CANCELADO") {
    await traje.update({ estado: EstadoTraje.DISPONIBLE });
  } else if (estadoReserva === "PENDIENTE") {
    await traje.update({ estado: EstadoTraje.RESERVADO });
  }
};