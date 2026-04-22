import { Router } from "express";
import { postReserva, updateReserva, updateEstadoReserva, getReservas, deleteReserva } from "../controllers/ReservaController";
import validateToken from "../middlewares/validateToken";

const router = Router();

router.post('/', validateToken, postReserva);
router.get('/', validateToken, getReservas);
router.put('/:id', validateToken, updateReserva);
router.patch('/:id/estado', validateToken, updateEstadoReserva);
router.delete('/:id', validateToken, deleteReserva);
export default router;

