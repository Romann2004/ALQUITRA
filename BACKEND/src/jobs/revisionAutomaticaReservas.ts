// Barrido automático de reservas: aplica las dos transiciones de estado que no requieren
// intervención humana (ver utils/estadosReserva.ts):
//   - PENDIENTE que ya pasó la fecha de devolución -> CANCELADO_FUERA_DE_TIEMPO
//   - RETIRADO que nunca se completó dentro del mes de gracia -> TRAJES_PERDIDOS
//     (en este caso, además, las unidades se descuentan del stock total del traje)
//
// Se ejecuta una vez al arrancar el servidor (para ponerse al día si el backend estuvo
// apagado) y luego todos los días a la misma hora (ver app.ts).

import { Op } from "sequelize";
import Reserva from "../models/Reserva";
import { Traje } from "../models/Traje";
import { Log } from "../models/Log";
import { EstadoReserva } from "../models/Enums";
import { determinarTransicionAutomatica } from "../utils/estadosReserva";

export const revisarTransicionesAutomaticas = async (): Promise<void> => {
  const reservas = await Reserva.findAll({
    where: {
      activo: true,
      estado: { [Op.in]: [EstadoReserva.PENDIENTE, EstadoReserva.RETIRADO] },
    },
  });

  const hoy = new Date();

  for (const reserva of reservas as any[]) {
    const estadoActual = reserva.estado as EstadoReserva;
    const estadoNuevo = determinarTransicionAutomatica(
      estadoActual,
      reserva.fechaRetiro,
      reserva.fechaDevolucion,
      hoy
    );

    if (!estadoNuevo) continue;

    await reserva.update({ estado: estadoNuevo });

    if (estadoNuevo === EstadoReserva.TRAJES_PERDIDOS) {
      const traje = await Traje.findByPk(reserva.trajeId) as any;
      if (traje) {
        const cantidadRestante = Math.max(0, Number(traje.cantidad) - Number(reserva.cantidad));
        await traje.update({ cantidad: cantidadRestante });
      }
    }

    await Log.create({
      accion: "CAMBIO_ESTADO_AUTOMATICO",
      descripcion: `Reserva #${reserva.id}: cambio automático de ${estadoActual} a ${estadoNuevo}`,
      metadata: { reservaId: reserva.id, estadoAnterior: estadoActual, estadoNuevo },
    });
  }
};
