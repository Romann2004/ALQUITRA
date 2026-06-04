import { Request, Response } from 'express';
import Cliente from '../models/Cliente';
import { Log } from '../models/Log';
import { Op } from 'sequelize';

export const getClientes = async (req: Request, res: Response) => {
    try {
        // Solo traemos los registros que tengan activo: true
        const listClientes = await Cliente.findAll({
            where: { activo: true}
        });
        res.json(listClientes);
    } catch (error) {
      res.status(500).json({ msg: 'Error al obtener los clientes', error });  
    }
};

export const getClienteById = async (req: Request, res: Response) => {
    const { id } = req.params;
    try {
        const cliente: any = await Cliente.findByPk(Number(id));
        if (!cliente || !cliente.activo) { // Si está desactivado, para el front no existe
            return res.status(404).json({ msg: 'Cliente no encontrado' });
        }
        res.json(cliente);
    } catch (error) {
        res.status(500).json({ msg: 'Error al obtener el cliente', error });
    }
};

export const postCliente = async (req: Request, res: Response) => {
    let { nombre, dni, email, telefono } = req.body;
    // const { body } = req;
    try {
        // 1. LIMPIEZA DE ESPACIOS Y SUBSTRINGS
        nombre = nombre?.trim();
        dni = dni?.trim();
        email = email?.trim();

        // 2. DETECTOR DE DUPLICADOS (DNI o Email repetido)
        const clienteExistente = await Cliente.findOne({
            where: {
                [Op.or]: [{ dni }, { email }]
            }
        });

        if (clienteExistente) {
            return res.status(400).json({
                msg: 'Ya existe un cliente registrado con ese DNI o Email.'
            });
        }

        // 3. GUARDADO REFORZADO
        const cliente: any = await Cliente.create({
            nombre,
            dni,
            email,
            telefono,
            activo: true // Forzamos que nazca activo
        });

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

export const patchCliente = async (req: Request<{id: string}>, res: Response) => {
    const { id } = req.params;
    const camposCambiados = req.body; // Ejemplo {telefono: '3462 554477'}

    try {
        const cliente: any = await Cliente.findByPk(id);
        if (!cliente) {
            return res.status(404).json({ msg: 'Cliente no encontrado' });
        }
        
        // Actualizamos solo lo que viene en el body
        await cliente.update(camposCambiados);

        await Log.create({
            accion: 'ACTUALIZAR_PARCIAL_CLIENTE',
            descripcion: `Se actualizó parcialmente el cliente ${cliente.nombre}`,
            metadata: { clienteId: cliente.id },
        });

        return res.json({ msg: 'Cliente actualizado parcialmente con éxito', cliente });

    } catch (error) {
        return res.status(500).json({ msg: 'Error al actualizar parcialmenteel cliente', error });
    }
}

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