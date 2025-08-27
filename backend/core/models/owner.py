from django.db import models
from django.core.validators import RegexValidator
from .base import BaseModel


class Owner(BaseModel):
    """Modelo para propietarios de mascotas"""
    full_name = models.CharField(max_length=200, verbose_name="Nombre completo")
    
    # Documento de identidad
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
    
    # Número de contacto
    phone = models.CharField(
        max_length=15,
        validators=[RegexValidator(
            regex=r'^\+?[0-9\-\s]+$',
            message='Formato: +593123456789 o 0987654321'
        )]
    )
    
    email = models.EmailField(blank=True, null=True, verbose_name="Correo electrónico")

    class Meta:
        ordering = ['full_name']
        verbose_name = "Dueño"
        verbose_name_plural = "Dueños"

    def __str__(self):
        return f"{self.full_name} ({self.identification_number})"