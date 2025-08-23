from django.db import models
from django.core.validators import RegexValidator, MinValueValidator
from django.core.exceptions import ValidationError
from django.utils import timezone
from datetime import date, timedelta

class Owner(models.Model):
    """Modelo para dueños de mascotas con campos completos del PDF"""
    full_name = models.CharField(max_length=200, verbose_name="Nombre completo")
    
    # Número de identificación con validación
    IDENTIFICATION_TYPES = [
        ('cedula', 'Cédula'),
        ('pasaporte', 'Pasaporte'),
    ]
    identification_type = models.CharField(
        max_length=10, 
        choices=IDENTIFICATION_TYPES, 
        default='cedula'
    )
    identification_number = models.CharField(
        max_length=20, 
        unique=True,
        validators=[RegexValidator(
            regex=r'^[0-9A-Z\-]+$',
            message='Solo números, letras mayúsculas y guiones'
        )]
    )
    
    address = models.TextField(verbose_name="Dirección")
    
    # Teléfono con validación básica
    phone = models.CharField(
        max_length=15,
        validators=[RegexValidator(
            regex=r'^\+?[0-9\-\s]+$',
            message='Formato: +593123456789 o 0987654321'
        )]
    )
    
    email = models.EmailField(blank=True, null=True, verbose_name="Correo electrónico")
    
    # Metadatos
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    is_active = models.BooleanField(default=True)

    class Meta:
        ordering = ['full_name']
        verbose_name = "Dueño"
        verbose_name_plural = "Dueños"

    def __str__(self):
        return f"{self.full_name} ({self.identification_number})"

class Pet(models.Model):
    """Modelo para mascotas"""
    name = models.CharField(max_length=100, verbose_name="Nombre de la mascota")
    species = models.CharField(max_length=50, default='Canina', editable=False)
    breed = models.CharField(max_length=100, verbose_name="Raza")
    
    birth_date = models.DateField(
        verbose_name="Fecha de nacimiento",
        help_text="Aproximada si es desconocida"
    )
    
    GENDER_CHOICES = [
        ('M', 'Macho'),
        ('F', 'Hembra'),
    ]
    gender = models.CharField(max_length=1, choices=GENDER_CHOICES, verbose_name="Sexo")
    color = models.CharField(max_length=100, verbose_name="Color")

    weight = models.DecimalField(
        max_digits=5, 
        decimal_places=2, 
        verbose_name="Peso (kg)",
        help_text="Peso aproximado en kilogramos",
        validators=[MinValueValidator(0.1)]
    )
    
    # Información adicional de las mascotas
    allergies = models.TextField(
        blank=True, 
        verbose_name="Alergias",
        help_text="Alergias conocidas"
    )
    medical_conditions = models.TextField(
        blank=True,
        verbose_name="Condiciones preexistentes",
        help_text="Condiciones médicas preexistentes"
    )
    additional_notes = models.TextField(
        blank=True,
        verbose_name="Notas adicionales"
    )
    
    # Asociación con dueño
    owner = models.ForeignKey(
        Owner, 
        on_delete=models.CASCADE, 
        related_name='pets',
        verbose_name="Dueño"
    )
    
    # Metadatos
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    is_active = models.BooleanField(default=True)

    class Meta:
        ordering = ['name']
        verbose_name = "Mascota"
        verbose_name_plural = "Mascotas"

    def clean(self):
        """Validaciones customizadas"""
        if self.birth_date and self.birth_date > date.today():
            raise ValidationError({
                'birth_date': 'La fecha de nacimiento no puede ser futura'
            })
        
    def save(self, *args, **kwargs):
        self.full_clean()
        super().save(*args, **kwargs)

    @property
    def age_in_months(self):
        """Calcular edad en meses"""
        today = date.today()
        age = today - self.birth_date
        return int(age.days / 30.44)
    
    def __str__(self):
        return f"{self.name} ({self.breed}) - {self.owner.full_name}"



