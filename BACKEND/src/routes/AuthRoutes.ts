import { Router } from 'express';
import { Login, registrarUsuario } from '../controllers/AuthControllers';

const router = Router();

router.post('/login', Login);
router.post('/register', registrarUsuario); // Solo para pruebas iniciales

export default router;
