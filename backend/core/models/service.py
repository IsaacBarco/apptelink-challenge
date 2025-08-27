from django.db import models


class Service(models.Model):
    """Servicios veterinarios disponibles"""
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
    
    # Configuración adicional del servicio
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