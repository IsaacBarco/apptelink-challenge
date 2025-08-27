import { useState, useEffect } from 'react'
import { API_BASE, getAuthHeaders } from '../../config/api'
import './ReportsManager.css'

const ReportsManager = () => {
  const [metricasPanel, setMetricasPanel] = useState(null)
  const [reporteCitas, setReporteCitas] = useState(null)
  const [reporteServicios, setReporteServicios] = useState(null)
  const [reporteClientes, setReporteClientes] = useState(null)
  const [cargando, setCargando] = useState(true)
  const [pestanaActiva, setPestanaActiva] = useState('dashboard')
  const [filtrosFecha, setFiltrosFecha] = useState({
    start_date: '',
    end_date: ''
  })


  useEffect(() => {
    obtenerMetricasPanel()
  }, [])

  const obtenerMetricasPanel = async () => {
    try {
      const respuesta = await fetch(`${API_BASE}/reports/dashboard_metrics/`, {
        headers: getAuthHeaders()
      })
      if (respuesta.ok) {
        const datos = await respuesta.json()
        setMetricasPanel(datos)
      }
    } catch (error) {
      console.error('Error fetching dashboard metrics:', error)
    } finally {
      setCargando(false)
    }
  }

  const obtenerReporteCitas = async () => {
    try {
      setCargando(true)
      const params = new URLSearchParams(filtrosFecha)
      const respuesta = await fetch(`${API_BASE}/reports/appointments_summary/?${params}`, {
        headers: getAuthHeaders()
      })
      if (respuesta.ok) {
        const datos = await respuesta.json()
        setReporteCitas(datos)
      }
    } catch (error) {
      console.error('Error fetching appointments report:', error)
    } finally {
      setCargando(false)
    }
  }

  const obtenerReporteServicios = async () => {
    try {
      setCargando(true)
      const respuesta = await fetch(`${API_BASE}/reports/services_report/`, {
        headers: getAuthHeaders()
      })
      if (respuesta.ok) {
        const datos = await respuesta.json()
        setReporteServicios(datos)
      }
    } catch (error) {
      console.error('Error fetching services report:', error)
    } finally {
      setCargando(false)
    }
  }

  const obtenerReporteClientes = async () => {
    try {
      setCargando(true)
      const respuesta = await fetch(`${API_BASE}/reports/clients_report/`, {
        headers: getAuthHeaders()
      })
      if (respuesta.ok) {
        const datos = await respuesta.json()
        setReporteClientes(datos)
      }
    } catch (error) {
      console.error('Error fetching clients report:', error)
    } finally {
      setCargando(false)
    }
  }

  const manejarCambioPestana = (tab) => {
    setPestanaActiva(tab)
    
    switch(tab) {
      case 'appointments':
        if (!reporteCitas) obtenerReporteCitas()
        break
      case 'services':
        if (!reporteServicios) obtenerReporteServicios()
        break
      case 'clients':
        if (!reporteClientes) obtenerReporteClientes()
        break
    }
  }


  const renderDashboard = () => {
    if (!metricasPanel) return <div className="cargando">Cargando métricas...</div>

    return (
      <div className="dashboard-metrics">
        <div className="metrics-grid">
          <div className="metric-card">
            <h3>Hoy</h3>
            <div className="metric-value">{metricasPanel.today.total_appointments}</div>
            <div className="metric-label">Citas totales</div>
            <div className="metric-breakdown">
              <span>Pendientes: {metricasPanel.today.pending}</span>
              <span>Confirmadas: {metricasPanel.today.confirmed}</span>
              <span>Realizadas: {metricasPanel.today.completed}</span>
            </div>
          </div>

          <div className="metric-card">
            <h3>Este mes</h3>
            <div className="metric-value">{metricasPanel.month.total_appointments}</div>
            <div className="metric-label">Citas totales</div>
            <div className="metric-breakdown">
              <span>Ingresos: ${metricasPanel.month.revenue.toFixed(2)}</span>
              <span>Promedio/día: {metricasPanel.month.avg_per_day.toFixed(1)}</span>
            </div>
          </div>

          <div className="metric-card">
            <h3>Registros</h3>
            <div className="metric-breakdown">
              <div>Dueños: <strong>{metricasPanel.totals.owners}</strong></div>
              <div>Mascotas: <strong>{metricasPanel.totals.pets}</strong></div>
              <div>Servicios: <strong>{metricasPanel.totals.services}</strong></div>
            </div>
          </div>
        </div>

        <div className="upcoming-appointments">
          <h3>Próximas Citas</h3>
          {metricasPanel.upcoming_appointments.length > 0 ? (
            <div className="appointments-list">
              {metricasPanel.upcoming_appointments.map(apt => (
                <div key={apt.id} className="appointment-item">
                  <div className="appointment-time">
                    {new Date(apt.appointment_date).toLocaleString()}
                  </div>
                  <div className="appointment-details">
                    <strong>{apt.pet_name}</strong> - {apt.service_name}
                    <br />
                    <small>Dueño: {apt.owner_name}</small>
                  </div>
                  <div className={`appointment-status status-${apt.status}`}>
                    {apt.status_display}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p>No hay citas próximas</p>
          )}
        </div>
      </div>
    )
  }

  const renderAppointmentsReport = () => {
    if (!reporteCitas) return <div className="cargando">Cargando reporte...</div>

    return (
      <div className="appointments-report">
        <div className="report-filters">
          <input
            type="date"
            value={filtrosFecha.start_date}
            onChange={(e) => setFiltrosFecha({...filtrosFecha, start_date: e.target.value})}
            placeholder="Fecha inicio"
          />
          <input
            type="date"
            value={filtrosFecha.end_date}
            onChange={(e) => setFiltrosFecha({...filtrosFecha, end_date: e.target.value})}
            placeholder="Fecha fin"
          />
          <button onClick={obtenerReporteCitas} className="btn btn-primary">
            Filtrar
          </button>
        </div>

        <div className="report-summary">
          <h3>Total de Citas: {reporteCitas.total_appointments}</h3>
        </div>

        <div className="report-sections">
          <div className="report-section">
            <h4>Por Estado</h4>
            <div className="stats-list">
              {reporteCitas.by_status.map(stat => (
                <div key={stat.status} className="stat-item">
                  <span className="stat-label">{stat.status}</span>
                  <span className="stat-value">{stat.count}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="report-section">
            <h4>Servicios Más Solicitados</h4>
            <div className="stats-list">
              {reporteCitas.by_service.slice(0, 5).map(stat => (
                <div key={stat.service__name} className="stat-item">
                  <span className="stat-label">{stat.service__name}</span>
                  <span className="stat-value">{stat.count} {stat.count === 1 ? 'cita' : 'citas'}</span>
                  <span className="stat-revenue">${stat.total_revenue || 0}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="report-section">
            <h4>Últimas 5 citas</h4>
            <div className="appointments-timeline">
              {reporteCitas.last_30_days.slice(-5).map((day, index) => (
                <div key={day.date} className="timeline-item">
                  <span className="timeline-date">{new Date(day.date).toLocaleDateString()}</span>
                  <span className="timeline-count">{day.count} {day.count === 1 ? 'cita' : 'citas'}</span>
                  <div className="timeline-bar" style={{width: `${(day.count / Math.max(...reporteCitas.last_30_days.map(d => d.count))) * 100}%`}}></div>
                </div>
              ))}
            </div>
          </div>

        </div>
      </div>
    )
  }

  const renderServicesReport = () => {
    if (!reporteServicios) return <div className="cargando">Cargando reporte...</div>

    return (
      <div className="services-report">
        <div className="report-summary">
          <h3>Servicios Activos: {reporteServicios.total_services}</h3>
        </div>

        <div className="report-sections">
          <div className="report-section">
            <h4>Por Tipo de Servicio</h4>
            <div className="stats-list">
              {reporteServicios.by_type.map(stat => (
                <div key={stat.service_type} className="stat-item">
                  <span className="stat-label">{stat.service_type}</span>
                  <span className="stat-value">{stat.count} {stat.count === 1 ? 'cita' : 'citas'}</span>
                  <span className="stat-revenue">${stat.revenue || 0}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    )
  }

  const renderClientsReport = () => {
    if (!reporteClientes) return <div className="cargando">Cargando reporte...</div>

    return (
      <div className="clients-report">
        <div className="report-summary">
          <div className="summary-grid">
            <div>Dueños: <strong>{reporteClientes.total_owners}</strong></div>
            <div>Mascotas: <strong>{reporteClientes.total_pets}</strong></div>
            <div>Nuevos dueños (mes): <strong>{reporteClientes.new_owners_last_month}</strong></div>
            <div>Nuevas mascotas (mes): <strong>{reporteClientes.new_pets_last_month}</strong></div>
          </div>
        </div>

        <div className="report-sections">
          <div className="report-section">
            <h4>Clientes Más Activos</h4>
            <div className="stats-list">
              {reporteClientes.top_clients.slice(0, 10).map(client => (
                <div key={client.id} className="stat-item">
                  <span className="stat-label">{client.full_name}</span>
                  <span className="stat-value">{client.pets_count} mascotas</span>
                </div>
              ))}
            </div>
          </div>

          <div className="report-section">
            <h4>Razas Más Comunes</h4>
            <div className="stats-list">
              {reporteClientes.breed_distribution.map(breed => (
                <div key={breed.breed} className="stat-item">
                  <span className="stat-label">{breed.breed}</span>
                  <span className="stat-value">{breed.count} mascotas</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (cargando && pestanaActiva === 'dashboard') {
    return <div className="cargando">Cargando reportes...</div>
  }

  return (
    <div className="reports-manager">
      <div className="reports-header">
        <h2>Informes del Sistema</h2>
      </div>

      <div className="reports-tabs">
        <button 
          className={`tab-btn ${pestanaActiva === 'dashboard' ? 'active' : ''}`}
          onClick={() => manejarCambioPestana('dashboard')}
        >
          Dashboard
        </button>
        <button 
          className={`tab-btn ${pestanaActiva === 'appointments' ? 'active' : ''}`}
          onClick={() => manejarCambioPestana('appointments')}
        >
          Citas
        </button>
        <button 
          className={`tab-btn ${pestanaActiva === 'services' ? 'active' : ''}`}
          onClick={() => manejarCambioPestana('services')}
        >
          Servicios
        </button>
        <button 
          className={`tab-btn ${pestanaActiva === 'clients' ? 'active' : ''}`}
          onClick={() => manejarCambioPestana('clients')}
        >
          Clientes
        </button>
      </div>

      <div className="reports-content">
        {pestanaActiva === 'dashboard' && renderDashboard()}
        {pestanaActiva === 'appointments' && renderAppointmentsReport()}
        {pestanaActiva === 'services' && renderServicesReport()}
        {pestanaActiva === 'clients' && renderClientsReport()}
      </div>
    </div>
  )
}

export default ReportsManager