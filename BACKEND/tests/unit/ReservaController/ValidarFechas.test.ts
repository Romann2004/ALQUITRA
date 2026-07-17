import { validarFechas } from '../../../src/controllers/ReservaController';

describe('validarFechas', () => {

    // --- CASO 1: Devolución anterior al retiro ---
    test('debería rechazar si la fecha de devolución es anterior a la de retiro', () => {
        const resultado = validarFechas('2026-06-20', '2026-06-15', false);
        expect(resultado).toBe('La fecha de devolución debe ser posterior al retiro.');
    });

    // --- CASO 2: Devolución igual al retiro (mismo día) ---
    test('debería rechazar si la fecha de devolución es igual a la de retiro', () => {
        const resultado = validarFechas('2026-06-20', '2026-06-20', false);
        expect(resultado).toBe('La fecha de devolución debe ser posterior al retiro.');
    });

    // --- CASO 3: Fechas válidas en una edición (esNuevaReserva = false) ---
    test('debería aceptar fechas válidas cuando no es una reserva nueva', () => {
        const resultado = validarFechas('2026-06-15', '2026-06-20', false);
        expect(resultado).toBeNull();
    });

    // --- CASO 4: Retiro en el pasado, pero solo aplica si es reserva nueva ---
    test('debería rechazar fecha de retiro pasada si es una reserva nueva', () => {
        const resultado = validarFechas('2020-01-01', '2020-01-05', true);
        expect(resultado).toBe('La fecha de retiro no puede ser anterior a hoy.');
    });

    // --- CASO 5: Retiro en el pasado, pero NO aplica si es una edición ---
    test('debería permitir fecha de retiro pasada si es una edición (no nueva)', () => {
        const resultado = validarFechas('2020-01-01', '2020-01-05', false);
        // Como esNuevaReserva es false, no se valida si el retiro es pasado.
        // Solo importa que la devolución sea posterior al retiro.
        expect(resultado).toBeNull();
    });

    // --- CASO 6: Reserva nueva con fechas correctas (futuras y en orden) ---
    // Se calculan en base a "hoy" para que el test no dependa de una fecha fija
    // que eventualmente queda en el pasado.
    test('debería aceptar una reserva nueva con fechas correctas', () => {
 