import { Model, DataTypes, Optional } from 'sequelize';
import { sequelize } from '../config/db';

//Se define lo que tiene un traje en una interfaz tipada
interface TrajeAttributes {
    id: number;
    codigoEtiqueta: string;
    talle: string;
    color: string;
    categoria: string;
    precioAlquilerBase: number;
    estado: 'Disponible' | 'Reservado' | 'Alquilado' | 'En mantenimiento' | 'Baja';
}

//Se define el ID como atributo opcional, ya que es auto incremental la bd
interface TrajeCreationAttributes extends Optional<TrajeAttributes, 'id'>{}

//Se define la clase del modelo Traje, que extiende de Model y utiliza las interfaces definidas para tipar sus atributos y creación
export class Traje extends Model<TrajeAttributes, TrajeCreationAttributes> implements TrajeAttributes {
    public id!: number;
    public codigoEtiqueta!: string;
    public talle!: string;
    public color!: string;
    public categoria!: string;
    public precioAlquilerBase!: number;
    public estado!: 'Disponible' | 'Reservado' | 'Alquilado' | 'En mantenimiento' | 'Baja';

    //Timestamps automaticos de sequelize
    public readonly createdAt!: Date;
    public readonly updatedAt!: Date;
}

//Se inicializa el modelo Traje en la base de datos
Traje.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    codigoEtiqueta: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
    },
    talle: {
      type: DataTypes.STRING(10),
      allowNull: false,
    },
    color: {
      type: DataTypes.STRING(50),
    },
    categoria: {
      type: DataTypes.STRING(50),
    },
    precioAlquilerBase: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
    },
    estado: {
      type: DataTypes.ENUM('Disponible', 'Reservado', 'Alquilado', 'En Mantenimiento', 'Baja'),
      defaultValue: 'Disponible',
    },
  },
  {
    sequelize,
    tableName: 'trajes',
  }
);
