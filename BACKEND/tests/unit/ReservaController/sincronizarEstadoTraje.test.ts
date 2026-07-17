import { sincronizarEstadoTraje } from '../../../src/controllers/ReservaController';
import { Traje } from '../../../src/models/Traje';
import { EstadoTraje } from '../../../src/models/Enums';

// IMPORTANTE: no usamos jest.mock('.../Traje') porque reemplaza la clase entera
// y rompe las asociaciones de Sequelize que se definen al importar Reserva.ts
// (Reserva.belongsTo(Traje) exige que Traje siga siendo una subclase real de Model).
// En cambio, con jest.sp