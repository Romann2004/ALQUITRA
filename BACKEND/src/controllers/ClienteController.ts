import { Request, Response } from 'express';
import Cliente from '../models/Cliente';
import { Log } from '../models/Log';
import { Op } from 'sequelize';
import Reserva from '../models/Reserva';
import { EstadoReserva } from '../models/Enums';

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
    try {
        //Extraemos y sanitizamos de forma segura forzando Strings limpios
        const nombreClean = req.body.nombre ? String(req.body.nombre).trim() : '';
        const dniClean = req.body.dni ? String(req.body.dni).trim() : '';
        const emailClean = req.body.email ? String(req.body.email).trim().toLowerCase() : '';
        const telefonoClean = req.body.telefono ? String(req.body.telefono).trim() : '';

        if (!nombreClean || !dniClean) {
            return res.status(400).json({ msg: 'El nombre y el DNI son campos obligatorios.' });
        }
        
        // DETECTOR DE DUPLICADOS (DNI o Email repetido)
        const clienteExistente: any = await Cliente.findOne({
            where: {
                [Op.or]: [
                    { dni: dniClean },
                    { email: emailClean }
                ]
            }
        });

        if (clienteExistente) {
            // Si existe pero estaba ELIMINADO (Soft Delete) -> Lo REACTIVAMOS
            if (!clienteExistente.activo) {
                await clienteExistente.update({
                    nombre: nombreClean,
                    dni: dniClean,
                    email: emailClean,
                    telefono: telefonoClean,
                    activo: true // Lo revivimos
                });
                await Log.create({
                    accion: 'REACTIVAR_CLIENTE',
                    descripcion: `Se reactivó el cliente ${clienteExistente.nombre} que estaba dado de baja.`,
                    metadata: { clienteId: clienteExistente.id }
                });

                return res.json({ msg: 'Cliente registrado con éxito', cliente: clienteExistente });
            }

            // Si existe y ESTÁ ACTIVO -> Tiramos el error normal
            const campoDuplicado = (clienteExistente as any).dni === dniClean ? 'DNI' : 'Email';
            return res.status(400).json({
                msg: `El ${campoDuplicado} ingresado ya se encuentra registrado en un cliente activo del sistema.`
            });
        }

        // Creación inyectando los valores sanitizados explícitamente
        const cliente: any = await Cliente.create({
            nombre: nombreClean,
            dni: dniClean,
            email: emailClean,
            telefono: telefonoClean,
            activo: true // Forzamos que nazca activo
        });

        await Log.create({
            accion: 'CREAR_CLIENTE',
            descripcion: `Se creó el cliente ${cliente.nombre}`,
            metadata: { clienteId: cliente.id }
        });

        res.json({ msg: 'Cliente creado con éxito', cliente });
    } catch (error) {
        console.error('Error interno en postCliente:', error); // Esto nos muestra en la terminal de Node si algo falla
        res.status(500).json({ msg: 'Error interno en el servidor al crear el cliente', error });
    }
};

export const putCliente = async (req: Request, res: Response) => {
  const { id } = req.params;

  try {
    const cliente: any = await Cliente.findByPk(Number(id));
    if (!cliente || !cliente.activo) {
      return res.status(404).json({ msg: 'Cliente no encontrado' });
    }
    
    // 1. Sanitización explícita mapeando tipos string
    const nombreClean = req.body.nombre ? String(req.body.nombre).trim() : cliente.nombre;
    const dniClean = req.body.dni ? String(req.body.dni).trim() : cliente.dni;
    const emailClean = req.body.email ? String(req.body.email).trim().toLowerCase() : cliente.email;
    const telefonoClean = req.body.telefono ? String(req.body.telefono).trim() : cliente.telefono;

    // 2. CONTROL DE DUPLICADOS EXCLUYENDO AL MISMO USUARIO
    const duplicado = await Cliente.findOne({
        where: {
            id: { [Op.ne]: Number(id) }, // para no comparar con el mismo usuario
            [Op.or]: [
                { dni: dniClean },
                { email: emailClean }
            ]
        }
    });

    if (duplicado) {
        const campoDuplicado = (duplicado as any).dni === dniClean ? 'DNI' : 'Email';
        return res.status(400).json({
            msg: `No se pudo actualizar: El ${campoDuplicado} ya pertenece a otro cliente.`
        });
    }
    
    await cliente.update({
        nombre: nombreClean,
        dni: dniClean,
        email: emailClean,
        telefono: telefonoClean
    });

    await Log.create({
      accion: 'ACTUALIZAR_CLIENTE',
      descripcion: `Se actualizó el cliente ${cliente.nombre}`,
      metadata: { clienteId: cliente.id },
    });

    return res.json({ msg: 'Cliente actualizado con éxito', cliente });
  } catch (error) {
    console.error('Error interno en putCliente:', error);
    return res.status(500).json({ msg: 'Error interno en el servidor al actualizar el cliente', error });
  }
};

