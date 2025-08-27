import { useState, useEffect } from "react";
import { API_BASE, getAuthHeaders } from '../../config/api'
import "./ServicesManager.css";

const ServicesManager = () => {
  const [services, setServices] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState(null);

  // Mapeo de tipos de servicio para mostrar nombres más amigables
  const serviceTypeLabels = {
    'baño_normal': 'Baño Normal',
    'baño_medicado': 'Baño Medicado',
    'peluqueria': 'Peluquería Canina',
    'desparasitacion': 'Desparasitación',
    'atencion_general': 'Atención General'
  };

  // Cargar servicios desde el backend
  const fetchServices = async () => {
    try {
      setCargando(true);
      const response = await fetch(`${API_BASE}/services/`, {
        headers: getAuthHeaders(),
      });
      
      if (!response.ok) {
        throw new Error('Error al cargar servicios');
      }
      
      const data = await response.json();
      setServices(data);
      setError(null);
    } catch (error) {
      console.error('Error fetching services:', error);
      setError('Error al cargar los servicios');
    } finally {
      setCargando(false);
    }
  };

  // Cargar servicios al montar el componente
  useEffect(() => {
    fetchServices();
  }, []);




  return (
    <div className="services-manager">
      <div className="services-header">
        <h2>Gestión de Servicios</h2>
      </div>

      {cargando && <div className="cargando">Cargando servicios...</div>}
      {error && <div className="error">{error}</div>}
      
      <div className="services-grid">
        {services.map((service) => (
          <div key={service.id} className="service-card">
            <div className="service-info">
              <div className="service-header">
                <h3>{service.name}</h3>
                <span className="service-type-badge">
                  {service.service_type_display || serviceTypeLabels[service.service_type] || service.service_type}
                </span>
              </div>
              <p className="service-description">{service.description}</p>
              <div className="service-details">
                <span className="service-price">${service.price}</span>
                <span className="service-duration">{service.duration_minutes} min</span>
                {service.requires_medication && (
                  <span className="medication-badge">💊 Requiere medicamentos</span>
                )}
              </div>
              {service.default_instructions && (
                <div className="service-instructions">
                  <strong>Instrucciones:</strong> {service.default_instructions}
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ServicesManager;