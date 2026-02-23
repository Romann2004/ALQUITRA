import { Router } from 'express';
import { crearTraje, obtenerTrajes } from '../controllers/TrajeControllers';

const router = Router();

// Definimos los endpoints
router.post('/', crearTraje);     // POST http://localhost:3000/api/trajes
router.get('/', obtenerTrajes);   // GET  http://localhost:3000/api/trajes

export default router;