from rest_framework import viewsets, status, filters
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django_filters.rest_framework import DjangoFilterBackend

from ..models import Service
from ..serializers import ServiceSerializer


class ServiceViewSet(viewsets.ModelViewSet):
    """ViewSet para gestión de servicios con tipos específicos"""
    queryset = Service.objects.filter(is_active=True)
    serializer_class = ServiceSerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['service_type', 'requires_medication', 'is_active']
    search_fields = ['name', 'description']
    ordering_fields = ['name', 'price', 'duration_minutes']
    ordering = ['service_type', 'name']

    @action(detail=False, methods=['get'])
    def by_type(self, request):
        """Listar servicios por tipo específico"""
        service_type = request.query_params.get('type', '')
        if not service_type:
            return Response(
                {'error': 'Parámetro type requerido'},
                status=status.HTTP_400_BAD_REQUEST
            )

        services = self.queryset.filter(service_type=service_type)
        serializer = self.get_serializer(services, many=True)
        return Response(serializer.data)