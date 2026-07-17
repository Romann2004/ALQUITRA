import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import validateToken from '../../../src/middlewares/validateToken';

// jsonwebtoken expone sus funciones con descriptores de propiedad no
// configurables (mismo caso que vimos en AuthControllers), así que se
// mockea el módulo completo en vez de usar jest.spyOn.
jest.mock('jsonwebtoken');
const mockedJwt = jwt as jest.Mocked<typeof jwt>;

const mockResponse = () => {
    const res: any = {};
    res.status = jest.fn().mockReturnValue(res);
    res.json = jest.fn().mockReturnValue(res);
    return res as Response;
};

const mockRequest = (authorization?: string) =>
    ({ headers: { authorization } } as unknown as Request);

describe('validateToken', () => {
    let next: NextFunction;

    beforeEach(() => {
        next = jest.fn();
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    // --- CASO 1: Sin header Authorization ---
    // No debe intentar verificar nada, directamente corta el acceso.
    test('debería responder 401 "Acceso denegado" si no viene el header Authorization', () => {
        const req = mockRequest(undefined);
        const res = mockResponse();

        validateToken(req, res, next);

        expect(mockedJwt.verify).not.toHaveBeenCalled();
        expect(res.status).toHaveBeenCalledWith(401);
        expect(res.json).toHaveBeenCalledWith({ msg: 'Acceso denegado' });
        expect(next).not.toHaveBeenCalled();
    });

    // --- CASO 2: Header sin el prefijo "Bearer " ---
    // Un token mandado en un formato distinto también debe rechazarse
    // como acceso denegado (no como token inválido).
    test('debería responder 401 "Acceso denegado" si el header no tiene el formato Bearer', () => {
        const req = mockRequest('token-sin-formato');
        const res = mockResponse();

        validateToken(req, res, next);

        expect(mockedJwt.verify).not.toHaveBeenCalled();
        expect(res.status).toHaveBeenCalledWith(401);
        expect(res.json).toHaveBeenCalledWith({ msg: 'Acceso denegado' });
        expect(next).not.toHaveBeenCalled();
    });

    // --- CASO 3: Token inválido o expirado ---
    // El header viene con el formato correcto, pero jwt.verify lanza
    // (firma inválida, token expirado, etc).
    test('debería responder 401 "Token no válido" si jwt.verify lanza una excepción', () => {
        mockedJwt.verify.mockImplementation(() => {
            throw new Error('jwt expired');
        });

        const req = mockRequest('Bearer token-vencido');
        const res = mockResponse();

        validateToken(req, res, next);

        expect(mockedJwt.verify).toHaveBeenCalledWith('token-vencido', 'CLAVE_SECRETA_SUPER_SEGURA');
        expect(res.status).toHaveBeenCalledWith(401);
        expect(res.json).toHaveBeenCalledWith({ msg: 'Token no válido' });
        expect(next).not.toHaveBeenCalled();
    });

    // --- CASO 4: Token válido ---
    // Debe dejar pasar la request llamando a next(), sin responder nada.
    test('debería llamar a next() si el token es válido', () => {
        mockedJwt.verify.mockReturnValue({ id: 1, username: 'manuel' } as any);

        const req = mockRequest('Bearer token-valido');
        const res = mockResponse();

        validateToken(req, res, next);

        expect(mockedJwt.verify).toHaveBeenCalledWith('token-valido', 'CLAVE_SECRETA_SUPER_SEGURA');
        expect(next).toHaveBeenCalled();
        expect(res.status).not.toHaveBeenCalled();
        expect(res.json).not.toHaveBeenCalled();
    });
});
