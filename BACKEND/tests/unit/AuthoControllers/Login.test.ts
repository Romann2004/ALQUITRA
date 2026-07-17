import { Request, Response } from 'express';
import * as bcrypt from 'bcrypt';
import * as jwt from 'jsonwebtoken';
import { Login } from '../../../src/controllers/AuthControllers';
import User from '../../../src/models/Users';
import { Log } from '../../../src/models/Log';

// bcrypt y jsonwebtoken exponen sus funciones con descriptores de propiedad
// no configurables, por lo que jest.spyOn() falla con "Cannot redefine
// property". Los mockeamos con jest.mock() en vez de spyOn (no son modelos
// nuestros, así que auto-mockearlos no rompe nada como sí pasaba con Traje).
jest.mock('bcrypt');
jest.mock('jsonwebtoken');
const mockedBcrypt = bcrypt as jest.Mocked<typeof bcrypt>;
const mockedJwt = jwt as jest.Mocked<typeof jwt>;

const mockResponse = () => {
    const res: any = {};
    res.status = jest.fn().mockReturnValue(res);
    res.json = jest.fn().mockReturnValue(res);
    return res as Response;
};

describe('Login', () => {
    let findOneSpy: jest.SpyInstance;
    let logCreateSpy: jest.SpyInstance;

    beforeEach(() => {
        logCreateSpy = jest.spyOn(Log, 'create').mockResolvedValue({} as any);
    });

    afterEach(() => {
        jest.restoreAllMocks();
        jest.clearAllMocks();
    });

    // --- CASO 1: El usuario no existe ---
    // Debe cortar antes de comparar contraseñas, loguear el intento fallido
    // y responder 400 con un mensaje genérico (no debe revelar si el
    // problema fue el usuario o la contraseña, por seguridad).
    test('debería responder 400 y loguear el intento fallido si el usuario no existe', async () => {
        findOneSpy = jest.spyOn(User, 'findOne').mockResolvedValue(null);

        const req = { body: { username: 'inexistente', password: '1234' }, ip: '127.0.0.1' } as Request;
        const res = mockResponse();

        await Login(req, res);

        expect(findOneSpy).toHaveBeenCalledWith({ where: { username: 'inexistente' } });
        expect(logCreateSpy).toHaveBeenCalledWith(expect.objectContaining({ accion: 'LOGIN_FALLIDO' }));
        expect(res.status).toHaveBeenCalledWith(400);
        expect(res.json).toHaveBeenCalledWith({ msg: 'Usuario o contraseña incorrectos' });
    });

    // --- CASO 2: La contraseña es incorrecta ---
    // El usuario existe pero bcrypt.compare devuelve false: debe loguear el
    // fallo y responder el mismo 400 genérico (mismo mensaje que el caso 1).
    test('debería responder 400 y loguear el intento fallido si la contraseña es incorrecta', async () => {
        findOneSpy = jest.spyOn(User, 'findOne').mockResolvedValue(
            { id: 1, username: 'manuel', password: 'hashReal' } as any
        );
        mockedBcrypt.compare.mockResolvedValue(false as never);

        const req = { body: { username: 'manuel', password: 'incorrecta' }, ip: '127.0.0.1' } as Request;
        const res = mockResponse();

        await Login(req, res);

        expect(mockedBcrypt.compare).toHaveBeenCalledWith('incorrecta', 'hashReal');
        expect(logCreateSpy).toHaveBeenCalledWith(expect.objectContaining({ accion: 'LOGIN_FALLIDO' }));
        expect(res.status).toHaveBeenCalledWith(400);
        expect(res.json).toHaveBeenCalledWith({ msg: 'Usuario o contraseña incorrectos' });
    });

    // --- CASO 3: Login exitoso ---
    // Usuario válido + contraseña correcta: debe generar el JWT con el
    // payload esperado, loguear el éxito y devolver token + datos del user.
    test('debería devolver el token y loguear el login exitoso con credenciales correctas', async () => {
        findOneSpy = jest.spyOn(User, 'findOne').mockResolvedValue(
            { id: 1, username: 'manuel', password: 'hashReal' } as any
        );
        mockedBcrypt.compare.mockResolvedValue(true as never);
        mockedJwt.sign.mockReturnValue('token-falso' as never);

        const req = { body: { username: 'manuel', password: '1234' }, ip: '127.0.0.1' } as Request;
        const res = mockResponse();

        await Login(req, res);

        expect(mockedJwt.sign).toHaveBeenCalledWith(
            { id: 1, username: 'manuel' },
            'CLAVE_SECRETA_SUPER_SEGURA',
            { expiresIn: '24h' }
        );
        expect(logCreateSpy).toHaveBeenCalledWith(expect.objectContaining({ accion: 'LOGIN_EXITOSO' }));
        expect(res.json).toHaveBeenCalledWith({
            ok: true,
            msg: 'Login exitoso',
            username: 'manuel',
            token: 'token-falso',
        });
    });

    // --- CASO 4: Error interno inesperado ---
    // Si algo revienta antes de las validaciones normales (ej. la consulta
    // a la base de datos falla), debe caer al catch y responder 500 sin
    // filtrar el detalle del error.
    test('debería responder 500 si ocurre un error inesperado en el proceso', async () => {
        findOneSpy = jest.spyOn(User, 'findOn