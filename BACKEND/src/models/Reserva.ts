import { DataTypes } from "sequelize";
import { sequelize } from "../config/db";
import Cliente from "./Cliente";
import { Traje } from "./Traje";
import { EstadoReserva } from "./Enums";

const Reserva = sequelize.define('reserva', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    fechaReserva: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW,
    },
    fechaRetiro: {
        type: DataTypes.DATEONLY, // Solo fecha, sin hora
        allowNull: false
    },
    fechaDevolucion: {
        type: DataTypes.DATEONLY,
        allowNull: false
    },
    estado: {
        type: DataTypes.ENUM(...Object.values(EstadoReserva)),
        defaultValue: EstadoReserva.PENDIENTE,
        allowNull: false
    },
    senia: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false
    }
}, {
    tableName: 'reservas',
    timestamps: true
});

//Definimos las relaciones acá

// 1. Unimos Reserva con Cliente
Cliente.hasMany(Reserva, { foreignKey: 'clienteId' });
Reserva.belongsTo(Cliente, { foreignKey: 'clienteId' });

// 2. Unimos Reserva con Traje
Traje.hasMany(Reserva, { foreignKey: 'trajeId' });
Reserva.belongsTo(Traje, { foreignKey: 'trajeId' });

export default Reserva;