import { useState } from "react";
import OwnerManager from "../owners/OwnerManager";
import PetManager from "../pets/PetManager";
import CalendarManager from '../calendar/CalendarManager'
import ReportsManager from '../reports/ReportsManager'
import ServicesManager from '../services/ServicesManager'
import "./Dashboard.css";

const Dashboard = ({ setIsAuthenticated }) => {
  const user = JSON.parse(localStorage.getItem("user") || "{}");
  const [seccionActiva, setSeccionActiva] = useState("citas");

  const manejarCierreSesion = () => {
    localStorage.removeItem("access_token");
    localStorage.removeItem("refresh_token");
    localStorage.removeItem("user");
    setIsAuthenticated(false);
  };

  const menuItems = [
    { id: "dueños", label: "Dueños", icon: "👥" },
    { id: "mascotas", label: "Mascotas", icon: "🐕" },
    { id: "citas", label: "Citas", icon: "📅" },
    { id: "servicios", label: "Servicios", icon: "🔧" },
    { id: "reportes", label: "Reportes", icon: "📊" },
  ];

  // Días completos
  const weekDays = [
    "Lunes",
    "Martes",
    "Miércoles",
    "Jueves",
    "Viernes",
    "Sábado",
  ];
  const timeSlots = ["8:15", "8:30", "8:45", "9:00"];

  const appointments = {
    "8:15-0": { pet: "Rocky", service: "Baño medicado" },
    "8:30-0": { pet: "Juanpi", service: "Desparasitación" },
    "8:30-2": { pet: "Cody", service: "Desparasitación" },
  };

  const renderizarCalendario = () => (
    <div className="calendar-container">
      <h2 className="calendar-title">Calendario semanal</h2>

      <div className="calendar-grid">
        <div className="time-column">
          <div className="time-header"></div>
          {timeSlots.map((time) => (
            <div key={time} className="time-slot">
              {time}
            </div>
          ))}
        </div>

        {weekDays.map((day, dayIndex) => (
          <div key={dayIndex} className="day-column">
            <div className="day-header">{day}</div>
            {timeSlots.map((time, timeIndex) => {
              const appointmentKey = `${time}-${dayIndex}`;
              const appointment = appointments[appointmentKey];

              return (
                <div key={timeIndex} className="appointment-slot">
                  {appointment && (
                    <div className="appointment">
                      <div className="appointment-pet">{appointment.pet}</div>
                      <div className="appointment-service">
                        {appointment.service}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );

  const renderizarContenido = () => {
    switch (seccionActiva) {
      case "dueños":
        return <OwnerManager />;
      case "mascotas":
        return <PetManager />;
      case 'citas':
        return <CalendarManager />;
      case 'servicios':
        return <ServicesManager />;
      case 'reportes':
        return <ReportsManager />;
      default:
        return (
          <div className="content-placeholder">
            <h2>
              {menuItems.find((item) => item.id === seccionActiva)?.label}
            </h2>
            <p>Funcionalidad en desarrollo...</p>
          </div>
        );
    }
  };

  return (
    <div className="dashboard">
      <div className="sidebar">
        <div className="sidebar-header">
          <div className="logo">
            <span className="logo-icon">🏥</span>
          </div>
        </div>

        <nav className="sidebar-nav">
          {menuItems.map((item) => (
            <button
              key={item.id}
              className={`nav-item ${
                seccionActiva === item.id ? "active" : ""
              }`}
              onClick={() => setSeccionActiva(item.id)}
            >
              <span className="nav-icon">{item.icon}</span>
              <span className="nav-label">{item.label}</span>
            </button>
          ))}
        </nav>

        <div className="sidebar-footer">
          <div className="user-info">
            <span className="user-name">
              {user.first_name || user.username}
            </span>
          </div>
          <button onClick={manejarCierreSesion} className="logout-btn">
            Cerrar Sesión
          </button>
        </div>
      </div>

      <main className="main-content">{renderizarContenido()}</main>
    </div>
  );
};

export default Dashboard;