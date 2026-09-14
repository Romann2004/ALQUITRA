// Lógica del ciclo de vida de una reserva: qué transiciones de estado son válidas,
// en qué ventana de fechas, y cuáles ocurren de forma automática.
//
// Todas las ventanas se calculan a partir de fechaRetiro (R) y fechaDevolucion (D):
//
//   CANCELADO_A_TIEMPO          -> hoy <= R-2
//   CANCELADO_FUERA_DE_TIEMPO   -> R-1 <= hoy <= D           (manual)
//   CANCELADO_FUERA_DE_TIEMPO   -> hoy > D                    (automático, si sigue PENDIENTE)
//   RETIRADO                    -> R <= hoy <= D
//   COMPLETADO_A_TIEMPO         -> D <= hoy <= D+2
//   COMPLETADO_FUERA_DE_TIEMPO  -> D+3 <= hoy <= (D+3)+1mes
//   TRAJES_PERDIDOS              -> hoy > (D+3)+1mes           (automático, si sigue RETIRADO)

import { EstadoReserva } from '../models/Enums';
import { normalizarFechaSoloDia, sumarDias, sumarMeses } from './fechas';

export interface FechasClave {
  hoy: Date;
  retiro: Date;
  devolucion: Date;
  limiteCancelacionATiempo: Date;
  inicioCancelacionFueraDeTiempo: Date;
  limiteCompletadoATiempo: Date;
  inicioCompletadoFueraDeTiempo: Date;
  limiteCompletadoFueraDeTiempo: Date;
  inicioTrajesPerdidos: Date;
}

export const calcularFechasClave = (
  fechaRetiro: string | Date,
  fechaDevolucion: string | Date,
  hoy: Date = new Date()
): FechasClave => {
  const retiro = normalizarFechaSoloDia(fechaRetiro);
  const devolucion = normalizarFechaSoloDia(fechaDevolucion);
  const inicioCompletadoFueraDeTiempo = sumarDias(devolucion, 3);
  const limiteCompletadoFueraDeTiempo = sumarMeses(inicioCompletadoFueraDeTiempo, 1);

  return {
    hoy: normalizarFechaSoloDia(hoy),
    retiro,
    devolucion,
    limiteCancelacionATiempo: sumarDias(retiro, -2),
    inicioCancelacionFueraDeTiempo: sumarDias(retiro, -1),
    limiteCompletadoATiempo: sumarDias(devolucion, 2),
    inicioCompletadoFueraDeTiempo,
    limiteCompletadoFueraDeTiempo,
    inicioTrajesPerdidos: sumarDias(limiteCompletadoFueraDeTiempo, 1),
  };
};

// Estados a los que se puede llegar MANUALMENTE desde el estado actual, hoy.
// Trajes Perdidos nunca aparece acá: es exclusivamente automático.
export const obtenerEstadosDisponibles = (
  estadoActual: EstadoReserva,
  fechaRetiro: string | Date,
  fechaDevolucion: string | Date,
  hoy: Date = new Date()
): EstadoReserva[] => {
  const f = calcularFechasClave(fechaRetiro, fechaDevolucion, hoy);
  const disponibles: EstadoReserva[] = [];

  if (estadoActual === EstadoReserva.PENDIENTE) {
    if (f.hoy <= f.limiteCancelacionATiempo) {
      disponibles.push(EstadoReserva.CANCELADO_A_TIEMPO);
    }
    if (f.hoy >= f.inicioCancelacionFueraDeTiempo && f.hoy <= f.devolucion) {
      disponibles.push(EstadoReserva.CANCELADO_FUERA_DE_TIEMPO);
    }
    if (f.hoy >= f.retiro && f.hoy <= f.devolucion) {
      disponibles.push(EstadoReserva.RETIRADO);
    }
  } else if (estadoActual === EstadoReserva.RETIRADO) {
    if (f.hoy >= f.devolucion && f.hoy <= f.limiteCompletadoATiempo) {
      disponibles.push(EstadoReserva.COMPLETADO_A_TIEMPO);
    }
    if (f.hoy >= f.inicioCompletadoFueraDeTiempo && f.hoy <= f.limiteCompletadoFueraDeTiempo) {
      disponibles.push(EstadoReserva.COMPLETADO_FUERA_DE_TIEMPO);
    }
  }

  return disponibles;
};

export const esTransicionValida = (
  estadoActual: EstadoReserva,
  estadoNuevo: EstadoReserva,
  fechaRetiro: string | Date,
  fechaDevolucion: string | Date,
  hoy: Date = new Date()
): boolean => {
  return obtenerEstadosDisponibles(estadoActual, fechaRetiro, fechaDevolucion, hoy).includes(estadoNuevo);
};

// Estados finales: una vez alcanzados, la reserva queda congelada por completo.
export const ESTADOS_TERMINALES: EstadoReserva[] = [
  EstadoReserva.CANCELADO_A_TIEMPO,
  EstadoReserva.CANCELADO_FUERA_DE_TIEMPO,
  EstadoReserva.COMPLETADO_A_TIEMPO,
  EstadoReserva.COMPLETADO_FUERA_DE_TIEMPO,
  EstadoReserva.TRAJES_PERDIDOS,
];

// Transición que corresponde aplicar de forma automática (barrido diario), o null si ninguna.
export const determinarTransicionAutomatica = (
  estadoActual: EstadoReserva,
  fechaRetiro: string | Date,
  fechaDevolucion: string | Date,
  hoy: Date = new Date()
): EstadoReserva | null => {
  const f = calcularFechasClave(fechaRetiro, fechaDevolucion, hoy);

  if (estadoActual === EstadoReserva.PENDIENTE && f.hoy > f.devolucion) {
    return EstadoReserva.CANCELADO_FUERA_DE_TIEMPO;
  }
  if (estadoActual === EstadoReserva.RETIRADO && f.hoy >= f.inicioTrajesPerdidos) {
    return EstadoReserva.TRAJES_PERDIDOS;
  }
  return null;
};
