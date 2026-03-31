import { Router } from 'express';
import { getDashboardStats } from '../controllers/DashboardController';
// Aquí se puede importar el middleware de JWT para que solo el admin lo vea

const router = Router();

router.get('/stats', getDashboardStats);

export default router;