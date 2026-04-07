import { Router } from 'express';
import { getClientes, postCliente, getClienteById, putCliente, deleteCliente, patchCliente } from '../controllers/ClienteController';
import validateToken from '../middlewares/validateToken'; //middleware de seguridad

const router = Router();

//Protegemos las rutas con el token
router.get('/', validateToken, getClientes);
router.post('/', validateToken, postCliente);
router.get('/:id', validateToken, getClienteById);
router.put('/:id', validateToken, putCliente);
router.patch('/:id', validateToken, patchCliente);
router.delete('/:id', validateToken, deleteCliente);

export default router;