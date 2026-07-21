import { Router } from 'express';
import { crearTraje, obtenerTrajes, actualizarTraje, eliminarTraje, actualizarParcialTraje, obtenerDisponibilidadTraje } from '../controllers/TrajeControllers';

const router = Router();

// Definimos los endpoints
router.post('/', crearTraje);     // POST http://localhost:3000/api/trajes
router.get('/', obtenerTrajes);   // GET  http://localhost:3000/api/trajes
router.get('/:id/disponibilidad', obtenerDisponibilidadTraje);   // GET  http://localhost:3000/api/trajes/:id/disponibilidad
router.put('/:id', actualizarTraje); // PUT  http://localhost:3000/api/trajes/:id
router.patch('/:id', actualizarParcialTraje); // PATCH  http://localhost:3000/api/trajes/:id
router.delete('/:id', eliminarTraje); // DELETE http://localhost:3000/api/trajes/:id

export default router;