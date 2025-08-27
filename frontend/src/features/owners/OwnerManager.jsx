import { useState, useEffect } from 'react'
import { API_BASE, getAuthHeaders } from '../../config/api'
import './OwnerManager.css'

const OwnerManager = () => {
  const [duenos, setDuenos] = useState([])
  const [cargando, setCargando] = useState(true)
  const [error, setError] = useState('')
  const [mostrarModal, setMostrarModal] = useState(false)
  const [propietarioEditando, setPropietarioEditando] = useState(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [formData, setFormData] = useState({
    first_names: '',
    last_names: '',
    identification_type: 'cedula',
    identification_number: '',
    address: '',
    phone: '',
    email: ''
  })

  useEffect(() => {
    obtenerDuenos()
  }, [])


  const obtenerDuenos = async () => {
    try {
      const response = await fetch(`${API_BASE}/owners/`, {
        headers: getAuthHeaders()
      })

      if (response.ok) {
        const datos = await response.json()
        setDuenos(datos.results || datos)
      } else {
        setError('Error al cargar dueños')
      }
    } catch (err) {
      console.error('Error al cargar dueños:', err)
      setError('Error de conexión')
    } finally {
      setCargando(false)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setCargando(true)

    try {
      const url = propietarioEditando 
        ? `${API_BASE}/owners/${propietarioEditando.id}/`
        : `${API_BASE}/owners/`
      
      const method = propietarioEditando ? 'PUT' : 'POST'

      // Combinar nombres y apellidos para el backend
      const dataToSend = {
        ...formData,
        full_name: `${formData.first_names} ${formData.last_names}`.trim()
      }
      delete dataToSend.first_names
      delete dataToSend.last_names

      const response = await fetch(url, {
        method,
        headers: getAuthHeaders(),
        body: JSON.stringify(dataToSend)
      })

      if (response.ok) {
        await obtenerDuenos()
        resetForm()
      } else {
        const errorData = await response.json()
        console.error('Error saving owner:', errorData)
        alert('Error al guardar: ' + (errorData.detail || 'Error inesperado'))
      }
    } catch (error) {
      console.error('Error saving owner:', error)
      alert('Error de conexión con el servidor')
    } finally {
      setCargando(false)
    }
  }

  const resetForm = () => {
    setFormData({
      first_names: '',
      last_names: '',
      identification_type: 'cedula',
      identification_number: '',
      address: '',
      phone: '',
      email: ''
    })
    setPropietarioEditando(null)
    setMostrarModal(false)
  }

  const handleEdit = (owner) => {
    // Dividir nombre completo
    const nameParts = owner.full_name.split(' ')
    let first_names = ''
    let last_names = ''
    
    if (nameParts.length === 1) {
      first_names = nameParts[0]
      last_names = ''
    } else if (nameParts.length === 2) {
      first_names = nameParts[0]
      last_names = nameParts[1]
    } else if (nameParts.length === 3) {
      first_names = nameParts.slice(0, 2).join(' ')  // Primeros 2 como nombres
      last_names = nameParts[2]  // Último como apellido
    } else if (nameParts.length >= 4) {
      first_names = nameParts.slice(0, 2).join(' ')  // Primeros 2 como nombres
      last_names = nameParts.slice(2).join(' ')  // El resto como apellidos
    }

    setFormData({
      first_names,
      last_names,
      identification_type: owner.identification_type,
      identification_number: owner.identification_number,
      address: owner.address,
      phone: owner.phone,
      email: owner.email || ''
    })
    setPropietarioEditando(owner)
    setMostrarModal(true)
  }

  const handleNew = () => {
    resetForm()
    setMostrarModal(true)
  }

  const handleDelete = async (owner) => {
    if (confirm(`¿Estás seguro de que quieres eliminar a ${owner.full_name}? Esta acción eliminará también todas sus mascotas y citas. No se puede deshacer.`)) {
      try {
        setCargando(true)
        const response = await fetch(`${API_BASE}/owners/${owner.id}/`, {
          method: 'DELETE',
          headers: getAuthHeaders()
        })

        if (response.ok) {
          await obtenerDuenos()
        } else {
          const errorData = await response.json()
          console.error('Error deleting owner:', errorData)
          alert('Error al eliminar: ' + (errorData.detail || 'Error inesperado'))
        }
      } catch (error) {
        console.error('Error deleting owner:', error)
        alert('Error de conexión con el servidor')
      } finally {
        setCargando(false)
      }
    }
  }

  if (cargando) {
    return <div className="loading">Cargando dueños...</div>
  }

  if (error) {
    return <div className="error">Error: {error}</div>
  }

  // Filtrar dueños por búsqueda
  const filteredOwners = duenos.filter(owner => 
    owner.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    owner.identification_number.includes(searchTerm) ||
    (owner.phone && owner.phone.includes(searchTerm)) ||
    (owner.email && owner.email.toLowerCase().includes(searchTerm.toLowerCase()))
  )

  return (
    <div className="owner-manager">
      <div className="manager-header">
        <h2>Gestión de Dueños</h2>
        <button className="btn btn-primary" onClick={handleNew}>
          + Nuevo Dueño
        </button>
      </div>

      <div className="filters-bar">
        <div className="search-group">
          <input
            type="text"
            placeholder="Buscar por nombre, ID, teléfono o email..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="search-input"
          />
        </div>
      </div>
      
      <p>Total de dueños: {filteredOwners.length}</p>
      
      {filteredOwners.length === 0 && !cargando ? (
        <div className="empty-state">
          <p>No se encontraron dueños</p>
        </div>
      ) : (
        <div className="owners-grid">
          {filteredOwners.map(dueno => (
            <div key={dueno.id} className="owner-card">
              <div className="owner-header">
                <h3>{dueno.full_name}</h3>
              </div>
              <div className="owner-info">
                <p><strong>ID:</strong> {dueno.identification_number}</p>
                <p><strong>Teléfono:</strong> {dueno.phone}</p>
                {dueno.email && <p><strong>Email:</strong> {dueno.email}</p>}
                {dueno.address && <p><strong>Dirección:</strong> {dueno.address}</p>}
                <p><strong>Mascotas:</strong> {dueno.pets_count || 0}</p>
              </div>
              <div className="owner-actions">
                <button 
                  className="btn btn-secondary btn-sm"
                  onClick={() => handleEdit(dueno)}
                >
                  Editar
                </button>
                <button 
                  className="btn btn-danger btn-sm"
                  onClick={() => handleDelete(dueno)}
                  disabled={cargando}
                >
                  Eliminar
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {mostrarModal && (
        <div className="modal-overlay">
          <div className="modal">
            <div className="modal-header">
              <h3>{propietarioEditando ? 'Editar Dueño' : 'Nuevo Dueño'}</h3>
              <button className="close-btn" onClick={resetForm}>×</button>
            </div>
            
            <form onSubmit={handleSubmit} className="modal-form">
              <div className="form-row">
                <div className="form-group">
                  <label>Nombres *</label>
                  <input
                    type="text"
                    value={formData.first_names}
                    onChange={(e) => setFormData({...formData, first_names: e.target.value})}
                    required
                    placeholder="Ej: Carlos Eduardo"
                  />
                </div>
                <div className="form-group">
                  <label>Apellidos *</label>
                  <input
                    type="text"
                    value={formData.last_names}
                    onChange={(e) => setFormData({...formData, last_names: e.target.value})}
                    required
                    placeholder="Ej: Mendoza Ruiz"
                  />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Tipo de identificación</label>
                  <select
                    value={formData.identification_type}
                    onChange={(e) => setFormData({...formData, identification_type: e.target.value})}
                  >
                    <option value="cedula">Cédula</option>
                    <option value="pasaporte">Pasaporte</option>
                    <option value="ruc">RUC</option>
                  </select>
                </div>
                <div className="form-group">
                  <label>Número de identificación *</label>
                  <input
                    type="text"
                    value={formData.identification_number}
                    onChange={(e) => setFormData({...formData, identification_number: e.target.value})}
                    required
                  />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Teléfono *</label>
                  <input
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => setFormData({...formData, phone: e.target.value})}
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Email</label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({...formData, email: e.target.value})}
                  />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Dirección *</label>
                  <input
                    type="text"
                    value={formData.address}
                    onChange={(e) => setFormData({...formData, address: e.target.value})}
                    required
                  />
                </div>
              </div>

              <div className="form-actions">
                <button 
                  type="button" 
                  onClick={resetForm}
                  className="btn btn-secondary"
                >
                  Cancelar
                </button>
                <button 
                  type="submit" 
                  className="btn btn-primary"
                  disabled={cargando}
                >
                  {cargando ? 'Guardando...' : (propietarioEditando ? 'Actualizar' : 'Crear')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

export default OwnerManager