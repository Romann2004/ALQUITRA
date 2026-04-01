import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

const validateToken = (req: Request, res: Response, next: NextFunction) => {
    const headerToken = req.headers['authorization'];

    // ¿Tiene el token en el header? (Viene como 'Bearer <token>')
    if (headerToken != undefined && headerToken.startsWith('Bearer ')) {
        try {
            const bearerToken = headerToken.slice(7); // Elimina 'Bearer ' para obtener solo el token
            
            jwt.verify(bearerToken, 'CLAVE_SECRETA_SUPER_SEGURA');

            next(); // El token es válido, puede pasar al controlador            
        } catch (error) {
            res.status(401).json({ msg: 'Token no válido' });
        }
    } else {
        res.status(401).json({ msg: 'Acceso denegado' });
    }
}

export default validateToken;