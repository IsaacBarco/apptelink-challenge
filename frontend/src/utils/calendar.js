import { toEcuadorTime, ECUADOR_TIMEZONE } from './timezone';

/**
 * Genera slots de tiempo para horario de trabajo (8AM - 4PM)
 * @returns {string[]} Array de horarios en formato HH:00
 */
export const generateTimeSlots = () => {
    const slots = [];
    for (let hour = 8; hour <= 16; hour++) {
        const time = `${hour.toString().padStart(2, '0')}:00`;
        slots.push(time);
    }
    return slots;
};

/**
 * Formatea fecha para header de calendario
 * @param {Date} date - Fecha a formatear
 * @returns {string} Fecha formateada para mostrar
 */
export const formatDateHeader = (date) => {
    if (!date) return '';
    const ecuadorDate = toEcuadorTime(date);
    return ecuadorDate.toLocaleDateString('es-EC', {
        timeZone: ECUADOR_TIMEZONE,
        weekday: 'short',
        day: 'numeric',
        month: 'short'
    });
};