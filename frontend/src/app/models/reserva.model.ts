export enum EstadoReserva {
    PENDIENTE = 'PENDIENTE',
    RETIRADO = 'RETIRADO',
    CANCELADO_A_TIEMPO = 'CANCELADO_A_TIEMPO',
    CANCELADO_FUERA_DE_TIEMPO = 'CANCELADO_FUERA_DE_TIEMPO',
    COMPLETADO_A_TIEMPO = 'COMPLETADO_A_TIEMPO',
    COMPLETADO_FUERA_DE_TIEMPO = 'COMPLETADO_FUERA_DE_TIEMPO',
    TRAJES_PERDIDOS = 'TRAJES_PERDIDOS'
}

export interface Reserva {
    id?: number;
    fechaRetiro: Date;
    fechaDevolucion: Date;
    senia: number;
    cantidad?: number;
    estado: EstadoReserva;
    clienteId: number;
    trajeId: number;
    // Campos que vienen del include de Sequelize
    cliente?: {
        nombre: string;
        dni: string;
    };
    traje?: {
        categoria: string;
        talle: string;
        color: string;
    };
}