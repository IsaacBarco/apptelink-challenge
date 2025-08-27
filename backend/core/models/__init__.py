# Importar todos los modelos para mantener compatibilidad con el código existente
from .professional import Professional
from .owner import Owner
from .pet import Pet
from .service import Service
from .appointment import Appointment
from .base import BaseModel, TimeStampedModel, ActiveModel

__all__ = [
    'Professional',
    'Owner', 
    'Pet',
    'Service',
    'Appointment',
    'BaseModel',
    'TimeStampedModel',
    'ActiveModel'
]