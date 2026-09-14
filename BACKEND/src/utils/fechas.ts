// Utilidades de fechas compartidas (sin hora, solo día) para evitar desfases de zona horaria.

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

export const sumarMeses = (fecha: Date, meses: number): Date => {
  const resultado = new Date(fecha);
  resultado.setMonth(resultado.getMonth() + meses);
  return resultado;
};
