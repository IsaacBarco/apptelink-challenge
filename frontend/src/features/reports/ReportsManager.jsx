import { useState, useEffect } from 'react'
import './ReportsManager.css'

const ReportsManager = () => {
  const [dashboardMetrics, setDashboardMetrics] = useState(null)
  const [appointmentsReport, setAppointmentsReport] = useState(null)
  const [servicesReport, setServicesReport] = useState(null)
  const [clientsReport, setClientsReport] = useState(null)
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('dashboard')
  const [dateFilters, setDateFilters] = useState({
    start_date: '',
    end_date: ''
  })

  const API_BASE = 'http://localhost:8000/api'
  
  const getAuthHeaders = () => ({
    'Authorization': `Bearer ${localStorage.getItem('access_token')}`,
    'Content-Type': 'application/json'
  })

  useEffect(() => {
    fetchDashboardMetrics()
  }, [])

  const fetchDashboardMetrics = async () => {
    try {
      const response = await fetch(`${API_BASE}/reports/dashboard_metrics/`, {
        headers: getAuthHeaders()
      })
      if (response.ok) {
        const data = await response.json()
        setDashboardMetrics(data)
      }
    } catch (error) {
      console.error('Error fetching dashboard metrics:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchAppointmentsReport = async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams(dateFilters)
      const response = await fetch(`${API_BASE}/reports/appointments_summary/?${params}`, {
        headers: getAuthHeaders()
      })
      if (response.ok) {
        const data = await response.json()
        setAppointmentsReport(data)
      }
    } catch (error) {
      console.error('Error fetching appointments report:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchServicesReport = async () => {
    try {
      setLoading(true)
      const response = await fetch(`${API_BASE}/reports/services_report/`, {
        headers: getAuthHeaders()
      })
      if (response.ok) {
        const data = await response.json()
        setServicesReport(data)
      }
    } catch (error) {
      console.error('Error fetching services report:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchClientsReport = async () => {
    try {
      setLoading(true)
      const response = await fetch(`${API_BASE}/reports/clients_report/`, {
        headers: getAuthHeaders()
      })
      if (response.ok) {
        const data = await response.json()
        setClientsReport(data)
      }
    } catch (error) {
      console.error('Error fetching clients report:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleTabChange = (tab) => {
    setActiveTab(tab)
    
    switch(tab) {
      case 'appointments':
        if (!appointmentsReport) fetchAppointmentsReport()
        break
      case 'services':
        if (!servicesReport) fetchServicesReport()
        break
      case 'clients':
        if (!clientsReport) fetchClientsReport()
        break
    }
  }


  const renderDashboard = () => {
    if (!dashboardMetrics) return <div className="loading">Cargando métricas...</div>

    return (
      <div className="dashboard-metrics">
        <div className="metrics-grid">
          <div className="metric-card">
            <h3>Hoy</h3>
            <div className="metric-value">{dashboardMetrics.today.total_appointments}</div>
            <div className="metric-label">Citas totales</div>
            <div className="metric-breakdown">
              <span>Pendientes: {dashboardMetrics.today.pending}</span>
              <span>Confirmadas: {dashboardMetrics.today.confirmed}</span>
              <span>Realizadas: {dashboardMetrics.today.completed}</span>
            </div>
          </div>

          <div className="metric-card">
            <h3>Este mes</h3>
            <div className="metric-value">{dashboardMetrics.month.total_appointments}</div>
            <div className="metric-label">Citas totales</div>
            <div className="metric-breakdown">
              <span>Ingresos: ${dashboardMetrics.month.revenue.toFixed(2)}</span>
              <span>Promedio/día: {dashboardMetrics.month.avg_per_day.toFixed(1)}</span>
            </div>
          </div>

          <div className="metric-card">
            <h3>Registros</h3>
            <div className="metric-breakdown">
              <div>Dueños: <strong>{dashboardMetrics.totals.owners}</strong></div>
              <div>Mascotas: <strong>{dashboardMetrics.totals.pets}</strong></div>
              <div>Servicios: <strong>{dashboardMetrics.totals.services}</strong></div>
            </div>
          </div>
        </div>

        <div className="upcoming-appointments">
          <h3>Próximas Citas</h3>
          {dashboardMetrics.upcoming_appointments.length > 0 ? (
            <div className="appointments-list">
              {dashboardMetrics.upcoming_appointments.map(apt => (
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
    if (!appointmentsReport) return <div className="loading">Cargando reporte...</div>

    return (
      <div className="appointments-report">
        <div className="report-filters">
          <input
            type="date"
            value={dateFilters.start_date}
            onChange={(e) => setDateFilters({...dateFilters, start_date: e.target.value})}
            placeholder="Fecha inicio"
          />
          <input
            type="date"
            value={dateFilters.end_date}
            onChange={(e) => setDateFilters({...dateFilters, end_date: e.target.value})}
            placeholder="Fecha fin"
          />
          <button onClick={fetchAppointmentsReport} className="btn btn-primary">
            Filtrar
          </button>
        </div>

        <div className="report-summary">
          <h3>Total de Citas: {appointmentsReport.total_appointments}</h3>
        </div>

        <div className="report-sections">
          <div className="report-section">
            <h4>Por Estado</h4>
            <div className="stats-list">
              {appointmentsReport.by_status.map(stat => (
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
              {appointmentsReport.by_service.slice(0, 5).map(stat => (
                <div key={stat.service__name} className="stat-item">
                  <span className="stat-label">{stat.service__name}</span>
                  <span className="stat-value">{stat.count} citas</span>
                  <span className="stat-revenue">${stat.total_revenue || 0}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="report-section">
            <h4>Últimas 30 citas</h4>
            <div className="appointments-timeline">
              {appointmentsReport.last_30_days.slice(-10).map((day, index) => (
                <div key={day.date} className="timeline-item">
                  <span className="timeline-date">{new Date(day.date).toLocaleDateString()}</span>
                  <span className="timeline-count">{day.count} citas</span>
                  <div className="timeline-bar" style={{width: `${(day.count / Math.max(...appointmentsReport.last_30_days.map(d => d.count))) * 100}%`}}></div>
                </div>
              ))}
            </div>
          </div>

        </div>
      </div>
    )
  }

  const renderServicesReport = () => {
    if (!servicesReport) return <div className="loading">Cargando reporte...</div>

    return (
      <div className="services-report">
        <div className="report-summary">
          <h3>Servicios Activos: {servicesReport.total_services}</h3>
        </div>

        <div className="report-sections">
          <div className="report-section">
            <h4>Por Tipo de Servicio</h4>
            <div className="stats-list">
              {servicesReport.by_type.map(stat => (
                <div key={stat.service_type} className="stat-item">
                  <span className="stat-label">{stat.service_type}</span>
                  <span className="stat-value">{stat.count} citas</span>
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
    if (!clientsReport) return <div className="loading">Cargando reporte...</div>

    return (
      <div className="clients-report">
        <div className="report-summary">
          <div className="summary-grid">
            <div>Dueños: <strong>{clientsReport.total_owners}</strong></div>
            <div>Mascotas: <strong>{clientsReport.total_pets}</strong></div>
            <div>Nuevos dueños (mes): <strong>{clientsReport.new_owners_last_month}</strong></div>
            <div>Nuevas mascotas (mes): <strong>{clientsReport.new_pets_last_month}</strong></div>
          </div>
        </div>

        <div className="report-sections">
          <div className="report-section">
            <h4>Clientes Más Activos</h4>
            <div className="stats-list">
              {clientsReport.top_clients.slice(0, 10).map(client => (
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
              {clientsReport.breed_distribution.map(breed => (
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

  if (loading && activeTab === 'dashboard') {
    return <div className="loading">Cargando reportes...</div>
  }

  return (
    <div className="reports-manager">
      <div className="reports-header">
        <h2>Informes del Sistema</h2>
      </div>

      <div className="reports-tabs">
        <button 
          className={`tab-btn ${activeTab === 'dashboard' ? 'active' : ''}`}
          onClick={() => handleTabChange('dashboard')}
        >
          Dashboard
        </button>
        <button 
          className={`tab-btn ${activeTab === 'appointments' ? 'active' : ''}`}
          onClick={() => handleTabChange('appointments')}
        >
          Citas
        </button>
        <button 
          className={`tab-btn ${activeTab === 'services' ? 'active' : ''}`}
          onClick={() => handleTabChange('services')}
        >
          Servicios
        </button>
        <button 
          className={`tab-btn ${activeTab === 'clients' ? 'active' : ''}`}
          onClick={() => handleTabChange('clients')}
        >
          Clientes
        </button>
      </div>

      <div className="reports-content">
        {activeTab === 'dashboard' && renderDashboard()}
        {activeTab === 'appointments' && renderAppointmentsReport()}
        {activeTab === 'services' && renderServicesReport()}
        {activeTab === 'clients' && renderClientsReport()}
      </div>
    </div>
  )
}

export default ReportsManager