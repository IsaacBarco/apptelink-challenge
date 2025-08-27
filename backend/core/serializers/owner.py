from rest_framework import serializers
from ..models import Owner
from .mixins import MixinNombreCorto, MixinValidacion


class SerializadorPropietario(MixinNombreCorto, MixinValidacion, serializers.ModelSerializer):
    cantidad_mascotas = serializers.SerializerMethodField()
    nombre_corto = serializers.SerializerMethodField()
    
    class Meta:
        model = Owner
        fields = [
            'id', 'full_name', 'identification_type', 'identification_number',
            'address', 'phone', 'email', 'cantidad_mascotas', 'nombre_corto', 'is_active',
            'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at', 'cantidad_mascotas', 'nombre_corto']

    def get_cantidad_mascotas(self, obj):
        return obj.pets.filter(is_active=True).count()
    
    def get_nombre_corto(self, obj):
        """Extraer primer nombre + primer apellido del dueño"""
        return self.obtener_nombre_corto_desde_completo(obj.full_name)

    def validate_identification_number(self, valor):
        """Validación específica para número de identificación"""
        return self.validar_numero_identificacion(valor)

    def validate_phone(self, valor):
        """Validación para número de teléfono"""
        return self.validar_telefono(valor)