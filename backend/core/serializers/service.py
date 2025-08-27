from rest_framework import serializers
from ..models import Service


class SerializadorServicio(serializers.ModelSerializer):
    tipo_servicio_mostrar = serializers.CharField(source='get_service_type_display', read_only=True)
    
    class Meta:
        model = Service
        fields = [
            'id', 'name', 'service_type', 'tipo_servicio_mostrar', 'description',
            'duration_minutes', 'price', 'requires_medication', 'default_instructions',
            'is_active', 'created_at'
        ]
        read_only_fields = ['id', 'created_at', 'tipo_servicio_mostrar']