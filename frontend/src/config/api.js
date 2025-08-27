/**
 * Configuración de API
 */
export const API_BASE = 'http://localhost:8000/api';

/**
 * Headers de autenticación para API
 * @returns {object} Headers con token de autorización
 */
export const getAuthHeaders = () => ({
    'Authorization': `Bearer ${localStorage.getItem('access_token')}`,
    'Content-Type': 'application/json'
});