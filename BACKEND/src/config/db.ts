import { Sequelize } from 'sequelize';
import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

// Configuración de Sequelize para PostgreSQL 
export const sequelize = new Sequelize(
    process.env.DB_NAME as string,
    process.env.DB_USER as string,
    process.env.DB_PASSWORD as string,
    {
        host: process.env.DB_HOST,
        port: Number(process.env.DB_PORT) || 5433,
        dialect: 'postgres',
        logging: false, // Cambiar a console.log para ver las consultas SQL
        define: {
            timestamps: true //Activa el createdAt y updatedAt globalmente
        }
    }
);

// Función para conectar a MongoDB 
export const connectMongo = async (): Promise<void> => {
    try {
        const mongoUri = process.env.MONGO_URI || 'mongodb://localhost:27017/alquiler_logs';
        await mongoose.connect(mongoUri);
        console.log('MongoDB Conectado');
    } catch (error) {
        console.error('Error al conectar MongoDB:', error);
        process.exit(1); // Detiene la app si no hay conexión a la DB
    }
};