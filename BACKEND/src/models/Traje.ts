import { Model, DataTypes, Optional } from 'sequelize';
import { sequelize } from '../config/db';
import { EstadoTraje } from './Enums';

//Se define lo que tiene un traje en una interfaz tipada
interface TrajeAttributes {
    id: number;
    codigoEtiqueta: string;
    talle: string;
    color: string;
    categoria: string;
  cantidad: number;
    precioAlquilerBase: number;
    estado: EstadoTraje;
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
    public cantidad!: number;
    public precioAlquilerBase!: number;
    public estado!: EstadoTraje;

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
    cantidad: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 1,
    },
    precioAlquilerBase: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
    },
    estado: {
      type: DataTypes.ENUM(...Object.values(EstadoTraje)),
      allowNull: false,
      defaultValue: EstadoTraje.DISPONIBLE,
    },
  },
  {
    sequelize,
    tableName: 'trajes',
  }
);
