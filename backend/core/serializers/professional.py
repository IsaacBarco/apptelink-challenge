from rest_framework import serializers
from ..models import Professional


class SerializadorProfesional(serializers.ModelSerializer):
    class Meta:
        model = Professional
        fields = ['id', 'full_name', 'specialty', 'phone', 'email', 'is_active']
        read_only_fields = ['id']