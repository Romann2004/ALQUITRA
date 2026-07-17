import { validarSenia } from '../../../src/controllers/ReservaController';

describe('validarSenia', () => {

    // --- CASO 1: Señal negativa ---
    test('debería rechazar si la seña es negativa', () => {
        const resultado = validarSenia(-100);
        expect(resultado).toBe('La seña no puede ser negativa.');
    });

    // --- CASO 2: Monto mayor al máximo permitido (500) ---
    test('debería rechazar si la seña es mayor a 500', () => {
        const resultado = validarSenia(501);
        expect(resultado).toBe('La seña no puede ser mayor a 500.');
    });

