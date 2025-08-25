// Componente principal del calendario - vista semanal de citas
import { useState, useEffect } from 'react'
import AppointmentModal from './components/AppointmentModal'
import { toEcuadorTime, getEcuadorDateString, formatDateFromBackend } from '../../utils/timezone'
import './CalendarManager.css'

const CalendarManager = () => {
    const [appointments, setAppointments] = useState([])
    const [currentWeek, setCurrentWeek] = useState(toEcuadorTime(new Date()))
    const [loading, setLoading] = useState(true)
    const [showModal, setShowModal] = useState(false)
    const [selectedSlot, setSelectedSlot] = useState(null)
    const [selectedAppointment, setSelectedAppointment] = useState(null)

    const API_BASE = 'http://localhost:8000/api'

    const getAuthHeaders = () => ({
        'Authorization': `Bearer ${localStorage.getItem('access_token')}`,
        'Content-Type': 'application/json'
    })

    // Horarios de trabajo: 8:00 AM a 4:00 PM (16:00)
    const generateTimeSlots = () => {
        const slots = []
        for (let hour = 8; hour <= 16; hour++) {
            const time = `${hour.toString().padStart(2, '0')}:00`
            slots.push(time)
        }
        console.log('Generated time slots:', slots)
        return slots
    }

    const timeSlots = generateTimeSlots()

    // Generar días de la semana actual en zona horaria de Ecuador
    const getWeekDays = (date) => {
        const week = []
        const startOfWeek = toEcuadorTime(date)
        const day = startOfWeek.getDay()
        const diff = startOfWeek.getDate() - day + (day === 0 ? -6 : 1) // Lunes como primer día
        startOfWeek.setDate(diff)

        for (let i = 0; i < 6; i++) { // Lunes a Sábado
            const day = toEcuadorTime(startOfWeek)
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
            const dateStr = getEcuadorDateString(currentWeek)
            console.log('Fetching appointments for week (Ecuador time):', dateStr)
            
            const response = await fetch(`${API_BASE}/appointments/calendar_week/?date=${dateStr}`, {
                headers: getAuthHeaders()
            })

            console.log('Response status:', response.status)
            
            if (response.ok) {
                const data = await response.json()
                console.log('API Response:', data)
                console.log('Appointments found:', data.citas || data.appointments || [])
                setAppointments(data.citas || data.appointments || [])
            } else {
                console.error('Response not ok:', await response.text())
            }
        } catch (error) {
            console.error('Error fetching appointments:', error)
        } finally {
            setLoading(false)
        }
    }

    const navigateWeek = (direction) => {
        const newWeek = toEcuadorTime(currentWeek)
        newWeek.setDate(newWeek.getDate() + (direction * 7))
        setCurrentWeek(toEcuadorTime(newWeek))
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
        // Busca las citas que coinciden con un slot específico de tiempo
        const slotDateTime = toEcuadorTime(date)
        const [hours, minutes] = time.split(':')
        slotDateTime.setHours(parseInt(hours), parseInt(minutes), 0, 0)

        // Filtrar citas que coincidan exactamente con este slot
        const matchingAppointments = appointments.filter(apt => {
            const aptDate = formatDateFromBackend(apt.appointment_date)
            const matches = (
                aptDate.getFullYear() === slotDateTime.getFullYear() &&
                aptDate.getMonth() === slotDateTime.getMonth() &&
                aptDate.getDate() === slotDateTime.getDate() &&
                aptDate.getHours() === slotDateTime.getHours() &&
                Math.floor(aptDate.getMinutes() / 60) === Math.floor(slotDateTime.getMinutes() / 60)
            )
            
            // Debug para las primeras citas (remover en producción)
            if (apt.id === 1 || apt.id === 2 || apt.id === 3) {
                console.log(`Checking appointment ${apt.id}:`, {
                    aptDate: aptDate.toISOString(),
                    slotDateTime: slotDateTime.toISOString(),
                    time,
                    date: date.toISOString().split('T')[0],
                    matches,
                    aptHour: aptDate.getHours(),
                    slotHour: slotDateTime.getHours(),
                    aptMinutes: aptDate.getMinutes(),
                    slotMinutes: slotDateTime.getMinutes()
                })
            }
            
            return matches
        })

        return matchingAppointments
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
                                            <div className="appointment-owner">{appointment.owner_name}</div>
                                            <div className="appointment-service">{appointment.service_name}</div>
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