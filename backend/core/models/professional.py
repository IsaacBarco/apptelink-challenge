from django.db import models
from .base import BaseModel


class Professional(models.Model):
    """Modelo para profesionales de la veterinaria"""
    full_name = models.CharField(max_length=200, verbose_name="Nombre completo")
    specialty = models.CharField(max_length=100, verbose_name="Especialidad")
    phone = models.CharField(max_length=15, blank=True, verbose_name="Teléfono")
    email = models.EmailField(blank=True, verbose_name="Email")
    is_active = models.BooleanField(default=True, verbose_name="Activo")
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'core_professional'
        ordering = ['full_name']
        verbose_name = "Profesional"
        verbose_name_plural = "Profesionales"

    def __str__(self):
        return self.full_name