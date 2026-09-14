// Espejo (en TypeScript) de BACKEND/src/utils/estadosReserva.ts.
// Se usa solo para decidir qué opciones mostrar en el desplegable de "Estado".
// La validación real y definitiva siempre la hace el backend — si algún día
// cambian las reglas de negocio, hay que actualizar los dos archivos.

import { EstadoReserva } from './reserva.model';

// OJO: no usar `new Date(textoDeFecha)` acá. Un string "YYYY-MM-DD" se interpreta como
// medianoche UTC, y al leerlo de vuelta en hora local (ej. Argentina, UTC-3) el día
// "se corre" uno para atrás. Por eso se arma la fecha a mano, igual que en el backend.
export const normalizarFechaSoloDia = (fecha: string | Date): Date => {
  if (fecha instanceof Date) {
    return new Date(fecha.getFullYear(), fecha.getMonth(), fecha.getDate());
  }
  const [anio, mes, dia] = fecha.slice(0, 10).split('-').map(Number);
  return new Date(anio, mes - 1, dia);
};

export const sumarDias = (fecha: Date, dias: number): Date => {
  const resultado = new Date(fecha);
  resultado.setDate(resultado.getDate() + dias);
  return resultado;
};

const sumarMeses = (fecha: Date, meses: number): Date => {
  const resultado = new Date(fecha);
  resultado.setMonth(resultado.getMonth() + meses);
  return resultado;
};

export const ESTADOS_TERMINALES: EstadoReserva[] = [
  EstadoReserva.CANCELADO_A_TIEMPO,
  EstadoReserva.CANCELADO_FUERA_DE_TIEMPO,
  EstadoReserva.COMPLETADO_A_TIEMPO,
  EstadoReserva.COMPLETADO_FUERA_DE_TIEMPO,
  EstadoReserva.TRAJES_PERDIDOS,
];

export const obtenerEstadosDisponibles = (
  estadoActual: EstadoReserva,
  fechaRetiro: string | Date,
  fechaDevolucion: string | Date,
  hoy: Date = new Date()
): EstadoReserva[] => {
  const retiro = normalizarFechaSoloDia(fechaRetiro);
  const devolucion = normalizarFechaSoloDia(fechaDevolucion);
  const hoyNorm = normalizarFechaSoloDia(hoy);

  const limiteCancelacionATiempo = sumarDias(retiro, -2);
  const inicioCancelacionFueraDeTiempo = sumarDias(retiro, -1);
  const limiteCompletadoATiempo = sumarDias(devolucion, 2);
  const inicioCompletadoFueraDeTiempo = sumarDias(devolucion, 3);
  const limiteCompletadoFueraDeTiempo = sumarMeses(inicioCompletadoFueraDeTiempo, 1);

  const disponibles: EstadoReserva[] = [];

  if (estadoActual === EstadoReserva.PENDIENTE) {
    if (hoyNorm <= limiteCancelacionATiempo) {
      disponibles.push(EstadoReserva.CANCELADO_A_TIEMPO);
    }
    if (hoyNorm >= inicioCancelacionFueraDeTiempo && hoyNorm <= devolucion) {
      disponibles.push(EstadoReserva.CANCELADO_FUERA_DE_TIEMPO);
    }
    if (hoyNorm >= retiro && hoyNorm <= devolucion) {
      disponibles.push(EstadoReserva.RETIRADO);
    }
  } else if (estadoActual === EstadoReserva.RETIRADO) {
    if (hoyNorm >= devolucion && hoyNorm <= limiteCompletadoATiempo) {
      disponibles.push(EstadoReserva.COMPLETADO_A_TIEMPO);
    }
    if (hoyNorm >= inicioCompletadoFueraDeTiempo && hoyNorm <= limiteCompletadoFueraDeTiempo) {
      disponibles.push(EstadoReserva.COMPLETADO_FUERA_DE_TIEMPO);
    }
  }

  return disponibles;
};
