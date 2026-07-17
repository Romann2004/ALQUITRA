import { validarEstadoEnum } from '../../../src/controllers/ReservaController';

describe('validarEstadoEnum', () => {

    // --- CASO 1: Estado válido ---
    test('debería aceptar un estado válido', () => {
        const resultado = validarEstadoEnum('PENDIENTE');
        expect(resultado).toBeNull();
    });

    // --- CASO 2: Estado inválido ---
    test('debería rechazar un estado inválido', () => {
        const resultado = validarEstadoEnum('INVALIDO');
        expect(resultado).toBe('Estado no válido');
    });
})