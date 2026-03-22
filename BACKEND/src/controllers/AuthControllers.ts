import { Request, Response } from 'express';
import * as bcrypt from 'bcrypt'; // Importación correcta para TS
import User from '../models/Users';
import { Log } from '../models/Log';
import * as jwt from 'jsonwebtoken';

export const registrarUsuario = async (req: Request, res: Response) => {
    const { username, password } = req.body;
    try {
      //Encriptamos la contraseña (10 es el nivel de seguridad)
      const hashedPassword = await bcrypt.hash(password, 10);

      const nuevoUsuario = await User.create({
        username,
        password: hashedPassword
      });
    
      // Log de Registro exitoso
      await Log.create({  
        accion: 'REGISTRO_EXITOSO',
        descripcion: `Nuevo usuario registrado: ${username}`,
        metadata: { userId: nuevoUsuario.id }
      });

      res.json({
        ok: true,
        msg: 'Usuario creado con éxito',
        usuario: nuevoUsuario.username
      });
    } catch (error) {
      // LOG DE FALLO (Opcional, por si el username ya existe)
      await Log.create({
        accion: 'REGISTRO_FALLIDO',
        descripcion: `Intento de registro fallido para el username: ${username}`
    });
        res.status(500).json({
            ok: false,
            msg: 'Error al registrar el usuario'
        });
    }
};

export const Login = async (req: Request, res: Response) => {
    const { username, password } = req.body;
    try {
      // 1. ¿Existe el usuario?   
      const user = await User.findOne({ where: { username } });
      if (!user) {
        await Log.create({  
          accion: 'LOGIN_FALLIDO',
          descripcion: `Intento de acceso fallido: el usuario ${username} no existe.`,
          metadata: { ip: req.ip, username }
        });
        return res.status(400).json({ msg: 'Usuario o contraseña incorrectos' });
      } 

      // 2. ¿La contraseña es correcta?
      const validPassword = await bcrypt.compare(password, user.password);
      if (!validPassword) {
        await Log.create({
          accion: 'LOGIN_FALLIDO',
          descripcion: `Contraseña incorrecta para el usuario: ${username}`,
          metadata: { userId: user.id }
        });
      return res.status(400).json({ msg: 'Usuario o contraseña incorrectos' });
      }

      // Generar JWT
      const token = jwt.sign(
        { id: user.id, username: user.username },
        'CLAVE_SECRETA_SUPER_SEGURA',
        { expiresIn: '4h' }  // El token expira en 4 horas 
      );
      
      // 3. Respuesta exitosa
      await Log.create({
        accion: 'LOGIN_EXITOSO',
        descripcion: `Token generado para ${username}`, //`Sesión iniciada por: ${username}`,
        metadata: { userId: user.id }
      });

      // Devolvemos el token al Frontend
      return res.json({
        ok: true,
        msg: 'Login exitoso',
        username: user.username,
        token: token
      });

    } catch (error) {
        res.status(500).json({ ok: false, msg: 'Error en el servidor' });
    } 
};
