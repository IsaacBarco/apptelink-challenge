from rest_framework import serializers
from datetime import date
from ..models import Pet
from .mixins import MixinNombreCorto


class SerializadorMascota(MixinNombreCorto, serializers.ModelSerializer):
    nombre_propietario = serializers.CharField(source='owner.full_name', read_only=True)
    telefono_propietario = serializers.CharField(source='owner.phone', read_only=True)
    nombre_corto_propietario = serializers.SerializerMethodField()
    edad_meses = serializers.SerializerMethodField()
    edad_mostrar = serializers.SerializerMethodField()
    
    # Aliases para compatibilidad con frontend
    owner_name = serializers.CharField(source='owner.full_name', read_only=True)
    owner_phone = serializers.CharField(source='owner.phone', read_only=True)
    owner_short_name = serializers.SerializerMethodField()
    
    class Meta:
        model = Pet
        fields = [
            'id', 'name', 'species', 'breed', 'birth_date', 'gender',
            'color', 'weight', 'allergies', 'medical_conditions', 
            'additional_notes', 'owner', 'nombre_propietario', 'telefono_propietario', 'nombre_corto_propietario',
            'owner_name', 'owner_phone', 'owner_short_name',
            'edad_meses', 'edad_mostrar', 'is_active', 'created_at', 'updated_at'
        ]
        read_only_fields = [
            'id', 'species', 'nombre_propietario', 'telefono_propietario', 'nombre_corto_propietario',
            'owner_name', 'owner_phone', 'owner_short_name',
            'edad_meses', 'edad_mostrar', 'created_at', 'updated_at'
        ]

    def get_edad_meses(self, obj):
        """Calcular edad en meses"""
        hoy = date.today()
        diferencia_edad = hoy - obj.birth_date
        return int(diferencia_edad.days / 30.44)

    def get_edad_mostrar(self, obj):
        """Mostrar edad en formato amigable"""
        meses = self.get_edad_meses(obj)
        if meses < 12:
            return f"{meses} meses"
        else:
            años = meses // 12
            meses_restantes = meses % 12
            if meses_restantes == 0:
                return f"{años} año{'s' if años > 1 else ''}"
            else:
                return f"{años} año{'s' if años > 1 else ''} y {meses_restantes} meses"
                
    def get_nombre_corto_propietario(self, obj):
        """Extraer primer nombre + primer apellido del dueño"""
        return self.obtener_nombre_corto_desde_completo(obj.owner.full_name)
    
    def get_owner_short_name(self, obj):
        """Alias para compatibilidad con frontend - extraer primer nombre + primer apellido del dueño"""
        return self.obtener_nombre_corto_desde_completo(obj.owner.full_name)

    def validate_birth_date(self, valor):
        """Validar fecha de nacimiento"""
        if valor > date.today():
            raise serializers.ValidationError("La fecha de nacimiento no puede ser futura")
        
        años_transcurridos = (date.today() - valor).days / 365
        if años_transcurridos > 20:
            raise serializers.ValidationError("La fecha parece muy antigua. Verifique la fecha.")
        return valor

    def validate_weight(self, valor):
        """Validar peso"""
        if valor <= 0:
            raise serializers.ValidationError("El peso debe ser mayor a 0")
        if valor > 100:
            raise serializers.ValidationError("El peso parece muy alto. Verifique el valor.")
        return valor

    def validate_owner(self, valor):
        """Validar que el dueño exista y esté activo"""
        if not valor.is_active:
            raise serializers.ValidationError("El dueño seleccionado no está activo")
        return valor