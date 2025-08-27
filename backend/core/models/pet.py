from django.db import models
from django.core.validators import MinValueValidator
from django.core.exceptions import ValidationError
from datetime import date
from .base import BaseModel
from .owner import Owner


class Pet(BaseModel):
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

    class Meta:
        ordering = ['name']
        verbose_name = "Mascota"
        verbose_name_plural = "Mascotas"

    def clean(self):
        """Validaciones personalizadas antes de guardar"""
        if self.birth_date and self.birth_date > date.today():
            raise ValidationError({
                'birth_date': 'La fecha de nacimiento no puede ser futura'
            })
        
    def save(self, *args, **kwargs):
        self.full_clean()
        super().save(*args, **kwargs)

    @property
    def edad_en_meses(self):
        """Calcular edad en meses"""
        hoy = date.today()
        diferencia_edad = hoy - self.birth_date
        return int(diferencia_edad.days / 30.44)

    @property
    def age_in_months(self):
        """Alias para compatibilidad con código existente"""
        return self.edad_en_meses
    
    def __str__(self):
        return f"{self.name} ({self.breed}) - {self.owner.full_name}"