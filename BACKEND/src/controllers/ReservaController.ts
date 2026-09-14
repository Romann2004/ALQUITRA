import { Request, Response } from "express";
import { Traje } from "../models/Traje";
import { Op } from "sequelize";
import { Log } from "../models/Log";
import Reserva from "../models/Reserva";
import Cliente from "../models/Cliente";
import { EstadoReserva, EstadoTraje } from "../models/Enums";
import { normalizarFechaSoloDia, sumarDias } from "../utils/fechas";
import { ESTADOS_TERMINALES, esTransicionValida } from "../utils/estadosReserva";

export const postReserva = async (req: Request, res: Response) => {
  const { fechaRetiro, fechaDevolucion, senia, clienteId, trajeId, cantidad } = req.body;
  const cantidadReservada = cantidad ? Number(cantidad) : 1; // Por defecto 1

  try {
    // 1. Validaciones
    const errorSenia = validarSenia(senia);
    if (errorSenia) return res.status(400).json({ msg: errorSenia });

    const errorFechas = validarFechas(fechaRetiro, fechaDevolucion, true);
    if (errorFechas) return res.status(400).json({ msg: errorFechas });

    const { error: errorSuperposicion, traje } = await validarSuperposicionGrupal(trajeId, fechaRetiro, fechaDevolucion, cantidadReservada);
    if (errorSuperposicion) return res.status(400).json({ msg: errorSuperposicion });

    const errorSeniaPrecio = validarSeniaContraPrecio(senia, traje.precioAlquilerBase, cantidadReservada);
    if (errorSeniaPrecio) return res.status(400).json({ msg: errorSeniaPrecio });

    const clienteExiste = await Cliente.findByPk(clienteId);
    if (!clienteExiste || !clienteExiste.get('activo')) {
      return res.status(400).json({msj:"El cliente no existe o está dado de baja."}); 
    }

    // 2. Creación
    const nuevaReserva: any = await Reserva.create({
      fechaRetiro,
      fechaDevolucion,
      senia,
      clienteId,
      trajeId,
      cantidad: cantidadReservada, // Guardamos la cantidad
      estado: EstadoReserva.PENDIENTE,
    });

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

// Estados que agrupan la reserva como "en proceso" (todavía no llegó a un final).
const ESTADOS_EN_PROCESO: EstadoReserva[] = [EstadoReserva.PENDIENTE, EstadoReserva.RETIRADO];

// Columnas por las que se puede ordenar desde el frontend, y cómo traducirlas a SQL.
const construirOrden = (sortField: string, sortDirection: string): any[] => {
  const direccion = sortDirection === "desc" ? "DESC" : "ASC";
  switch (sortField) {
    case "cliente":
      return [[Cliente, "nombre", direccion]];
    case "traje":
      // Igual que antes: primero por categoría, y el talle en orden real de tamaño (no alfabético).
      return [
        [Traje, "categoria", direccion],
        [
          Reserva.sequelize!.literal(
            `CASE "Traje"."talle" WHEN 'XS' THEN 1 WHEN 'S' THEN 2 WHEN 'M' THEN 3 WHEN 'L' THEN 4 WHEN 'XL' THEN 5 WHEN 'XXL' THEN 6 ELSE 99 END`
          ),
          direccion,
        ],
      ];
    case "id":
    case "cantidad":
    case "fechaRetiro":
    case "fechaDevolucion":
    case "estado":
    case "senia":
      return [[sortField, direccion]];
    default:
      return [["fechaRetiro", "ASC"]];
  }
};

export const getReservas = async (req: Request, res: Response) => {
  try {
    const {
      categoria, // 'en_proceso' | 'finalizadas'
      page = "1",
      pageSize = "25",
      search = "",
      sortField = "fechaRetiro",
      sortDirection = "asc",
    } = req.query as Record<string, string>;

    const where: any = { activo: true };

    if (categoria === "en_proceso") {
      where.estado = { [Op.in]: ESTADOS_EN_PROCESO };
    } else if (categoria === "finalizadas") {
      where.estado = { [Op.in]: ESTADOS_TERMINALES };
    }

    const busqueda = search.trim();
    if (busqueda) {
      const like = `%${busqueda}%`;
      where[Op.or as any] = [
        { "$Cliente.nombre$": { [Op.iLike]: like } },
        { "$Traje.categoria$": { [Op.iLike]: like } },
        { "$Traje.talle$": { [Op.iLike]: like } },
        { "$Traje.color$": { [Op.iLike]: like } },
        Reserva.sequelize!.where(Reserva.sequelize!.cast(Reserva.sequelize!.col("reserva.estado"), "text"), { [Op.iLike]: like }),
        Reserva.sequelize!.where(Reserva.sequelize!.cast(Reserva.sequelize!.col("reserva.id"), "text"), { [Op.iLike]: like }),
        Reserva.sequelize!.where(Reserva.sequelize!.cast(Reserva.sequelize!.col("reserva.cantidad"), "text"), { [Op.iLike]: like }),
        Reserva.sequelize!.where(Reserva.sequelize!.cast(Reserva.sequelize!.col("reserva.senia"), "text"), { [Op.iLike]: like }),
        Reserva.sequelize!.where(
          Reserva.sequelize!.fn("TO_CHAR", Reserva.sequelize!.col("reserva.fechaRetiro"), "DD/MM/YYYY"),
          { [Op.iLike]: like }
        ),
        Reserva.sequelize!.where(
          Reserva.sequelize!.fn("TO_CHAR", Reserva.sequelize!.col("reserva.fechaDevolucion"), "DD/MM/YYYY"),
          { [Op.iLike]: like }
        ),
      ];
    }

    const pageNum = Math.max(1, Number(page) || 1);
    const pageSizeNum = Math.max(1, Number(pageSize) || 25);

    const { count, rows } = await Reserva.findAndCountAll({
      where,
      include: [
        { model: Cliente, attributes: ["nombre", "dni"], required: false },
        { model: Traje, attributes: ["categoria", "talle", "color"], required: false },
      ],
      order: construirOrden(sortField, sortDirection),
      limit: pageSizeNum,
      offset: (pageNum - 1) * pageSizeNum,
      subQuery: false, // necesario para que limit/offset funcionen bien junto al filtro por columnas incluidas ($Cliente.nombre$, etc.)
    });

    res.json({ data: rows, total: count });
  } catch (error) {
    console.error("Error al obtener reservas:", error);
    res.status(500).json({ msg: "Error al obtener reservas", error });
  }
};

export const updateReserva = async (req: Request, res: Response) => {
  const id = req.params.id as string;

  try {
    const reserva = (await Reserva.findByPk(id)) as any;
    if (!reserva) return res.status(404).json({ msg: "No existe esa reserva" });

    const estadoActual = reserva.get('estado') as EstadoReserva;

    // Una reserva RETIRADA está congelada, salvo una excepción puntual: se puede
    // extender la fecha de devolución (con un techo fijo), para darle más tiempo al cliente.
    if (estadoActual === EstadoReserva.RETIRADO) {
      return await extenderFechaDevolucion(req, res, reserva);
    }

    if (estadoActual !== EstadoReserva.PENDIENTE) {
      return res.status(400).json({ msg: "La reserva ya fue retirada o finalizada, y no puede editarse. Solo se puede cambiar su estado." });
    }

    const { fechaRetiro, fechaDevolucion, senia, trajeId, cantidad } = req.body;

    // La fecha de retiro solo se puede tocar hasta el día antes del retiro pactado.
    // Una vez llegado (o pasado) ese día, queda congelada — el resto de los campos sigue editable.
    const fechaRetiroActual = reserva.get('fechaRetiro') as string;
    if (fechaRetiro !== undefined && normalizarFechaSoloDia(fechaRetiro).getTime() !== normalizarFechaSoloDia(fechaRetiroActual).getTime()) {
      const hoy = normalizarFechaSoloDia(new Date());
      if (hoy >= normalizarFechaSoloDia(fechaRetiroActual)) {
        return res.status(400).json({ msg: `No se puede modificar la fecha de retiro: la fecha pactada (${formatearFecha(fechaRetiroActual)}) ya llegó o pasó.` });
      }
    }

    const oldTrajeId = reserva.get('trajeId') as number;
    const cantidadFinal = cantidad ? Number(cantidad) : reserva.get('cantidad');

    // 1. Validaciones extraídas
    const errorSenia = validarSenia(senia);
    if (errorSenia) return res.status(400).json({ msg: errorSenia });

    if (fechaRetiro && fechaDevolucion) {
      const errorFechas = validarFechas(fechaRetiro, fechaDevolucion, false);
      if (errorFechas) return res.status(400).json({ msg: errorFechas });

      const { error: errorSuperposicion, traje } = await validarSuperposicionGrupal(
        trajeId || oldTrajeId,
        fechaRetiro,
        fechaDevolucion,
        cantidadFinal,
        id
      );
      if (errorSuperposicion) return res.status(400).json({ msg: errorSuperposicion });

      const errorSeniaPrecio = validarSeniaContraPrecio(senia, traje.precioAlquilerBase, cantidadFinal);
      if (errorSeniaPrecio) return res.status(400).json({ msg: errorSeniaPrecio });
    } else if (senia !== undefined) {
      const traje: any = await Traje.findByPk(trajeId || oldTrajeId);
      if (!traje) return res.status(400).json({ msg: "El traje no existe." });

      const errorSeniaPrecio = validarSeniaContraPrecio(senia, traje.precioAlquilerBase, cantidadFinal);
      if (errorSeniaPrecio) return res.status(400).json({ msg: errorSeniaPrecio });
    }

    // 2. Actualización de la Reserva en la BD (el estado NO se toca acá, ver updateEstadoReserva)
    await reserva.update({ fechaRetiro, fechaDevolucion, senia, trajeId, cantidad: cantidadFinal });

    await registrarLog("ACTUALIZAR_RESERVA", Number(id), "Se actualizó la reserva");

    res.json({ msg: "Reserva actualizada", reserva });
  } catch (error) {
    console.error("Error técnico:", error);
    res.status(500).json({ msg: "Error al actualizar la reserva", error });
  }
};

// Única modificación permitida sobre una reserva RETIRADA: estirar la fecha de
// devolución, con un techo fijo de 7 días desde lo que estaba pactado en el
// momento exacto del retiro (fechaDevolucionPactada), sin importar cuántas veces se edite.
const extenderFechaDevolucion = async (req: Request, res: Response, reserva: any) => {
  const { fechaDevolucion } = req.body;

  if (!fechaDevolucion) {
    return res.status(400).json({ msg: "Falta la nueva fecha de devolución." });
  }

  const fechaPactada = reserva.get('fechaDevolucionPactada') || reserva.get('fechaDevolucion');
  const limiteMaximo = sumarDias(normalizarFechaSoloDia(fechaPactada), 7);
  const nuevaFecha = normalizarFechaSoloDia(fechaDevolucion);
  const fechaRetiro = normalizarFechaSoloDia(reserva.get('fechaRetiro'));

  if (nuevaFecha <= fechaRetiro) {
    return res.status(400).json({ msg: "La fecha de devolución debe ser posterior al retiro." });
  }

  if (nuevaFecha > limiteMaximo) {
    return res.status(400).json({
      msg: `No se puede extender la devolución más allá del ${formatearFecha(limiteMaximo)} (máximo 7 días desde la fecha pactada).`,
    });
  }

  const { error: errorSuperposicion } = await validarSuperposicionGrupal(
    reserva.get('trajeId'),
    reserva.get('fechaRetiro'),
    fechaDevolucion,
    reserva.get('cantidad'),
    reserva.id
  );
  if (errorSuperposicion) return res.status(400).json({ msg: errorSuperposicion });

  await reserva.update({ fechaDevolucion });

  await registrarLog("ACTUALIZAR_RESERVA", reserva.id, `Se extendió la fecha de devolución a ${formatearFecha(fechaDevolucion)}`);

  res.json({ msg: "Fecha de devolución actualizada", reserva });
};

const formatearFecha = (fecha: string | Date): string => {
  const d = normalizarFechaSoloDia(fecha);
  const dia = String(d.getDate()).padStart(2, '0');
  const mes = String(d.getMonth() + 1).padStart(2, '0');
  return `${dia}/${mes}/${d.getFullYear()}`;
};

export const updateEstadoReserva = async (req: Request, res: Response) => {
  const id = req.params.id as string;
  const { estado: estadoNuevo } = req.body;

  if (!Object.values(EstadoReserva).includes(estadoNuevo)) {
    return res.status(400).json({ msg: "Estado no válido" });
  }

  try {
    const reserva = await Reserva.findByPk(id) as any;
    if (!reserva) return res.status(404).json({ msg: "No existe esa reserva" });
    if (!reserva.activo) return res.status(400).json({ msg: "La reserva no existe o fue eliminada." });

    const estadoActual = reserva.estado as EstadoReserva;

    if (ESTADOS_TERMINALES.includes(estadoActual)) {
      return res.status(400).json({ msg: "La reserva ya está en un estado final y no puede modificarse." });
    }

    if (!esTransicionValida(estadoActual, estadoNuevo, reserva.fechaRetiro, reserva.fechaDevolucion)) {
      return res.status(400).json({ msg: `No se puede cambiar el estado a "${estadoNuevo}" en este momento.` });
    }

    const cambios: any = { estado: estadoNuevo };
    if (estadoNuevo === EstadoReserva.RETIRADO) {
      // Congelamos acá la fecha de devolución pactada, para poder calcular
      // después el techo de +7 días sin importar cuántas veces se extienda.
      cambios.fechaDevolucionPactada = reserva.fechaDevolucion;
    }
    await reserva.update(cambios);

    await registrarLog(
      "ACTUALIZAR_ESTADO_RESERVA",
      Number(id),
      `Se actualizó el estado de ${estadoActual} a ${estadoNuevo}`
    );
    res.json({ msg: "Estado actualizado", estado: estadoNuevo });
  } catch (error) {
    console.error("Error técnico:", error);
    res.status(500).json({ msg: "Error al cambiar el estado de la reserva" });
  }
};

export const deleteReserva = async (req: Request, res: Response) => {
  const id = req.params.id as string;
  try {
    const reserva = await Reserva.findByPk(id);
    if (!reserva) return res.status(404).json({ msg: "No existe una reserva con ese id" });

    const estadoReserva = reserva.get('estado') as EstadoReserva;

    if (estadoReserva !== EstadoReserva.PENDIENTE) {
      return res.status(400).json({ msg: "No se puede eliminar una reserva que ya fue retirada o finalizada." });
    }

    await reserva.update({ activo: false });

    await registrarLog("ELIMINAR_RESERVA_LOGICA", Number(id), "Se eliminó la reserva (Borrado Lógico)");
    res.json({ msg: "Reserva eliminada con éxito" });
  } catch (error) {
    res.status(500).json({ msg: "Error al eliminar la reserva", error });
  }
};

// =========================================================
//      FUNCIONES AUXILIARES (Validaciones, Logs, etc)
// =========================================================

export const validarSenia = (senia?: number): string | null => {
  if (senia !== undefined && senia < 0) {
    return "La seña no puede ser negativa.";
  }
  return null;
};

const validarSeniaContraPrecio = (senia: number | undefined, precioTraje: number, cantidad: number): string | null => {
  const montoTotalReserva = Number(precioTraje) * Number(cantidad);
  if (senia !== undefined && Number(senia) > montoTotalReserva / 2) {
    return "La seña no puede ser mayor a la mitad del monto total de la reserva.";
  }
  return null;
};

const validarFechas = (fechaRetiro: string, fechaDevolucion: string, esNuevaReserva: boolean): string | null => {
  const retiro = normalizarFechaSoloDia(fechaRetiro);
  const devolucion = normalizarFechaSoloDia(fechaDevolucion);

  if (esNuevaReserva) {
    const hoy = normalizarFechaSoloDia(new Date());
    if (retiro < hoy) return "La fecha de retiro no puede ser anterior a hoy.";
  }

  if (devolucion <= retiro) {
    return "La fecha de devolución debe ser posterior al retiro.";
  }
  return null;
};

const validarSuperposicionGrupal = async (
  trajeId: number,
  fechaRetiro: string,
  fechaDevolucion: string,
  cantidadDeseada: number,
  reservaIdExcluida?: string | number
): Promise<{ error: string | null; traje?: any }> => {

  // Obtenemos el stock total real del grupo de trajes
  const traje: any = await Traje.findByPk(trajeId);
  if (!traje) return { error: "El traje no existe." };
  if (traje.estado === EstadoTraje.BAJA) {
    return { error: "El traje está dado de baja." };
  }
  const stockTotal = traje.cantidad;

  // Buscamos todas las reservas activas de este traje que choquen con estas fechas
  const whereClause: any = {
    trajeId,
    estado: {
      [Op.notIn]: ESTADOS_TERMINALES,
    },
    activo: true, // Respetamos el borrado lógico
    fechaRetiro: { [Op.lt]: fechaDevolucion },
    fechaDevolucion: { [Op.gt]: fechaRetiro },
  };
  
  // Si estamos editando, omitimos la reserva actual en la búsqueda
  if (reservaIdExcluida) {
    whereClause.id = { [Op.ne]: reservaIdExcluida };
  }

  const reservasSuperpuestas = await Reserva.findAll({ where: whereClause });
  
  // Validación rápida: Si ni siquiera hay stock base, no podemos reservar
  if (cantidadDeseada > stockTotal) {
    return { error: `Stock insuficiente. El inventario total es de ${stockTotal} unidades.` };
  }

  // Verificamos día por día la ocupación
  // Convertimos a Date (UTC para evitar desfases horarios)
  let inicio = normalizarFechaSoloDia(fechaRetiro);
  let fin = normalizarFechaSoloDia(fechaDevolucion);

  for (let d = new Date(inicio); d < fin; d.setDate(d.getDate() + 1)) {
    let ocupadosHoy = 0;

    // Sumamos cuántas unidades están retenidas justo este día
    for (const res of reservasSuperpuestas) {
      const resInicio = normalizarFechaSoloDia((res as any).fechaRetiro);
      const resFin = normalizarFechaSoloDia((res as any).fechaDevolucion);
      
      if (d >= resInicio && d < resFin) {
        ocupadosHoy += (res as any).cantidad;
      }
    }
    
    // Verificamos si en este día específico colapsa el stock
    if (ocupadosHoy + cantidadDeseada > stockTotal) {
      // Formateamos la fecha al estilo DD/MM/YYYY para que el error sea legible
      const fechaColapso = d.toISOString().split('T')[0];
      const disponibles = stockTotal - ocupadosHoy;
      return { error: `Stock insuficiente para la fecha ${fechaColapso}. Solo quedan ${disponibles} unidades disponibles.` };
    }
  }

  return { error: null, traje }; // Todo bien, no hay superposición
};

const registrarLog = async (accion: string, id: number, detalle: string) => {
  await Log.create({
    accion,
    descripcion: `Reserva #${id}: ${detalle}`,
    metadata: { reservaId: id },
  });
};