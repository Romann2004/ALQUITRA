export enum EstadoTraje {
    DISPONIBLE = 'Disponible',
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

export enum EstadoReserva {
    PENDIENTE = 'PENDIENTE',
    RETIRADO = 'RETIRADO',
    CANCELADO_A_TIEMPO = 'CANCELADO_A_TIEMPO',
    CANCELADO_FUERA_DE_TIEMPO = 'CANCELADO_FUERA_DE_TIEMPO',
    COMPLETADO_A_TIEMPO = 'COMPLETADO_A_TIEMPO',
    COMPLETADO_FUERA_DE_TIEMPO = 'COMPLETADO_FUERA_DE_TIEMPO',
    TRAJES_PERDIDOS = 'TRAJES_PERDIDOS'
}