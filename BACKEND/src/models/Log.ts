import { Schema, model } from 'mongoose';

const LogSchema = new Schema({
    accion: { type: String, required: true }, //Como por ej: CREAR_TRAJE
    descripcion: { type: String, required: true },
    fecha: { type: Date, default: Date.now },
    metadata: { type: Object }  // Esto guarda el ID del traje que se creó
});

export const Log = model('Log', LogSchema);