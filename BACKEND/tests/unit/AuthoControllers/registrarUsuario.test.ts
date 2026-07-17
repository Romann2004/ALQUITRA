import { Request, Response } from 'express';
import * as bcrypt from 'bcrypt';
import { registrarUsuario } from '../../../src/controllers/AuthControllers';
import User from '../../../src/models/Users';
import { Log } from '../../../src/models/Log';

// bcrypt es un módulo nativo: sus funciones tienen descriptores de propiedad
// no configurables, por lo que jest.spyOn() falla con "Cannot redefine
// property". Por eso acá usamos jest.mock() para reemplazar el módulo
// completo (a diferencia de nuestros modelos Sequelize, bcrypt no tiene
// efectos secundarios al importarse, así que auto-mockearlo es seguro).
jest.mock('bcrypt');
const mockedBcrypt = bcrypt as jest.Mocked<typeof bcrypt>;

const mockResponse = () => {
    const res: any = {};
    res.status = jest.fn().mockReturnValue(res);
    res.json = jest.fn().mockReturnValue(res);
    return res as Response;
};

describe('registrarUsuario', () => {
    let userCreateSpy: jest.SpyInstance;
    let logCreateSpy: jest.SpyInstance;

    beforeEach(() => {
        mockedBcrypt.hash.mockResolvedValue('hashedPassword123' as never);
        logCreateSpy = jest.spyOn(Log, 'create').mockResolvedValue({} as any);
    });

    afterEach(() => {
        jest.restoreAllMocks();
        jest.clearAllMocks();
    });

    // --- CASO 1: Registro exitoso ---
    // Verifica el camino feliz completo: se encripta la contraseña, se crea
    // el usuario con el hash (nunca con la contraseña en texto plano), se
    // registra el log de éxito y se responde con los datos correctos.
    test('debería crear el usuario, encriptar la contraseña y responder con éxito', async () => {
        userCreateSpy = jest.spyOn(User, 'create').mockResolvedValue(
            { id: 1, username: 'manuel', password: 'hashedPassword123' } as any
        );

        const req = { body: { username: 'manuel', password: '1234' } } as Request;
        const res = mockResponse();

        await registrarUsuario(req, res);

        expect(mockedBcrypt.hash).toHaveBeenCalledWith('1234', 10);
        expect(userCreateSpy).toHaveBeenCalledWith({ username: 'manuel', password: 'hashedPassword123' });
        expect(logCreateSpy).toHaveBeenCalledWith(expect.objectContaining({ accion: 'REGISTRO_EXITOSO' }));
        expect(res.json).toHaveBeenCalledWith({
            ok: true,
            msg: 'Usuario creado con éxito',
            usuario: 'manuel',
        });
    });

    // --- CASO 2: Falla la creación del usuario (ej. username duplicado) ---
    // Si User.create lanza un error, debe registrarse el log de fallo y
    // responder 500 sin filtrar detalles internos del error.
    test('debería registrar el log de fallo y responder 500 si falla la creación del usuario', async () => {
        userCreateSpy = jest.spyOn(User, 'create').mockRejectedValue(new Error('El username ya existe'));

        const req = { body: { us