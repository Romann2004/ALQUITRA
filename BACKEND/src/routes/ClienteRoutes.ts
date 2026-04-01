import { Router } from 'express';
import { getClientes, postCliente } from '../controllers/ClienteController';
import validateToken from '../middlewares/validateToken'; //middleware de seguridad

const router = Router();

//Protegemos las rutas con el token
router.get('/', validateToken, getClientes);
router.post('/', validateToken, postCliente);

export default router;