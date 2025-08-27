from rest_framework import viewsets, status, filters
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django_filters.rest_framework import DjangoFilterBackend

from ..models import Owner
from ..serializers import OwnerSerializer, PetSerializer


class OwnerViewSet(viewsets.ModelViewSet):
    """ViewSet para gestión de propietarios"""
    queryset = Owner.objects.filter(is_active=True)
    serializer_class = OwnerSerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['identification_type', 'is_active']
    search_fields = ['full_name', 'identification_number', 'phone', 'email']
    ordering_fields = ['full_name', 'created_at']
    ordering = ['full_name']

    @action(detail=True, methods=['get'])
    def pets(self, request, pk=None):
        """Obtener mascotas de un propietario"""
        owner = self.get_object()
        pets = owner.pets.filter(is_active=True)
        serializer = PetSerializer(pets, many=True)
        return Response(serializer.data)

    @action(detail=False, methods=['get'])
    def search_by_identification(self, request):
        """Buscar propietario por identificación"""
        identificacion = request.query_params.get('identification', '')
        if not identificacion:
            return Response(
                {'error': 'Parámetro identification requerido'},
                status=status.HTTP_400_BAD_REQUEST
            )

        try:
            dueno = Owner.objects.get(
                identification_number=identificacion,
                is_active=True
            )
            serializer = self.get_serializer(dueno)
            return Response(serializer.data)
        except Owner.DoesNotExist:
            return Response(
                {'error': 'Propietario no encontrado'},
                status=status.HTTP_404_NOT_FOUND
            )