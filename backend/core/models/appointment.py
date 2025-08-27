from django.db import models
from django.core.exceptions import ValidationError
from django.utils import timezone
from datetime import timedelta
from .base import TimeStampedModel
from .pet import Pet
from .service import Service
from .professional import Professional


class Appointment(TimeStampedModel):
    """Modelo para gestión de citas veterinarias"""
    pet = models.ForeignKey(
        Pet, 
        on_delete=models.CASCADE, 
        related_name='appointments',
        verbose_name="Mascota"
    )
    
    service = models.ForeignKey(
        Service, 
        on_delete=models.CASCADE, 
        verbose_name="Servicio"
    )
    
    assigned_professional = models.ForeignKey(
        Professional, 
        on_delete=models.SET_NULL, 
        null=True, 
        blank=True,
        verbose_name="Profesional asignado"
    )
    
    appointment_date = models.DateTimeField(verbose_name="Fecha y hora")
    
    # Motivo de la consulta
    reason = models.TextField(
        blank=True,
        verbose_name="Motivo de la cita"
    )
    
    # Estados disponibles para las citas
    STATUS_CHOICES = [
        ('pendiente', 'Pendiente'),
        ('confirmada', 'Confirmada'),
        ('realizada', 'Realizada'),
        ('cancelada', 'Cancelada'),
    ]
    status = models.CharField(
        max_length=15, 
        choices=STATUS_CHOICES, 
        default='pendiente',
        verbose_name="Estado"
    )
    
    # Campos para servicios que requieren medicación
    medication_type = models.CharField(
        max_length=200, 
        blank=True,
        verbose_name="Tipo de medicamento",
        help_text="Para baños medicados y desparasitación"
    )
    
    medication_dosage = models.CharField(
        max_length=100,
        blank=True,
        verbose_name="Dosis del medicamento"
    )
    
    instructions = models.TextField(
        blank=True,
        verbose_name="Indicaciones específicas",
        help_text="Indicaciones del servicio"
    )
    
    observations = models.TextField(
        blank=True,
        verbose_name="Observaciones",
        help_text="Observaciones durante o después del servicio"
    )
    
    # Tiempos reales de la cita
    actual_start_time = models.DateTimeField(null=True, blank=True)
    actual_end_time = models.DateTimeField(null=True, blank=True)
    
    # Usuario que creó la cita
    created_by = models.ForeignKey(
        'authentication.CustomUser',
        on_delete=models.SET_NULL,
        null=True,
        related_name='created_appointments'
    )

    class Meta:
        ordering = ['-appointment_date']
        verbose_name = "Cita"
        verbose_name_plural = "Citas"

    def clean(self):
        """Validar horarios de trabajo"""
        if self.appointment_date:
            # Evitar citas muy antiguas
            if self.appointment_date < timezone.now() - timedelta(days=1):
                raise ValidationError({
                    'appointment_date': 'No se pueden crear citas con más de 1 día de antigüedad'
                })
            
            # Verificar horarios de atención
            hour = self.appointment_date.hour
            if hour < 8 or hour >= 16:
                raise ValidationError({
                    'appointment_date': 'Las citas deben ser entre 8:00 AM y 4:00 PM'
                })

    def save(self, *args, **kwargs):
        self.full_clean()
        super().save(*args, **kwargs)

    @property
    def duracion_mostrar(self):
        """Formato legible de duración"""
        minutos = self.service.duration_minutes
        if minutos < 60:
            return f"{minutos} min"
        horas = minutos // 60
        minutos_restantes = minutos % 60
        if minutos_restantes == 0:
            return f"{horas}h"
        return f"{horas}h {minutos_restantes}min"

    @property
    def duration_display(self):
        """Alias para compatibilidad"""
        return self.duracion_mostrar

    def __str__(self):
        return f"{self.pet.name} - {self.service.name} ({self.appointment_date.strftime('%d/%m/%Y %H:%M')})"