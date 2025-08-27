# ViewSet para gestión de profesionales
from rest_framework import viewsets
from rest_framework.permissions import IsAuthenticated

from ..models import Professional
from ..serializers import ProfessionalSerializer


class ProfessionalViewSet(viewsets.ReadOnlyModelViewSet):
    """ViewSet para consulta de profesionales (solo lectura)"""
    queryset = Professional.objects.filter(is_active=True)
    serializer_class = ProfessionalSerializer
    permission_classes = [IsAuthenticated]
    ordering = ['full_name']