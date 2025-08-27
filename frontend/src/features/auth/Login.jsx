import { useState } from 'react'
import './Login.css'

const Login = ({ setIsAuthenticated }) => {
  const [datosFormulario, setDatosFormulario] = useState({
    username: '',
    password: ''
  })
  const [error, setError] = useState('')
  const [cargando, setCargando] = useState(false)

  const manejarEnvio = async (e) => {
    e.preventDefault()
    setCargando(true)
    setError('')

    try {
      const response = await fetch('http://localhost:8000/api/auth/login/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(datosFormulario)
      })

      const datos = await response.json()

      if (response.ok) {
        localStorage.setItem('access_token', datos.access)
        localStorage.setItem('refresh_token', datos.refresh)
        localStorage.setItem('user', JSON.stringify(datos.user))

        setIsAuthenticated(true)
      } else {
        setError(datos.error || 'Error al iniciar sesión')
      }
    } catch (err) {
      setError('Error de conexión con el servidor')
    } finally {
      setCargando(false)
    }
  }

  const manejarCambio = (e) => {
    setDatosFormulario({
      ...datosFormulario,
      [e.target.name]: e.target.value
    })
  }

  return (
    <div className="login-container">
      <div className="login-form-container">
        <h1 className="login-title">Iniciar sesión</h1>

        <form onSubmit={manejarEnvio} className="login-form">
          <div className="form-group">
            <label htmlFor="username">Nombre de usuario</label>
            <div className="input-wrapper">
              <input
                type="text"
                id="username"
                name="username"
                value={datosFormulario.username}
                onChange={manejarCambio}
                required
                disabled={cargando}
              />
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="password">Contraseña</label>
            <div className="input-wrapper">
              <input
                type="password"
                id="password"
                name="password"
                value={datosFormulario.password}
                onChange={manejarCambio}
                required
                disabled={cargando}
              />
            </div>
          </div>

          {error && <div className="error-message">{error}</div>}

          <button type="submit" disabled={cargando} className="login-btn">
            {cargando ? 'Ingresando...' : 'Ingresar'}
          </button>
        </form>
      </div>
    </div>
  )
}

export default Login