class Service(models.Model):
    """Servicios específicos según PDF con detalles por tipo"""
    SERVICE_TYPES = [
        ('baño_normal', 'Baño Normal'),
        ('baño_medicado', 'Baño Medicado'),
        ('peluqueria', 'Peluquería Canina'),
        ('desparasitacion', 'Desparasitación'),
        ('atencion_general', 'Atención Canina General'),
    ]
    
    name = models.CharField(max_length=100, verbose_name="Nombre del servicio")
    service_type = models.CharField(max_length=20, choices=SERVICE_TYPES)
    description = models.TextField(blank=True, verbose_name="Descripción")
    
    duration_minutes = models.PositiveIntegerField(
        default=60,
        verbose_name="Duración en minutos"
    )
    
    price = models.DecimalField(
        max_digits=8, 
        decimal_places=2,
        verbose_name="Precio base"
    )
    
    # Campos específicos para diferentes tipos de servicio
    requires_medication = models.BooleanField(
        default=False,
        help_text="¿Requiere medicamentos? (baños medicados, desparasitación)"
    )
    
    default_instructions = models.TextField(
        blank=True,
        verbose_name="Instrucciones por defecto",
        help_text="Instrucciones estándar para este servicio"
    )
    
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['service_type', 'name']
        verbose_name = "Servicio"
        verbose_name_plural = "Servicios"

    def __str__(self):
        return f"{self.name} (${self.price})"

class Professional(models.Model):
    """Profesionales que pueden atender citas"""
    name = models.CharField(max_length=200, verbose_name="Nombre completo")
    specialties = models.JSONField(
        default=list,
        help_text="Lista de especialidades del profesional"
    )
    phone = models.CharField(max_length=15, blank=True)
    email = models.EmailField(blank=True)
    is_active = models.BooleanField(default=True)
    
    def __str__(self):
        return self.name

class Appointment(models.Model):
    """Citas con campos completos según PDF"""
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
    
    appointment_date = models.DateTimeField(verbose_name="Fecha y hora")
    
    # Profesional asignado (opcional según PDF)
    assigned_professional = models.ForeignKey(
        Professional,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        verbose_name="Profesional asignado"
    )
    
    # Motivo (opcional según PDF)
    reason = models.TextField(
        blank=True,
        verbose_name="Motivo de la cita"
    )
    
    # Estados según PDF - RF_C_006
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
    
    # Campos específicos para servicios detallados según PDF
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
    
    # Campos para seguimiento
    actual_start_time = models.DateTimeField(null=True, blank=True)
    actual_end_time = models.DateTimeField(null=True, blank=True)
    
    # Metadatos
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
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
        """Validaciones de horarios"""
        from django.core.exceptions import ValidationError
        from datetime import datetime, timedelta
        
        if self.appointment_date:
            # No permitir citas muy en el pasado (más de 1 día)
            if self.appointment_date < timezone.now() - timedelta(days=1):
                raise ValidationError({
                    'appointment_date': 'No se pueden crear citas con más de 1 día de antigüedad'
                })
            
            # Validar horario de trabajo (8:00 - 18:00)
            hour = self.appointment_date.hour
            if hour < 8 or hour >= 18:
                raise ValidationError({
                    'appointment_date': 'Las citas deben ser entre 8:00 AM y 6:00 PM'
                })
            
            # Validar solapamientos para el mismo profesional
            if self.assigned_professional:
                duration = timedelta(minutes=self.service.duration_minutes)
                start_time = self.appointment_date
                end_time = start_time + duration
                
                overlapping = Appointment.objects.filter(
                    assigned_professional=self.assigned_professional,
                    appointment_date__lt=end_time,
                    appointment_date__gte=start_time - timedelta(minutes=60),
                    status__in=['pendiente', 'confirmada']
                ).exclude(id=self.id if self.id else None)
                
                if overlapping.exists():
                    raise ValidationError({
                        'appointment_date': f'El profesional {self.assigned_professional.name} ya tiene una cita en ese horario'
                    })

    def save(self, *args, **kwargs):
        self.full_clean()
        super().save(*args, **kwargs)

    @property
    def duration_display(self):
        """Mostrar duración en formato amigable"""
        minutes = self.service.duration_minutes
        if minutes < 60:
            return f"{minutes} min"
        hours = minutes // 60
        remaining_minutes = minutes % 60
        if remaining_minutes == 0:
            return f"{hours}h"
        return f"{hours}h {remaining_minutes}min"

    def __str__(self):
        return f"{self.pet.name} - {self.service.name} ({self.appointment_date.strftime('%d/%m/%Y %H:%M')})"