import { useState, useEffect } from "react";
import "./ServicesManager.css";

const ServicesManager = () => {
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingService, setEditingService] = useState(null);
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    price: "",
    duration: "",
  });

  const API_URL = "http://localhost:8000/api";

  useEffect(() => {
    fetchServices();
  }, []);

  const getAuthHeaders = () => {
    const token = localStorage.getItem("access_token");
    return {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    };
  };

  const fetchServices = async () => {
    try {
      const response = await fetch(`${API_URL}/services/`, {
        headers: getAuthHeaders(),
      });
      if (response.ok) {
        const data = await response.json();
        setServices(data);
      }
    } catch (error) {
      console.error("Error al obtener servicios:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      const url = editingService
        ? `${API_URL}/services/${editingService.id}/`
        : `${API_URL}/services/`;
      
      const method = editingService ? "PUT" : "POST";
      
      const response = await fetch(url, {
        method,
        headers: getAuthHeaders(),
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        await fetchServices();
        resetForm();
      } else {
        console.error("Error al guardar servicio");
      }
    } catch (error) {
      console.error("Error:", error);
    }
  };

  const handleEdit = (service) => {
    setEditingService(service);
    setFormData({
      name: service.name,
      description: service.description,
      price: service.price,
      duration: service.duration,
    });
    setShowModal(true);
  };

  const handleDelete = async (id) => {
    if (window.confirm("¿Estás seguro de eliminar este servicio?")) {
      try {
        const response = await fetch(`${API_URL}/services/${id}/`, {
          method: "DELETE",
          headers: getAuthHeaders(),
        });

        if (response.ok) {
          await fetchServices();
        }
      } catch (error) {
        console.error("Error al eliminar servicio:", error);
      }
    }
  };

  const resetForm = () => {
    setFormData({ name: "", description: "", price: "", duration: "" });
    setEditingService(null);
    setShowModal(false);
  };

  const handleInputChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  if (loading) {
    return <div className="loading">Cargando servicios...</div>;
  }

  return (
    <div className="services-manager">
      <div className="services-header">
        <h2>Gestión de Servicios</h2>
        <button
          className="btn btn-primary"
          onClick={() => setShowModal(true)}
        >
          Agregar Servicio
        </button>
      </div>

      <div className="services-grid">
        {services.map((service) => (
          <div key={service.id} className="service-card">
            <div className="service-info">
              <h3>{service.name}</h3>
              <p className="service-description">{service.description}</p>
              <div className="service-details">
                <span className="service-price">${service.price}</span>
                <span className="service-duration">{service.duration} min</span>
              </div>
            </div>
            <div className="service-actions">
              <button
                className="btn btn-secondary"
                onClick={() => handleEdit(service)}
              >
                Editar
              </button>
              <button
                className="btn btn-danger"
                onClick={() => handleDelete(service.id)}
              >
                Eliminar
              </button>
            </div>
          </div>
        ))}
      </div>

      {showModal && (
        <div className="modal-overlay">
          <div className="modal">
            <div className="modal-header">
              <h3>{editingService ? "Editar Servicio" : "Agregar Servicio"}</h3>
              <button className="close-btn" onClick={resetForm}>
                ×
              </button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label>Nombre:</label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  required
                />
              </div>
              <div className="form-group">
                <label>Descripción:</label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  rows="3"
                />
              </div>
              <div className="form-group">
                <label>Precio:</label>
                <input
                  type="number"
                  name="price"
                  value={formData.price}
                  onChange={handleInputChange}
                  step="0.01"
                  required
                />
              </div>
              <div className="form-group">
                <label>Duración (minutos):</label>
                <input
                  type="number"
                  name="duration"
                  value={formData.duration}
                  onChange={handleInputChange}
                  required
                />
              </div>
              <div className="modal-actions">
                <button type="button" onClick={resetForm}>
                  Cancelar
                </button>
                <button type="submit" className="btn btn-primary">
                  {editingService ? "Actualizar" : "Crear"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ServicesManager;