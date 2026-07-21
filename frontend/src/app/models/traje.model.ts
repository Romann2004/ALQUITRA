export enum EstadoTraje {
    DISPONIBLE = 'Disponible',
    ALQUILADO = 'Alquilado',
    MANTENIMIENTO = 'En Mantenimiento',
    BAJA = 'Baja'
}

export enum TalleTraje {
    XS = 'XS',
    S = 'S',
    M = 'M',
    L = 'L',
    XL = 'XL',
    XXL = 'XXL'
}

export interface Traje {
    id?: number;
    codigoEtiqueta: string;
    talle: TalleTraje | string;
    color: string;
    categoria: string;
    cantidad: number;
    precioAlquilerBase: number;
    estado: EstadoTraje | string;
}