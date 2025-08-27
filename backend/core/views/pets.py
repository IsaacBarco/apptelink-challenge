from rest_framework import viewsets, status, filters
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django_filters.rest_framework import DjangoFilterBackend

from ..models import Pet
from ..serializers import PetSerializer


class PetViewSet(viewsets.ModelViewSet):
    """ViewSet para gestión completa de mascotas"""
    queryset = Pet.objects.filter(is_active=True)
    serializer_class = PetSerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['gender', 'breed', 'owner']
    search_fields = ['name', 'breed', 'owner__full_name', 'owner__identification_number']
    ordering_fields = ['name', 'birth_date', 'created_at', 'weight']
    ordering = ['name']

    @action(detail=False, methods=['get'])
    def by_owner_name(self, request):
        """Buscar mascotas por nombre del propietario"""
        nombre_dueno = request.query_params.get('owner_name', '')
        if not nombre_dueno:
            return Response(
                {'error': 'Parámetro owner_name requerido'},
                status=status.HTTP_400_BAD_REQUEST
            )

        mascotas = self.queryset.filter(
            owner__full_name__icontains=nombre_dueno
        )
        serializer = self.get_serializer(mascotas, many=True)
        return Response(serializer.data)

    @action(detail=False, methods=['get'])
    def by_breed(self, request):
        """Listar mascotas por raza"""
        raza = request.query_params.get('breed', '')
        if not raza:
            return Response(
                {'error': 'Parámetro breed requerido'},
                status=status.HTTP_400_BAD_REQUEST
            )

        mascotas = self.queryset.filter(breed__icontains=raza)
        serializer = self.get_serializer(mascotas, many=True)
        return Response(serializer.data)

    @action(detail=True, methods=['get'])
    def medical_history(self, request, pk=None):
        """Obtener historial médico básico de una mascota"""
        mascota = self.get_object()
        datos = {
            'mascota': PetSerializer(mascota).data,
            'alergias': mascota.allergies,
            'condiciones_medicas': mascota.medical_conditions,
            'notas_adicionales': mascota.additional_notes,
            'citas_recientes': mascota.appointments.filter(
                status__in=['realizada', 'confirmada']
            ).order_by('-appointment_date')[:5].values(
                'appointment_date', 'service__name', 'observations'
            )
        }
        return Response(datos)

    def get_queryset(self):
        """Permitir filtros adicionales en parámetros de consulta"""
        queryset = super().get_queryset()

        # Filtro por edad (en meses)
        edad_minima = self.request.query_params.get('min_age_months')
        edad_maxima = self.request.query_params.get('max_age_months')

        if edad_minima:
            try:
                edad_minima = int(edad_minima)
                # Calcular fecha límite
                from datetime import date, timedelta
                fecha_nacimiento_maxima = date.today() - timedelta(days=edad_minima * 30.44)
                queryset = queryset.filter(birth_date__lte=fecha_nacimiento_maxima)
            except ValueError:
                pass

        if edad_maxima:
            try:
                edad_maxima = int(edad_maxima)
                fecha_nacimiento_minima = date.today() - timedelta(days=edad_maxima * 30.44)
                queryset = queryset.filter(birth_date__gte=fecha_nacimiento_minima)
            except ValueError:
                pass

        return queryset