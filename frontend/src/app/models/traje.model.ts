export enum EstadoTraje {
    DISPONIBLE = 'Disponible',
    RESERVADO = 'Reservado',
    ALQUILADO = 'Alquilado',
    MANTENIMIENTO = 'En Mantenimiento',
    BAJA = 'Baja'
}

export interface Traje {
    id?: number;
    codigoEtiqueta: string;
    talle: string;
    color: string;
    categoria: string;
    precioAlquilerBase: number;
    estado: EstadoTraje;
}