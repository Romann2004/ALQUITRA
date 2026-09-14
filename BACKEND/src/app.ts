import express from 'express';
import cors from 'cors';
import cron from 'node-cron';
import { sequelize, connectMongo } from './config/db';
import TrajeRoutes from './routes/TrajeRoutes';
import authRoutes from './routes/AuthRoutes';
import dashboardRoutes from './routes/DashboardRoutes';
import routerClientes from './routes/ClienteRoutes';
import ReservaRoutes from './routes/ReservaRoutes';
import swaggerUi from 'swagger-ui-express';
import YAML from 'yamljs';
import path from 'path';
import { revisarTransicionesAutomaticas } from './jobs/revisionAutomaticaReservas';

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
app.use('/api/reservas', ReservaRoutes);

// Documentación Swagger
const swaggerDocument = YAML.load(path.join(__dirname, '../../Swagger'));
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));

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

        //Sincronizar tablas sin perder datos para aplicar cambios de modelo
        await sequelize.sync({ alter: true });
        console.log("Tablas sincronizadas con la DB.");
        console.log('Modelos sincronizados con la DB')

        // Revisión de transiciones automáticas de estado de reservas:
        // una vez al arrancar (para ponerse al día si el server estuvo apagado)...
        await revisarTransicionesAutomaticas();
        console.log('Revisión automática de estados de reservas completada.');

        // ...y luego todos los días a las 00:05.
        cron.schedule('5 0 * * *', () => {
            revisarTransicionesAutomaticas().catch((error) => {
                console.error('Error en la revisión automática de estados de reservas:', error);
            });
        });

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