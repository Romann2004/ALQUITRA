export enum EstadoReserva {
    PENDIENTE = 'PENDIENTE',
    RETIRADO = 'RETIRADO',
    COMPLETADO = 'COMPLETADO',
    CANCELADO = 'CANCELADO'
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