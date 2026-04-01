import { Request, Response } from 'express';
import Cliente from '../models/Cliente';
import { Log } from '../models/Log';

export const getClientes = async (req: Request, res: Response) => {
    const listClientes = await Cliente.findAll();
    res.json(listClientes);
};

export const postCliente = async (req: Request, res: Response) => {
    const { body } = req;
    try {
        const cliente: any = await Cliente.create(body);

        await Log.create({
            accion: 'CREAR_CLIENTE',
            descripcion: `Se creó el cliente ${cliente.nombre}`,
            metadata: { clienteId: cliente.id }
        });

        res.json({ msg: 'Cliente creado con éxito', cliente });
    } catch (error) {
        res.status(500).json({ msg: 'Error al crear el cliente', error });
    }
};