import { Router } from "express";
import { postReserva } from "../controllers/ReservaController";
import { getReservas } from "../controllers/ReservaController";
import validateToken from "../middlewares/validateToken";

const router = Router();

router.post('/', validateToken, postReserva);
router.get('/', validateToken, getReservas);

export default router;

