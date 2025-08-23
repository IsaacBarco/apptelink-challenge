import { useState, useEffect } from 'react'
import './PetManager.css'

const PetManager = () => {
  const [pets, setPets] = useState([])
  const [owners, setOwners] = useState([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editingPet, setEditingPet] = useState(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedOwner, setSelectedOwner] = useState('')
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

  const API_BASE = 'http://localhost:8000/api'

  const getAuthHeaders = () => ({
    'Authorization': `Bearer ${localStorage.getItem('access_token')}`,
    'Content-Type': 'application/json'
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
      setLoading(false)
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
    setLoading(true)

    try {
      const url = editingPet 
        ? `${API_BASE}/pets/${editingPet.id}/`
        : `${API_BASE}/pets/`
      
      const method = editingPet ? 'PUT' : 'POST'
      
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
        alert('Error al guardar: ' + (errorData.detail || 'Error desconocido'))
      }
    } catch (error) {
      console.error('Error saving pet:', error)
      alert('Error de conexión')
    } finally {
      setLoading(false)
    }
  }

  const resetForm = () => {
    setFormData({
      name: '', breed: '', birth_date: '', gender: 'M',
      color: '', weight: '', allergies: '', medical_conditions: '',
      additional_notes: '', owner: ''
    })
    setEditingPet(null)
    setShowForm(false)
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
    setEditingPet(pet)
    setShowForm(true)
  }

  const filteredPets = pets.filter(pet => {
    const matchesSearch = pet.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         pet.breed.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         pet.owner_name.toLowerCase().includes(searchTerm.toLowerCase())
    
    const matchesOwner = !selectedOwner || pet.owner.toString() === selectedOwner
    
    return matchesSearch && matchesOwner
  })

  const breeds = ['Labrador', 'Golden Retriever', 'Pastor Alemán', 'Bulldog', 'Poodle', 
                 'Chihuahua', 'Beagle', 'Rottweiler', 'Yorkshire', 'Mestizo', 'Otro']

  if (loading && pets.length === 0) {
    return <div className="loading">Cargando mascotas...</div>
  }

  return (
    <div className="pet-manager">
      <div className="manager-header">
        <h2>Gestión de Mascotas</h2>
        <button 
          className="btn btn-primary"
          onClick={() => setShowForm(true)}
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

      {showForm && (
        <div className="modal-overlay">
          <div className="modal">
            <div className="modal-header">
              <h3>{editingPet ? 'Editar Mascota' : 'Nueva Mascota'}</h3>
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
                  <select
                    value={formData.owner}
                    onChange={(e) => setFormData({...formData, owner: e.target.value})}
                    required
                  >
                    <option value="">Seleccionar dueño</option>
                    {owners.map(owner => (
                      <option key={owner.id} value={owner.id}>
                        {owner.full_name} - {owner.identification_number}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Raza *</label>
                  <select
                    value={formData.breed}
                    onChange={(e) => setFormData({...formData, breed: e.target.value})}
                    required
                  >
                    <option value="">Seleccionar raza</option>
                    {breeds.map(breed => (
                      <option key={breed} value={breed}>{breed}</option>
                    ))}
                  </select>
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
                <button type="submit" className="btn btn-primary" disabled={loading}>
                  {loading ? 'Guardando...' : 'Guardar'}
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
              <p><strong>Edad:</strong> {pet.age_display}</p>
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
            </div>
          </div>
        ))}
      </div>

      {filteredPets.length === 0 && !loading && (
        <div className="empty-state">
          <p>No se encontraron mascotas</p>
        </div>
      )}
    </div>
  )
}

export default PetManager