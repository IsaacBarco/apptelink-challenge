from rest_framework import serializers
from datetime import timedelta
from django.utils import timezone
from ..models import Appointment
from .mixins import MixinNombreCorto


class SerializadorCita(MixinNombreCorto, serializers.ModelSerializer):
    nombre_mascota = serializers.CharField(source='pet.name', read_only=True)
    raza_mascota = serializers.CharField(source='pet.breed', read_only=True)
    nombre_propietario = serializers.CharField(source='pet.owner.full_name', read_only=True)
    telefono_propietario = serializers.CharField(source='pet.owner.phone', read_only=True)
    nombre_servicio = serializers.CharField(source='service.name', read_only=True)
    duracion_servicio = serializers.IntegerField(source='service.duration_minutes', read_only=True)
    nombre_profesional = serializers.CharField(source='assigned_professional.full_name', read_only=True)
    estado_mostrar = serializers.CharField(source='get_status_display', read_only=True)
    duracion_mostrar = serializers.CharField(read_only=True)
    
    # Alias para compatibilidad con frontend
    pet_name = serializers.CharField(source='pet.name', read_only=True)
    pet_breed = serializers.CharField(source='pet.breed', read_only=True)
    owner_name = serializers.CharField(source='pet.owner.full_name', read_only=True)
    owner_phone = serializers.CharField(source='pet.owner.phone', read_only=True)
    service_name = serializers.CharField(source='service.name', read_only=True)
    service_duration = serializers.IntegerField(source='service.duration_minutes', read_only=True)
    professional_name = serializers.CharField(source='assigned_professional.full_name', read_only=True)
    status_display = serializers.CharField(source='get_status_display', read_only=True)
    
    class Meta:
        model = Appointment
        fields = [
            'id', 'pet', 'nombre_mascota', 'raza_mascota', 'nombre_propietario', 'telefono_propietario',
            'service', 'nombre_servicio', 'duracion_servicio', 'assigned_professional', 'nombre_profesional',
            'pet_name', 'pet_breed', 'owner_name', 'owner_phone', 'service_name', 'service_duration', 'professional_name', 'status_display',
            'appointment_date', 'reason', 'status', 'estado_mostrar',
            'medication_type', 'medication_dosage', 'instructions', 'observations',
            'actual_start_time', 'actual_end_time', 'duracion_mostrar',
            'created_at', 'updated_at'
        ]
        read_only_fields = [
            'id', 'nombre_mascota', 'raza_mascota', 'nombre_propietario', 'telefono_propietario', 
            'nombre_servicio', 'duracion_servicio', 'nombre_profesional', 'estado_mostrar',
            'pet_name', 'pet_breed', 'owner_name', 'owner_phone', 'service_name', 'service_duration', 'professional_name', 'status_display',
            'duracion_mostrar', 'created_at', 'updated_at'
        ]

    def validate_appointment_date(self, valor):
        """Validar fecha y hora de la cita"""
        if valor < timezone.now() - timedelta(hours=1):
            raise serializers.ValidationError("La cita no puede ser en el pasado")
        if valor.hour < 8 or valor.hour >= 16:
            raise serializers.ValidationError("Las citas deben ser entre 8:00 AM y 4:00 PM")
        return valor

    def validate(self, atributos):
        """Validaciones cruzadas entre campos"""
        servicio = atributos.get('service')
        tipo_medicamento = atributos.get('medication_type', '')
        if servicio and servicio.requires_medication and not tipo_medicamento:
            raise serializers.ValidationError({
                'medication_type': f'El servicio {servicio.name} requiere especificar el medicamento'
            })
        return atributos


class SerializadorCitaCalendario(MixinNombreCorto, serializers.ModelSerializer):
    """Serializer simplificado para vista de calendario"""
    titulo = serializers.SerializerMethodField()
    nombre_mascota = serializers.CharField(source='pet.name', read_only=True)
    nombre_servicio = serializers.CharField(source='service.name', read_only=True)
    nombre_profesional = serializers.CharField(source='assigned_professional.full_name', read_only=True)
    nombre_propietario = serializers.SerializerMethodField()
    
    # Aliases para compatibilidad con frontend
    pet_name = serializers.CharField(source='pet.name', read_only=True)
    service_name = serializers.CharField(source='service.name', read_only=True)
    professional_name = serializers.CharField(source='assigned_professional.full_name', read_only=True)
    owner_name = serializers.SerializerMethodField()
    
    class Meta:
        model = Appointment
        fields = [
            'id', 'titulo', 'nombre_mascota', 'nombre_servicio', 'nombre_profesional', 'nombre_propietario',
            'pet_name', 'service_name', 'professional_name', 'owner_name',
            'appointment_date', 'status', 'duration_display', 'reason', 'instructions', 
            'observations', 'medication_type', 'medication_dosage', 'pet', 'service', 
            'assigned_professional'
        ]

    def get_titulo(self, obj):
        return f"{obj.pet.name} - {obj.service.name}"
    
    def get_nombre_propietario(self, obj):
        """Extraer primer nombre + primer apellido del dueño"""
        return self.obtener_nombre_corto_desde_completo(obj.pet.owner.full_name)
    
    def get_owner_name(self, obj):
        """Alias para compatibilidad con frontend"""
        return self.get_nombre_propietario(obj)