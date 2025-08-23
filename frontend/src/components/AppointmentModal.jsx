import { useState, useEffect } from 'react'
import './AppointmentModal.css'

const AppointmentModal = ({ slot, appointment, onClose, onSave }) => {
  const [formData, setFormData] = useState({
    pet: '',
    service: '',
    appointment_date: '',
    assigned_professional: '',
    reason: '',
    status: 'pendiente',
    medication_type: '',
    medication_dosage: '',
    instructions: '',
    observations: ''
  })

  const [pets, setPets] = useState([])
  const [services, setServices] = useState([])
  const [professionals, setProfessionals] = useState([])
  const [loading, setLoading] = useState(false)
  const [errors, setErrors] = useState({})

  const API_BASE = 'http://localhost:8000/api'
  
  const getAuthHeaders = () => ({
    'Authorization': `Bearer ${localStorage.getItem('access_token')}`,
    'Content-Type': 'application/json'
  })

  useEffect(() => {
    fetchData()
    
    if (appointment) {
      // Editando cita existente
      setFormData({
        pet: appointment.pet,
        service: appointment.service,
        appointment_date: new Date(appointment.appointment_date).toISOString().slice(0, 16),
        assigned_professional: appointment.assigned_professional || '',
        reason: appointment.reason || '',
        status: appointment.status,
        medication_type: appointment.medication_type || '',
        medication_dosage: appointment.medication_dosage || '',
        instructions: appointment.instructions || '',
        observations: appointment.observations || ''
      })
    } else if (slot) {
      // Nueva cita en slot específico
      setFormData(prev => ({
        ...prev,
        appointment_date: slot.formatted
      }))
    }
  }, [appointment, slot])

  const fetchData = async () => {
    try {
      const [petsRes, servicesRes, professionalsRes] = await Promise.all([
        fetch(`${API_BASE}/pets/`, { headers: getAuthHeaders() }),
        fetch(`${API_BASE}/services/`, { headers: getAuthHeaders() }),
        fetch(`${API_BASE}/professionals/`, { headers: getAuthHeaders() })
      ])

      if (petsRes.ok) {
        const petsData = await petsRes.json()
        setPets(petsData.results || petsData)
      }

      if (servicesRes.ok) {
        const servicesData = await servicesRes.json()
        setServices(servicesData.results || servicesData)
      }

      if (professionalsRes.ok) {
        const professionalsData = await professionalsRes.json()
        setProfessionals(professionalsData.results || professionalsData)
      }
    } catch (error) {
      console.error('Error fetching data:', error)
    }
  }

  const selectedService = services.find(s => s.id === parseInt(formData.service))

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setErrors({})

    try {
      const url = appointment 
        ? `${API_BASE}/appointments/${appointment.id}/`
        : `${API_BASE}/appointments/`
      
      const method = appointment ? 'PUT' : 'POST'

      const submitData = {
        ...formData,
        pet: parseInt(formData.pet),
        service: parseInt(formData.service),
        assigned_professional: formData.assigned_professional ? parseInt(formData.assigned_professional) : null
      }

      const response = await fetch(url, {
        method,
        headers: getAuthHeaders(),
        body: JSON.stringify(submitData)
      })

      if (response.ok) {
        onSave()
      } else {
        const errorData = await response.json()
        setErrors(errorData)
        console.error('Error saving appointment:', errorData)
      }
    } catch (error) {
      console.error('Error saving appointment:', error)
      setErrors({ general: 'Error de conexión' })
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async () => {
    if (!appointment) return
    
    if (confirm('¿Estás seguro de que quieres cancelar esta cita?')) {
      try {
        setLoading(true)
        const response = await fetch(`${API_BASE}/appointments/${appointment.id}/update_status/`, {
          method: 'PATCH',
          headers: getAuthHeaders(),
          body: JSON.stringify({ status: 'cancelada' })
        })

        if (response.ok) {
          onSave()
        }
      } catch (error) {
        console.error('Error canceling appointment:', error)
      } finally {
        setLoading(false)
      }
    }
  }

  const getFieldError = (field) => {
    return errors[field] ? errors[field][0] || errors[field] : null
  }

  return (
    <div className="modal-overlay">
      <div className="modal appointment-modal">
        <div className="modal-header">
          <h3>
            {appointment ? 'Editar Cita' : 'Nueva Cita'}
            {slot && ` - ${slot.time}`}
          </h3>
          <button className="close-btn" onClick={onClose}>×</button>
        </div>

        <form onSubmit={handleSubmit} className="appointment-form">
          {errors.general && (
            <div className="error-message">{errors.general}</div>
          )}

          <div className="form-row">
            <div className="form-group">
              <label>Mascota *</label>
              <select
                value={formData.pet}
                onChange={(e) => setFormData({...formData, pet: e.target.value})}
                required
                disabled={loading}
              >
                <option value="">Seleccionar mascota</option>
                {pets.map(pet => (
                  <option key={pet.id} value={pet.id}>
                    {pet.name} - {pet.owner_name}
                  </option>
                ))}
              </select>
              {getFieldError('pet') && (
                <span className="field-error">{getFieldError('pet')}</span>
              )}
            </div>

            <div className="form-group">
              <label>Servicio *</label>
              <select
                value={formData.service}
                onChange={(e) => setFormData({...formData, service: e.target.value})}
                required
                disabled={loading}
              >
                <option value="">Seleccionar servicio</option>
                {services.map(service => (
                  <option key={service.id} value={service.id}>
                    {service.name} - ${service.price} ({service.duration_minutes}min)
                  </option>
                ))}
              </select>
              {getFieldError('service') && (
                <span className="field-error">{getFieldError('service')}</span>
              )}
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>Fecha y hora *</label>
              <input
                type="datetime-local"
                value={formData.appointment_date}
                onChange={(e) => setFormData({...formData, appointment_date: e.target.value})}
                required
                disabled={loading}
                min={new Date().toISOString().slice(0, 16)}
              />
              {getFieldError('appointment_date') && (
                <span className="field-error">{getFieldError('appointment_date')}</span>
              )}
            </div>

            <div className="form-group">
              <label>Profesional</label>
              <select
                value={formData.assigned_professional}
                onChange={(e) => setFormData({...formData, assigned_professional: e.target.value})}
                disabled={loading}
              >
                <option value="">Sin asignar</option>
                {professionals.map(prof => (
                  <option key={prof.id} value={prof.id}>
                    {prof.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {appointment && (
            <div className="form-group">
              <label>Estado</label>
              <select
                value={formData.status}
                onChange={(e) => setFormData({...formData, status: e.target.value})}
                disabled={loading}
              >
                <option value="pendiente">Pendiente</option>
                <option value="confirmada">Confirmada</option>
                <option value="realizada">Realizada</option>
                <option value="cancelada">Cancelada</option>
              </select>
            </div>
          )}

          <div className="form-group">
            <label>Motivo de la cita</label>
            <textarea
              value={formData.reason}
              onChange={(e) => setFormData({...formData, reason: e.target.value})}
              rows="2"
              placeholder="Descripción del motivo de la consulta"
              disabled={loading}
            />
          </div>

          {selectedService?.requires_medication && (
            <>
              <div className="form-row">
                <div className="form-group">
                  <label>Tipo de medicamento *</label>
                  <input
                    type="text"
                    value={formData.medication_type}
                    onChange={(e) => setFormData({...formData, medication_type: e.target.value})}
                    placeholder="Ej: Champú ketoconazol"
                    required
                    disabled={loading}
                  />
                  {getFieldError('medication_type') && (
                    <span className="field-error">{getFieldError('medication_type')}</span>
                  )}
                </div>

                <div className="form-group">
                  <label>Dosis</label>
                  <input
                    type="text"
                    value={formData.medication_dosage}
                    onChange={(e) => setFormData({...formData, medication_dosage: e.target.value})}
                    placeholder="Ej: 15ml"
                    disabled={loading}
                  />
                </div>
              </div>
            </>
          )}

          <div className="form-group">
            <label>Instrucciones específicas</label>
            <textarea
              value={formData.instructions}
              onChange={(e) => setFormData({...formData, instructions: e.target.value})}
              rows="2"
              placeholder="Instrucciones para el servicio"
              disabled={loading}
            />
          </div>

          <div className="form-group">
            <label>Observaciones</label>
            <textarea
              value={formData.observations}
              onChange={(e) => setFormData({...formData, observations: e.target.value})}
              rows="2"
              placeholder="Observaciones durante o después del servicio"
              disabled={loading}
            />
          </div>

          <div className="form-actions">
            <div className="left-actions">
              {appointment && (
                <button 
                  type="button" 
                  onClick={handleDelete}
                  className="btn btn-danger"
                  disabled={loading}
                >
                  Cancelar Cita
                </button>
              )}
            </div>
            
            <div className="right-actions">
              <button type="button" onClick={onClose} className="btn btn-secondary">
                Cerrar
              </button>
              <button type="submit" className="btn btn-primary" disabled={loading}>
                {loading ? 'Guardando...' : 'Guardar'}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  )
}

export default AppointmentModal