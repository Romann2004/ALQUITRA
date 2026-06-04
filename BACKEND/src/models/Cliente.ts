import { DataTypes, Model } from 'sequelize';
import { sequelize } from '../config/db';

interface ClienteAttributes {
    id?: number;
    nombre: string;
    dni: string;
    telefono: string;
    email: string;
    activo: boolean;
}

const Cliente = sequelize.define<Model<ClienteAttributes>>('Cliente', {
    nombre: {
        type: DataTypes.STRING,
        allowNull: false
    },
    dni: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true
    },
    telefono: {
        type: DataTypes.STRING,
        allowNull: false
    },
    email: {
        type: DataTypes.STRING,
        allowNull: true
    },
    activo: {
        type: DataTypes.BOOLEAN,
        defaultValue: true,
        allowNull: false
    }
}, {
    tableName: 'clientes',
    timestamps: true //Para saber cuando se crea el cliente
});

export default Cliente;