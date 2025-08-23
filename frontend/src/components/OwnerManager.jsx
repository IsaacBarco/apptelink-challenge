import { useState, useEffect } from 'react'
import './OwnerManager.css'

const OwnerManager = () => {
  const [owners, setOwners] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    fetchOwners()
  }, [])

  const fetchOwners = async () => {
    try {
      const token = localStorage.getItem('access_token')
      const response = await fetch('http://localhost:8000/api/owners/', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      })

      if (response.ok) {
        const data = await response.json()
        console.log('Datos recibidos:', data)
        setOwners(data.results || data)
      } else {
        setError('Error al cargar dueños')
      }
    } catch (err) {
      console.error('Error:', err)
      setError('Error de conexión')
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return <div className="loading">Cargando dueños...</div>
  }

  if (error) {
    return <div className="error">Error: {error}</div>
  }

  return (
    <div className="owner-manager">
      <h2>Gestión de Dueños</h2>
      <p>Total de dueños: {owners.length}</p>
      
      {owners.length === 0 ? (
        <p>No hay dueños registrados</p>
      ) : (
        <div className="owners-list">
          {owners.map(owner => (
            <div key={owner.id} className="owner-card">
              <h3>{owner.full_name}</h3>
              <p>ID: {owner.identification_number}</p>
              <p>Teléfono: {owner.phone}</p>
              {owner.email && <p>Email: {owner.email}</p>}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export default OwnerManager