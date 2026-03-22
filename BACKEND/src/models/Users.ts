import { DataTypes, Model } from 'sequelize';
import { sequelize } from '../config/db';

class User extends Model {
    public id!: number;
    public username!: string;
    public password!: string;
}

User.init({
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    username: {
        type: DataTypes.STRING,
        allowNull: true,
        unique: true
    },
    password: {
        type: DataTypes.STRING,
        allowNull: false
    }
}, {
    sequelize,
    modelName: 'User'

});

export default User;