import express from 'express';
import cors from 'cors';
import { sequelize,connectMongo } from './config/db';
import TrajeRoutes from './routes/TrajeRoutes';
import authRoutes from './routes/AuthRoutes';
import dashboardRoutes from './routes/DashboardRoutes';
import routerClientes from './routes/ClienteRoutes';
import ReservaRoutes from './routes/ReservaRoutes';

// Configuración inicial
const app = express();
const PORT = process.env.PORT || 3000;

// Middlewares
app.use(express.json());
app.use(cors());
app.use('/api/trajes', TrajeRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/clientes', routerClientes);
app.use('/api/reservas', ReservaRoutes );

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
        console.log('PostgreSQL conectado.');

        // Conectar a MongoDB
        await connectMongo();

        //Sincronizar tablas
        //await sequelize.sync({ force: true });
        console.log("Tablas sincronizadas con la DB.");
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
