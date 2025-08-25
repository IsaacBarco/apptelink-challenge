/**
 * Utilidades para manejar zona horaria de Ecuador (America/Guayaquil)
 * Estas funciones aseguran que todas las fechas se manejen en la zona horaria correcta
 */

// Zona horaria de Ecuador
export const ECUADOR_TIMEZONE = 'America/Guayaquil';

/**
 * Obtiene la fecha y hora actual en zona horaria de Ecuador
 */
export const getCurrentEcuadorTime = () => {
  return new Date().toLocaleString("en-US", { timeZone: ECUADOR_TIMEZONE });
};

/**
 * Convierte una fecha a zona horaria de Ecuador
 * @param {Date|string} date - Fecha a convertir
 * @returns {Date} Fecha en zona horaria de Ecuador
 */
export const toEcuadorTime = (date) => {
  if (!date) return new Date();
  
  const inputDate = typeof date === 'string' ? new Date(date) : date;
  
  // Crear fecha en zona horaria de Ecuador
  const ecuadorTime = new Date(inputDate.toLocaleString("en-US", { timeZone: ECUADOR_TIMEZONE }));
  return ecuadorTime;
};

/**
 * Formatea una fecha para enviar al backend (ISO string)
 * @param {Date} date - Fecha a formatear
 * @returns {string} Fecha en formato ISO
 */
export const formatDateForBackend = (date) => {
  if (!date) return '';
  
  // Convertir a Ecuador timezone antes de enviar al backend
  const ecuadorDate = toEcuadorTime(date);
  return ecuadorDate.toISOString();
};

/**
 * Formatea una fecha recibida del backend para mostrar en frontend
 * @param {string} isoString - Fecha en formato ISO del backend
 * @returns {Date} Fecha ajustada para zona horaria de Ecuador
 */
export const formatDateFromBackend = (isoString) => {
  if (!isoString) return new Date();
  
  return toEcuadorTime(new Date(isoString));
};

/**
 * Formatea fecha y hora para inputs datetime-local
 * @param {Date} date - Fecha a formatear
 * @returns {string} Fecha en formato YYYY-MM-DDTHH:MM
 */
export const formatDateTimeLocal = (date) => {
  if (!date) return '';
  
  const ecuadorDate = toEcuadorTime(date);
  
  // Formatear para input datetime-local
  const year = ecuadorDate.getFullYear();
  const month = String(ecuadorDate.getMonth() + 1).padStart(2, '0');
  const day = String(ecuadorDate.getDate()).padStart(2, '0');
  const hours = String(ecuadorDate.getHours()).padStart(2, '0');
  const minutes = String(ecuadorDate.getMinutes()).padStart(2, '0');
  
  return `${year}-${month}-${day}T${hours}:${minutes}`;
};

/**
 * Parsea una fecha de input datetime-local asumiendo zona horaria de Ecuador
 * @param {string} datetimeLocal - Valor de input datetime-local
 * @returns {Date} Fecha interpretada en zona horaria de Ecuador
 */
export const parseDateTimeLocal = (datetimeLocal) => {
  if (!datetimeLocal) return new Date();
  
  // Crear fecha local y luego ajustar a zona horaria de Ecuador
  const localDate = new Date(datetimeLocal);
  return toEcuadorTime(localDate);
};

/**
 * Obtiene solo la fecha en formato YYYY-MM-DD en zona horaria de Ecuador
 * @param {Date} date - Fecha
 * @returns {string} Fecha en formato YYYY-MM-DD
 */
export const getEcuadorDateString = (date = new Date()) => {
  const ecuadorDate = toEcuadorTime(date);
  return ecuadorDate.toISOString().split('T')[0];
};

/**
 * Verifica si una fecha está en horario de trabajo (8AM - 4PM Ecuador)
 * @param {Date} date - Fecha a verificar
 * @returns {boolean} True si está en horario de trabajo
 */
export const isWorkingHours = (date) => {
  const ecuadorDate = toEcuadorTime(date);
  const hour = ecuadorDate.getHours();
  return hour >= 8 && hour < 16;
};

/**
 * Formatea una fecha para mostrar en interfaz de usuario
 * @param {Date|string} date - Fecha a formatear
 * @param {object} options - Opciones de formato
 * @returns {string} Fecha formateada
 */
export const formatDisplayDate = (date, options = {}) => {
  if (!date) return '';
  
  const ecuadorDate = toEcuadorTime(date);
  
  const defaultOptions = {
    timeZone: ECUADOR_TIMEZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false
  };
  
  return ecuadorDate.toLocaleString('es-EC', { ...defaultOptions, ...options });
};