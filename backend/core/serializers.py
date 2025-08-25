from rest_framework import serializers
from .models import Owner, Pet, Service, Appointment
from datetime import date


class OwnerSerializer(serializers.ModelSerializer):
    pets_count = serializers.SerializerMethodField()
    
    class Meta:
        model = Owner
        fields = [
            'id', 'full_name', 'identification_type', 'identification_number',
            'address', 'phone', 'email', 'pets_count', 'is_active',
            'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at', 'pets_count']

    def get_pets_count(self, obj):
        return obj.pets.filter(is_active=True).count()

    def validate_identification_number(self, value):
        """Validación específica para número de identificación"""
        if len(value) < 6:
            raise serializers.ValidationError(
                "El número de identificación debe tener al menos 6 caracteres"
            )
        return value

    def validate_phone(self, value):
        """Validación para número de teléfono"""
        clean_phone = value.replace(' ', '').replace('-', '')
        if len(clean_phone) < 7:
            raise serializers.ValidationError(
                "El teléfono debe tener al menos 7 dígitos"
            )
        return value


class PetSerializer(serializers.ModelSerializer):
    owner_name = serializers.CharField(source='owner.full_name', read_only=True)
    owner_phone = serializers.CharField(source='owner.phone', read_only=True)
    age_months = serializers.SerializerMethodField()
    age_display = serializers.SerializerMethodField()
    
    class Meta:
        model = Pet
        fields = [
            'id', 'name', 'species', 'breed', 'birth_date', 'gender',
            'color', 'weight', 'allergies', 'medical_conditions', 
            'additional_notes', 'owner', 'owner_name', 'owner_phone',
            'age_months', 'age_display', 'is_active', 'created_at', 'updated_at'
        ]
        read_only_fields = [
            'id', 'species', 'owner_name', 'owner_phone',
            'age_months', 'age_display', 'created_at', 'updated_at'
        ]

    def get_age_months(self, obj):
        """Calcular edad en meses"""
        today = date.today()
        age = today - obj.birth_date
        return int(age.days / 30.44)

    def get_age_display(self, obj):
        """Mostrar edad en formato amigable"""
        months = self.get_age_months(obj)
        if months < 12:
            return f"{months} meses"
        else:
            years = months // 12
            remaining_months = months % 12
            if remaining_months == 0:
                return f"{years} año{'s' if years > 1 else ''}"
            else:
                return f"{years} año{'s' if years > 1 else ''} y {remaining_months} meses"

    def validate_birth_date(self, value):
        """Validar fecha de nacimiento"""
        if value > date.today():
            raise serializers.ValidationError("La fecha de nacimiento no puede ser futura")
        
        years_ago = (date.today() - value).days / 365
        if years_ago > 20:
            raise serializers.ValidationError("La fecha parece muy antigua. Verifique la fecha.")
        return value

    def validate_weight(self, value):
        """Validar peso"""
        if value <= 0:
            raise serializers.ValidationError("El peso debe ser mayor a 0")
        if value > 100:
            raise serializers.ValidationError("El peso parece muy alto. Verifique el valor.")
        return value

    def validate_owner(self, value):
        """Validar que el dueño exista y esté activo"""
        if not value.is_active:
            raise serializers.ValidationError("El dueño seleccionado no está activo")
        return value


class ServiceSerializer(serializers.ModelSerializer):
    service_type_display = serializers.CharField(source='get_service_type_display', read_only=True)
    
    class Meta:
        model = Service
        fields = [
            'id', 'name', 'service_type', 'service_type_display', 'description',
            'duration_minutes', 'price', 'requires_medication', 'default_instructions',
            'is_active', 'created_at'
        ]
        read_only_fields = ['id', 'created_at', 'service_type_display']


class AppointmentSerializer(serializers.ModelSerializer):
    pet_name = serializers.CharField(source='pet.name', read_only=True)
    pet_breed = serializers.CharField(source='pet.breed', read_only=True)
    owner_name = serializers.CharField(source='pet.owner.full_name', read_only=True)
    owner_phone = serializers.CharField(source='pet.owner.phone', read_only=True)
    service_name = serializers.CharField(source='service.name', read_only=True)
    service_duration = serializers.IntegerField(source='service.duration_minutes', read_only=True)
    status_display = serializers.CharField(source='get_status_display', read_only=True)
    duration_display = serializers.CharField(read_only=True)
    
    class Meta:
        model = Appointment
        fields = [
            'id', 'pet', 'pet_name', 'pet_breed', 'owner_name', 'owner_phone',
            'service', 'service_name', 'service_duration', 'appointment_date',
            'reason', 'status', 'status_display',
            'medication_type', 'medication_dosage', 'instructions', 'observations',
            'actual_start_time', 'actual_end_time', 'duration_display',
            'created_at', 'updated_at'
        ]
        read_only_fields = [
            'id', 'pet_name', 'pet_breed', 'owner_name', 'owner_phone', 
            'service_name', 'service_duration', 'status_display',
            'duration_display', 'created_at', 'updated_at'
        ]

    def validate_appointment_date(self, value):
        """Validar fecha y hora de la cita"""
        from datetime import timedelta
        from django.utils import timezone
        if value < timezone.now() - timedelta(hours=1):
            raise serializers.ValidationError("La cita no puede ser en el pasado")
        if value.hour < 8 or value.hour >= 16:
            raise serializers.ValidationError("Las citas deben ser entre 8:00 AM y 4:00 PM")
        return value

    def validate(self, attrs):
        """Validaciones cruzadas entre campos"""
        service = attrs.get('service')
        medication_type = attrs.get('medication_type', '')
        if service and service.requires_medication and not medication_type:
            raise serializers.ValidationError({
                'medication_type': f'El servicio {service.name} requiere especificar el medicamento'
            })
        return attrs


class AppointmentCalendarSerializer(serializers.ModelSerializer):
    """Serializer simplificado para vista de calendario"""
    title = serializers.SerializerMethodField()
    pet_name = serializers.CharField(source='pet.name', read_only=True)
    service_name = serializers.CharField(source='service.name', read_only=True)
    owner_name = serializers.SerializerMethodField()
    
    class Meta:
        model = Appointment
        fields = [
            'id', 'title', 'pet_name', 'service_name', 'owner_name',
            'appointment_date', 'status', 'duration_display'
        ]

    def get_title(self, obj):
        return f"{obj.pet.name} - {obj.service.name}"
    
    def get_owner_name(self, obj):
        """Extraer primer nombre + primer apellido del dueño"""
        full_name = obj.pet.owner.full_name
        name_parts = full_name.split()
        
        if len(name_parts) == 1:
            return name_parts[0]  # Solo un nombre
        elif len(name_parts) == 2:
            return f"{name_parts[0]} {name_parts[1]}"  # Nombre Apellido
        elif len(name_parts) == 3:
            return f"{name_parts[0]} {name_parts[2]}"  # Primer_Nombre Primer_Apellido
        elif len(name_parts) >= 4:
            return f"{name_parts[0]} {name_parts[2]}"  # Primer_Nombre Primer_Apellido
        
        return full_name
