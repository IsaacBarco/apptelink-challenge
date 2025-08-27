import { useState, useEffect } from 'react'
import { API_BASE, getAuthHeaders } from '../../config/api'
import './PetManager.css'

const PetManager = () => {
  const [pets, setPets] = useState([])
  const [owners, setOwners] = useState([])
  const [cargando, setCargando] = useState(true)
  const [mostrarFormulario, setMostrarFormulario] = useState(false)
  const [showOwnerModal, setShowOwnerModal] = useState(false)
  const [mascotaEditando, setMascotaEditando] = useState(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedOwner, setSelectedOwner] = useState('')
  const [ownerFormData, setOwnerFormData] = useState({
    first_names: '',
    last_names: '',
    identification_type: 'cedula',
    identification_number: '',
    address: '',
    phone: '',
    email: ''
  })
  const [formData, setFormData] = useState({
    name: '',
    breed: '',
    birth_date: '',
    gender: 'M',
    color: '',
    weight: '',
    allergies: '',
    medical_conditions: '',
    additional_notes: '',
    owner: ''
  })


  useEffect(() => {
    fetchPets()
    fetchOwners()
  }, [])

  const fetchPets = async () => {
    try {
      const response = await fetch(`${API_BASE}/pets/`, {
        headers: getAuthHeaders()
      })
      if (response.ok) {
        const data = await response.json()
        setPets(data.results || data)
      }
    } catch (error) {
      console.error('Error fetching pets:', error)
    } finally {
      setCargando(false)
    }
  }

  const fetchOwners = async () => {
    try {
      const response = await fetch(`${API_BASE}/owners/`, {
        headers: getAuthHeaders()
      })
      if (response.ok) {
        const data = await response.json()
        setOwners(data.results || data)
      }
    } catch (error) {
      console.error('Error fetching owners:', error)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setCargando(true)

    try {
      const url = mascotaEditando 
        ? `${API_BASE}/pets/${mascotaEditando.id}/`
        : `${API_BASE}/pets/`
      
      const method = mascotaEditando ? 'PUT' : 'POST'
      
      const response = await fetch(url, {
        method,
        headers: getAuthHeaders(),
        body: JSON.stringify({
          ...formData,
          weight: parseFloat(formData.weight),
          owner: parseInt(formData.owner)
        })
      })

      if (response.ok) {
        await fetchPets()
        resetForm()
      } else {
        const errorData = await response.json()
        console.error('Error saving pet:', errorData)
        alert('Error al guardar: ' + (errorData.detail || 'Error inesperado'))
      }
    } catch (error) {
      console.error('Error saving pet:', error)
      alert('Error de conexión con el servidor')
    } finally {
      setCargando(false)
    }
  }

  const resetForm = () => {
    setFormData({
      name: '', breed: '', birth_date: '', gender: 'M',
      color: '', weight: '', allergies: '', medical_conditions: '',
      additional_notes: '', owner: ''
    })
    setMascotaEditando(null)
    setMostrarFormulario(false)
  }

  const resetOwnerForm = () => {
    setOwnerFormData({
      first_names: '',
      last_names: '',
      identification_type: 'cedula',
      identification_number: '',
      address: '',
      phone: '',
      email: ''
    })
  }

  const handleNewOwner = () => {
    setShowOwnerModal(true)
    resetOwnerForm()
  }

  const handleOwnerSubmit = async (e) => {
    e.preventDefault()
    setCargando(true)

    try {
      // Combinar nombres y apellidos para el backend
      const dataToSend = {
        ...ownerFormData,
        full_name: `${ownerFormData.first_names} ${ownerFormData.last_names}`.trim()
      }
      delete dataToSend.first_names
      delete dataToSend.last_names

      const response = await fetch(`${API_BASE}/owners/`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(dataToSend)
      })

      if (response.ok) {
        const newOwner = await response.json()
        // Actualizar lista de dueños
        await fetchOwners()
        // Seleccionar el nuevo dueño automáticamente
        setFormData({...formData, owner: newOwner.id.toString()})
        // Cerrar modal
        setShowOwnerModal(false)
        resetOwnerForm()
      } else {
        const errorData = await response.json()
        console.error('Error saving owner:', errorData)
        alert('Error al guardar dueño: ' + (errorData.detail || 'Error inesperado'))
      }
    } catch (error) {
      console.error('Error saving owner:', error)
      alert('Error de conexión con el servidor')
    } finally {
      setCargando(false)
    }
  }

  const handleEdit = (pet) => {
    setFormData({
      name: pet.name,
      breed: pet.breed,
      birth_date: pet.birth_date,
      gender: pet.gender,
      color: pet.color,
      weight: pet.weight.toString(),
      allergies: pet.allergies || '',
      medical_conditions: pet.medical_conditions || '',
      additional_notes: pet.additional_notes || '',
      owner: pet.owner.toString()
    })
    setMascotaEditando(pet)
    setMostrarFormulario(true)
  }

  const handleDelete = async (pet) => {
    if (confirm(`¿Estás seguro de que quieres eliminar a ${pet.name}? Esta acción no se puede deshacer.`)) {
      try {
        setCargando(true)
        const response = await fetch(`${API_BASE}/pets/${pet.id}/`, {
          method: 'DELETE',
          headers: getAuthHeaders()
        })

        if (response.ok) {
          await fetchPets()
        } else {
          const errorData = await response.json()
          console.error('Error deleting pet:', errorData)
          alert('Error al eliminar: ' + (errorData.detail || 'Error inesperado'))
        }
      } catch (error) {
        console.error('Error deleting pet:', error)
        alert('Error de conexión con el servidor')
      } finally {
        setCargando(false)
      }
    }
  }

  const filteredPets = pets.filter(pet => {
    const matchesSearch = pet.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         pet.breed.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         pet.owner_name.toLowerCase().includes(searchTerm.toLowerCase())
    
    const matchesOwner = !selectedOwner || pet.owner.toString() === selectedOwner
    
    return matchesSearch && matchesOwner
  })


  if (cargando && pets.length === 0) {
    return <div className="cargando">Cargando mascotas...</div>
  }

  return (
    <div className="pet-manager">
      <div className="manager-header">
        <h2>Gestión de Mascotas</h2>
        <button 
          className="btn btn-primary"
          onClick={() => setMostrarFormulario(true)}
        >
          Nueva Mascota
        </button>
      </div>

      <div className="filters-bar">
        <div className="search-group">
          <input
            type="text"
            placeholder="Buscar por nombre, raza o dueño..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="search-input"
          />
        </div>
        
        <div className="filter-group">
          <select
            value={selectedOwner}
            onChange={(e) => setSelectedOwner(e.target.value)}
            className="filter-select"
          >
            <option value="">Todos los dueños</option>
            {owners.map(owner => (
              <option key={owner.id} value={owner.id}>
                {owner.full_name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {mostrarFormulario && (
        <div className="modal-overlay">
          <div className="modal">
            <div className="modal-header">
              <h3>{mascotaEditando ? 'Editar Mascota' : 'Nueva Mascota'}</h3>
              <button className="close-btn" onClick={resetForm}>×</button>
            </div>
            
            <form onSubmit={handleSubmit} className="pet-form">
              <div className="form-row">
                <div className="form-group">
                  <label>Nombre de la mascota *</label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Dueño *</label>
                  <div className="owner-selection">
                    <select
                      value={formData.owner}
                      onChange={(e) => setFormData({...formData, owner: e.target.value})}
                      required
                    >
                      <option value="">Seleccionar dueño</option>
                      {owners.map(owner => (
                        <option key={owner.id} value={owner.id}>
                          {owner.nombre_corto}
                        </option>
                      ))}
                    </select>
                    <button 
                      type="button" 
                      className="btn btn-secondary btn-sm"
                      onClick={handleNewOwner}
                    >
                      + Nuevo Dueño
                    </button>
                  </div>
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Raza *</label>
                  <input
                    type="text"
                    value={formData.breed}
                    onChange={(e) => setFormData({...formData, breed: e.target.value})}
                    placeholder="Ingrese la raza de la mascota"
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Fecha de nacimiento *</label>
                  <input
                    type="date"
                    value={formData.birth_date}
                    onChange={(e) => setFormData({...formData, birth_date: e.target.value})}
                    required
                    max={new Date().toISOString().split('T')[0]}
                  />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Sexo</label>
                  <select
                    value={formData.gender}
                    onChange={(e) => setFormData({...formData, gender: e.target.value})}
                  >
                    <option value="M">Macho</option>
                    <option value="F">Hembra</option>
                  </select>
                </div>
                <div className="form-group">
                  <label>Color *</label>
                  <input
                    type="text"
                    value={formData.color}
                    onChange={(e) => setFormData({...formData, color: e.target.value})}
                    required
                    placeholder="Ej: Dorado, Café, Negro"
                  />
                </div>
              </div>

              <div className="form-group">
                <label>Peso (kg) *</label>
                <input
                  type="number"
                  step="0.1"
                  min="0.1"
                  max="100"
                  value={formData.weight}
                  onChange={(e) => setFormData({...formData, weight: e.target.value})}
                  required
                  placeholder="Ej: 15.5"
                />
              </div>

              <div className="form-group">
                <label>Alergias</label>
                <textarea
                  value={formData.allergies}
                  onChange={(e) => setFormData({...formData, allergies: e.target.value})}
                  rows="2"
                  placeholder="Alergias conocidas (opcional)"
                />
              </div>

              <div className="form-group">
                <label>Condiciones médicas preexistentes</label>
                <textarea
                  value={formData.medical_conditions}
                  onChange={(e) => setFormData({...formData, medical_conditions: e.target.value})}
                  rows="2"
                  placeholder="Condiciones médicas (opcional)"
                />
              </div>

              <div className="form-group">
                <label>Notas adicionales</label>
                <textarea
                  value={formData.additional_notes}
                  onChange={(e) => setFormData({...formData, additional_notes: e.target.value})}
                  rows="2"
                  placeholder="Información adicional (opcional)"
                />
              </div>

              <div className="form-actions">
                <button type="button" onClick={resetForm} className="btn btn-secondary">
                  Cancelar
                </button>
                <button type="submit" className="btn btn-primary" disabled={cargando}>
                  {cargando ? 'Guardando...' : 'Guardar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <div className="pets-grid">
        {filteredPets.map(pet => (
          <div key={pet.id} className="pet-card">
            <div className="pet-header">
              <h3>{pet.name}</h3>
              <span className="pet-gender">{pet.gender === 'M' ? '♂' : '♀'}</span>
            </div>
            <div className="pet-info">
              <p><strong>Raza:</strong> {pet.breed}</p>
              <p><strong>Color:</strong> {pet.color}</p>
              <p><strong>Edad:</strong> {pet.edad_mostrar}</p>
              <p><strong>Peso:</strong> {pet.weight} kg</p>
              <p><strong>Dueño:</strong> {pet.owner_name}</p>
              {pet.allergies && <p><strong>Alergias:</strong> {pet.allergies}</p>}
            </div>
            <div className="pet-actions">
              <button 
                className="btn btn-secondary btn-sm"
                onClick={() => handleEdit(pet)}
              >
                Editar
              </button>
              <button 
                className="btn btn-danger btn-sm"
                onClick={() => handleDelete(pet)}
                disabled={cargando}
              >
                Eliminar
              </button>
            </div>
          </div>
        ))}
      </div>

      {filteredPets.length === 0 && !cargando && (
        <div className="empty-state">
          <p>No se encontraron mascotas</p>
        </div>
      )}

      {showOwnerModal && (
        <div className="modal-overlay">
          <div className="modal">
            <div className="modal-header">
              <h3>Nuevo Dueño</h3>
              <button 
                className="close-btn"
                onClick={() => setShowOwnerModal(false)}
              >
                ×
              </button>
            </div>
            
            <form onSubmit={handleOwnerSubmit} className="modal-form">
              <div className="form-row">
                <div className="form-group">
                  <label>Nombres *</label>
                  <input
                    type="text"
                    value={ownerFormData.first_names}
                    onChange={(e) => setOwnerFormData({...ownerFormData, first_names: e.target.value})}
                    required
                    placeholder="Ej: Carlos Eduardo"
                  />
                </div>
                <div className="form-group">
                  <label>Apellidos *</label>
                  <input
                    type="text"
                    value={ownerFormData.last_names}
                    onChange={(e) => setOwnerFormData({...ownerFormData, last_names: e.target.value})}
                    required
                    placeholder="Ej: Mendoza Ruiz"
                  />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Tipo de identificación</label>
                  <select
                    value={ownerFormData.identification_type}
                    onChange={(e) => setOwnerFormData({...ownerFormData, identification_type: e.target.value})}
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
                    value={ownerFormData.identification_number}
                    onChange={(e) => setOwnerFormData({...ownerFormData, identification_number: e.target.value})}
                    required
                  />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Teléfono *</label>
                  <input
                    type="tel"
                    value={ownerFormData.phone}
                    onChange={(e) => setOwnerFormData({...ownerFormData, phone: e.target.value})}
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Email</label>
                  <input
                    type="email"
                    value={ownerFormData.email}
                    onChange={(e) => setOwnerFormData({...ownerFormData, email: e.target.value})}
                  />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Dirección *</label>
                  <input
                    type="text"
                    value={ownerFormData.address}
                    onChange={(e) => setOwnerFormData({...ownerFormData, address: e.target.value})}
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Email</label>
                  <input
                    type="email"
                    value={ownerFormData.email}
                    onChange={(e) => setOwnerFormData({...ownerFormData, email: e.target.value})}
                  />
                </div>
              </div>

              <div className="form-actions">
                <button 
                  type="button" 
                  onClick={() => setShowOwnerModal(false)}
                  className="btn btn-secondary"
                >
                  Cancelar
                </button>
                <button 
                  type="submit" 
                  className="btn btn-primary"
                  disabled={cargando}
                >
                  {cargando ? 'Guardando...' : 'Guardar Dueño'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

export default PetManager