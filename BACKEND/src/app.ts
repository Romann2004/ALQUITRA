import express from 'express';
import cors from 'cors';
import { sequelize,connectMongo } from './config/db';
import trajeRoutes from './routes/TrajeRoutes';

const app = express();
const PORT = process.env.PORT || 3000;

// Middlewares
app.use(express.json());
app.use(cors());
app.use('/api/trajes', trajeRoutes);

// Ruta de prueba
app.get('/api/status', (req, res) => {
    res.json({ 
        status: 'ok', 
        message: 'Servidor de Alquiler de Trajes funcionando' 
    });
});

//Función de arranque del servidor
async function bootstrap() {
    try {
        // Conectar a PostgreSQL
        await sequelize.authenticate();
        console.log('PostgreSQL conectado exitosamente.');

        // Conectar a MongoDB
        await connectMongo();

        //Sincronizar tablas
        await sequelize.sync({ force: false });
        console.log('Modelos sincronizados con la DB')

        //Abrir el puerto
        app.listen(PORT, () => {
            console.log(`Servidor corriendo en http://localhost:${PORT}`);
        })
    } catch (error) {
        console.log('Error al iniciar el servidor:', error);
        process.exit(1);
    }
}

bootstrap();