export const patchCliente = async (req: Request, res: Response) => {
    const { id } = req.params;
    let { nombre, dni, email, telefono } = req.body;
    
    try {
        const cliente: any = await Cliente.findByPk(Number(id));
        if (!cliente || !cliente.activo) {
            return res.status(404).json({ msg: 'Cliente no encontrado' });
        }

        // --- 1. CONTROL DE DUPLICADOS (Solo si vienen en la petición) ---
        if (dni || email) {
            const condiciones: any[] = [];
            if (dni) condiciones.push({ dni: dni.trim() });
            if (email) condiciones.push({ email: email.trim().toLowerCase() });

            const duplicado = await Cliente.findOne({
                where: {
                    id: { [Op.ne]: Number(id) }, // Excluimos al cliente actual}
                    [Op.or]: condiciones
                }
            });

            if (duplicado) {
                return res.status(400).json({
                    msg: 'El DNI o Email ya corresponden a otro cliente registrado.'
                });
            }
        }

        // --- 2. ACTUALIZACIÓN PARCIAL CON SANITIZACIÓN ---
        const camposAActualizar: any = {}
        if (nombre !== undefined) camposAActualizar.nombre = nombre.trim();
        if (dni !== undefined) camposAActualizar.dni = dni.trim();
        if (email !== undefined) camposAActualizar.email = email.trim().toLowerCase();
        if (telefono !== undefined) camposAActualizar.telefono = telefono;
        
        await cliente.update(camposAActualizar);

        await Log.create({
            accion: 'ACTUALIZAR_PARCIAL_CLIENTE',
            descripcion: `Se actualizó parcialmente el cliente ${cliente.nombre}`,
            metadata: { clienteId: cliente.id, camposModificados: Object.keys(camposAActualizar) },
        });

        return res.json({ msg: 'Cliente actualizado parcialmente con éxito', cliente });

    } catch (error) {
        return res.status(500).json({ msg: 'Error al actualizar parcialmenteel cliente', error });
    }
}

export const deleteCliente = async (req: Request, res: Response) => {
    const { id } = req.params;

    try {
        const cliente: any = await Cliente.findByPk(Number(id));
        if (!cliente) {
            return res.status(404).json({ msg: 'Cliente no encontrado' });
        }

        // Verificamos si tiene reservas activas antes de borrarlo
        const reservasActivas = await Reserva.count({
            where: {
                clienteId: Number(id),
                activo: true, // Que no estén borradas lógicamente
                estado: {
                    [Op.in]: [EstadoReserva.PENDIENTE, EstadoReserva.RETIRADO]
                }
            }
        });

        // Si el contador es mayor a 0, bloqueamos el borrado
        if (reservasActivas > 0) {
            return res.status(400).json({
                msg: 'No se puede eliminar: El cliente tiene reservas pendientes o trajes sin devolver.'
            });
        }

        // BORRADO LÓGICO
        await cliente.update({ activo: false });

        await Log.create({
            accion: 'ELIMINAR_CLIENTE_LÓGICO',
            descripcion: `Se desactivó al cliente ${cliente.nombre} (Borrado Lógico)`,
            metadata: { clienteId: cliente.id },
        });

        return res.json({ msg: 'Cliente eliminado con éxito' });
    } catch (error) {
        return res.status(500).json({ msg: 'Error al eliminar el cliente', error });
    }
};