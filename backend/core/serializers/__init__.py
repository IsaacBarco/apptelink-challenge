# Importar todos los serializers para mantener compatibilidad con el código existente
from .professional import SerializadorProfesional
from .owner import SerializadorPropietario
from .pet import SerializadorMascota
from .service import SerializadorServicio
from .appointment import SerializadorCita, SerializadorCitaCalendario
from .mixins import MixinNombreCorto, MixinValidacion

# Aliases para compatibilidad con código existente
ProfessionalSerializer = SerializadorProfesional
OwnerSerializer = SerializadorPropietario
PetSerializer = SerializadorMascota
ServiceSerializer = SerializadorServicio
AppointmentSerializer = SerializadorCita
AppointmentCalendarSerializer = SerializadorCitaCalendario
ShortNameMixin = MixinNombreCorto
ValidationMixin = MixinValidacion

__all__ = [
    # Nuevos nombres en español
    'SerializadorProfesional',
    'SerializadorPropietario',
    'SerializadorMascota', 
    'SerializadorServicio',
    'SerializadorCita',
    'SerializadorCitaCalendario',
    'MixinNombreCorto',
    'MixinValidacion',
    # Aliases para compatibilidad
    'ProfessionalSerializer',
    'OwnerSerializer',
    'PetSerializer', 
    'ServiceSerializer',
    'AppointmentSerializer',
    'AppointmentCalendarSerializer',
    'ShortNameMixin',
    'ValidationMixin'
]