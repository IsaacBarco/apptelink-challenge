import { useState, useEffect } from 'react'
import AppointmentModal from './AppointmentModal'
import './CalendarManager.css'

const CalendarManager = () => {
    const [appointments, setAppointments] = useState([])
    const [currentWeek, setCurrentWeek] = useState(new Date())
    const [loading, setLoading] = useState(true)
    const [showModal, setShowModal] = useState(false)
    const [selectedSlot, setSelectedSlot] = useState(null)
    const [selectedAppointment, setSelectedAppointment] = useState(null)

    const API_BASE = 'http://localhost:8000/api'

    const getAuthHeaders = () => ({
        'Authorization': `Bearer ${localStorage.getItem('access_token')}`,
        'Content-Type': 'application/json'
    })

    // Generar horarios de 8:00 a 18:00 cada 15 minutos
    const generateTimeSlots = () => {
        const slots = []
        for (let hour = 8; hour <= 17; hour++) { // Cambiar < 18 por <= 17
            for (let minute = 0; minute < 60; minute += 30) {
                const time = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`
                slots.push(time)
            }
        }
        // Agregar exactamente las 18:00
        slots.push('18:00')
        return slots
    }

    const timeSlots = generateTimeSlots()

    // Generar días de la semana actual
    const getWeekDays = (date) => {
        const week = []
        const startOfWeek = new Date(date)
        const day = startOfWeek.getDay()
        const diff = startOfWeek.getDate() - day + (day === 0 ? -6 : 1) // Lunes como primer día
        startOfWeek.setDate(diff)

        for (let i = 0; i < 6; i++) { // Lunes a Sábado
            const day = new Date(startOfWeek)
            day.setDate(startOfWeek.getDate() + i)
            week.push(day)
        }
        return week
    }

    const weekDays = getWeekDays(currentWeek)

    useEffect(() => {
        fetchWeekAppointments()
    }, [currentWeek])

    const fetchWeekAppointments = async () => {
        try {
            setLoading(true)
            const dateStr = currentWeek.toISOString().split('T')[0]
            const response = await fetch(`${API_BASE}/appointments/calendar_week/?date=${dateStr}`, {
                headers: getAuthHeaders()
            })

            if (response.ok) {
                const data = await response.json()
                setAppointments(data.appointments || [])
            }
        } catch (error) {
            console.error('Error fetching appointments:', error)
        } finally {
            setLoading(false)
        }
    }

    const navigateWeek = (direction) => {
        const newWeek = new Date(currentWeek)
        newWeek.setDate(newWeek.getDate() + (direction * 7))
        setCurrentWeek(newWeek)
    }

    const formatDateHeader = (date) => {
        const days = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb']
        const dayName = days[date.getDay() - 1] || 'Sáb'
        const dayNumber = date.getDate()
        return `${dayName} ${dayNumber}`
    }

    const handleSlotClick = (time, date) => {
        const datetime = new Date(date)
        const [hours, minutes] = time.split(':')
        datetime.setHours(parseInt(hours), parseInt(minutes))

        setSelectedSlot({
            time,
            date: datetime,
            formatted: datetime.toISOString().slice(0, 16)
        })
        setSelectedAppointment(null)
        setShowModal(true)
    }

    const handleAppointmentClick = (appointment) => {
        setSelectedAppointment(appointment)
        setSelectedSlot(null)
        setShowModal(true)
    }

    const getAppointmentsForSlot = (time, date) => {
        const slotDateTime = new Date(date)
        const [hours, minutes] = time.split(':')
        slotDateTime.setHours(parseInt(hours), parseInt(minutes))

        return appointments.filter(apt => {
            const aptDate = new Date(apt.appointment_date)
            return aptDate.getTime() === slotDateTime.getTime()
        })
    }

    const closeModal = () => {
        setShowModal(false)
        setSelectedSlot(null)
        setSelectedAppointment(null)
    }

    const handleAppointmentSaved = () => {
        fetchWeekAppointments()
        closeModal()
    }

    const getWeekRange = () => {
        const start = weekDays[0]
        const end = weekDays[weekDays.length - 1]
        const monthNames = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun',
            'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic']

        if (start.getMonth() === end.getMonth()) {
            return `${start.getDate()} - ${end.getDate()} ${monthNames[start.getMonth()]} ${start.getFullYear()}`
        } else {
            return `${start.getDate()} ${monthNames[start.getMonth()]} - ${end.getDate()} ${monthNames[end.getMonth()]} ${start.getFullYear()}`
        }
    }

    if (loading) {
        return <div className="loading">Cargando calendario...</div>
    }

    return (
        <div className="calendar-manager">
            <div className="calendar-header">
                <div className="week-navigation">
                    <button
                        className="nav-btn"
                        onClick={() => navigateWeek(-1)}
                    >
                        ← Anterior
                    </button>
                    <h2 className="week-title">{getWeekRange()}</h2>
                    <button
                        className="nav-btn"
                        onClick={() => navigateWeek(1)}
                    >
                        Siguiente →
                    </button>
                </div>
            </div>

            <div className="calendar-grid">
                <div className="time-column">
                    <div className="time-header">Hora</div>
                    {timeSlots.map(time => (
                        <div key={time} className="time-slot-label">
                            {time}
                        </div>
                    ))}
                </div>

                {weekDays.map((day, dayIndex) => (
                    <div key={dayIndex} className="day-column">
                        <div className="day-header">
                            {formatDateHeader(day)}
                        </div>

                        {timeSlots.map((time, timeIndex) => {
                            const slotAppointments = getAppointmentsForSlot(time, day)

                            return (
                                <div
                                    key={`${dayIndex}-${timeIndex}`}
                                    className="appointment-slot"
                                    onClick={() => slotAppointments.length === 0 && handleSlotClick(time, day)}
                                >
                                    {slotAppointments.map(appointment => (
                                        <div
                                            key={appointment.id}
                                            className={`appointment appointment-${appointment.status}`}
                                            onClick={(e) => {
                                                e.stopPropagation()
                                                handleAppointmentClick(appointment)
                                            }}
                                        >
                                            <div className="appointment-pet">{appointment.pet_name}</div>
                                            <div className="appointment-service">{appointment.service_name}</div>
                                            {appointment.professional_name && (
                                                <div className="appointment-professional">
                                                    {appointment.professional_name}
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            )
                        })}
                    </div>
                ))}
            </div>

            {showModal && (
                <AppointmentModal
                    slot={selectedSlot}
                    appointment={selectedAppointment}
                    onClose={closeModal}
                    onSave={handleAppointmentSaved}
                />
            )}
        </div>
    )
}

export default CalendarManager