import { Request, Response } from 'express';
import Cliente from '../models/Cliente';
import { Log } from '../models/Log';

export const getClientes = async (req: Request, res: Response) => {
    const listClientes = await Cliente.findAll();
    res.json(listClientes);
};

export const getClienteById = async (req: Request, res: Response) => {
    const { id } = req.params;
    const cliente = await Cliente.findByPk(Number(id));
    res.json(cliente);
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

export const putCliente = async (req: Request<{ id: string }>, res: Response) => {
  const { id } = req.params;
  const { body } = req;

  try {
    const cliente: any = await Cliente.findByPk(Number(id));
    if (!cliente) {
      return res.status(404).json({ msg: 'Cliente no encontrado' });
    }

    await cliente.update(body);

    await Log.create({
      accion: 'ACTUALIZAR_CLIENTE',
      descripcion: `Se actualizó el cliente ${cliente.nombre}`,
      metadata: { clienteId: cliente.id },
    });

    return res.json({ msg: 'Cliente actualizado con éxito', cliente });
  } catch (error) {
    return res.status(500).json({ msg: 'Error al actualizar el cliente', error });
  }
};

export const deleteCliente = async (req: Request<{ id: string }>, res: Response) => {
    const { id } = req.params;

    try {
        const cliente: any = await Cliente.findByPk(Number(id));
        if (!cliente) {
            return res.status(404).json({ msg: 'Cliente no encontrado' });
        }

        await cliente.destroy();

        await Log.create({
            accion: 'ELIMINAR_CLIENTE',
            descripcion: `Se eliminó el cliente ${cliente.nombre}`,
            metadata: { clienteId: cliente.id },
        });

        return res.json({ msg: 'Cliente eliminado con éxito' });
    } catch (error) {
        return res.status(500).json({ msg: 'Error al eliminar el cliente', error });
    }
};