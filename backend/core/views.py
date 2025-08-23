from rest_framework import viewsets, status, filters
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework.permissions import IsAuthenticated
from django_filters.rest_framework import DjangoFilterBackend
from django.db.models import Q
from .models import Owner, Pet, Service, Appointment, Professional
from .serializers import (
    OwnerSerializer, PetSerializer, ServiceSerializer, 
    AppointmentSerializer, AppointmentCalendarSerializer, ProfessionalSerializer
)



class OwnerViewSet(viewsets.ModelViewSet):
    """ViewSet para gestión completa de dueños"""
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
        """Obtener todas las mascotas de un dueño específico - RF_DM_004"""
        owner = self.get_object()
        pets = owner.pets.filter(is_active=True)
        serializer = PetSerializer(pets, many=True)
        return Response(serializer.data)

    @action(detail=False, methods=['get'])
    def search_by_identification(self, request):
        """Buscar dueño por número de identificación"""
        identification = request.query_params.get('identification', '')
        if not identification:
            return Response(
                {'error': 'Parámetro identification requerido'}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            owner = Owner.objects.get(
                identification_number=identification, 
                is_active=True
            )
            serializer = self.get_serializer(owner)
            return Response(serializer.data)
        except Owner.DoesNotExist:
            return Response(
                {'error': 'Dueño no encontrado'}, 
                status=status.HTTP_404_NOT_FOUND
            )

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
        """Buscar mascotas por nombre del dueño - RF_M_003"""
        owner_name = request.query_params.get('owner_name', '')
        if not owner_name:
            return Response(
                {'error': 'Parámetro owner_name requerido'}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        pets = self.queryset.filter(
            owner__full_name__icontains=owner_name
        )
        serializer = self.get_serializer(pets, many=True)
        return Response(serializer.data)

    @action(detail=False, methods=['get'])
    def by_breed(self, request):
        """Listar mascotas por raza"""
        breed = request.query_params.get('breed', '')
        if not breed:
            return Response(
                {'error': 'Parámetro breed requerido'}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        pets = self.queryset.filter(breed__icontains=breed)
        serializer = self.get_serializer(pets, many=True)
        return Response(serializer.data)

    @action(detail=True, methods=['get'])
    def medical_history(self, request, pk=None):
        """Obtener historial médico básico de una mascota"""
        pet = self.get_object()
        data = {
            'pet': PetSerializer(pet).data,
            'allergies': pet.allergies,
            'medical_conditions': pet.medical_conditions,
            'additional_notes': pet.additional_notes,
            'recent_appointments': pet.appointments.filter(
                status__in=['realizada', 'confirmada']
            ).order_by('-appointment_date')[:5].values(
                'appointment_date', 'service__name', 'observations'
            )
        }
        return Response(data)

    def get_queryset(self):
        """Permitir filtros adicionales en query params"""
        queryset = super().get_queryset()
        
        # Filtro por edad (en meses)
        min_age = self.request.query_params.get('min_age_months')
        max_age = self.request.query_params.get('max_age_months')
        
        if min_age:
            try:
                min_age = int(min_age)
                # Calcular fecha límite
                from datetime import date, timedelta
                max_birth_date = date.today() - timedelta(days=min_age * 30.44)
                queryset = queryset.filter(birth_date__lte=max_birth_date)
            except ValueError:
                pass
                
        if max_age:
            try:
                max_age = int(max_age)
                min_birth_date = date.today() - timedelta(days=max_age * 30.44)
                queryset = queryset.filter(birth_date__gte=min_birth_date)
            except ValueError:
                pass
        
        return queryset

class ServiceViewSet(viewsets.ModelViewSet):
    """ViewSet para gestión de servicios"""
    queryset = Service.objects.filter(is_active=True)
    serializer_class = ServiceSerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['service_type', 'is_active']
    search_fields = ['name', 'description']
    ordering_fields = ['name', 'price']
    ordering = ['service_type', 'name']

class AppointmentViewSet(viewsets.ModelViewSet):
    """ViewSet para gestión de citas"""
    queryset = Appointment.objects.all()
    serializer_class = AppointmentSerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['status', 'service', 'pet', 'assigned_professional']
    search_fields = ['pet__name', 'pet__owner__full_name', 'service__name']
    ordering_fields = ['appointment_date', 'created_at']
    ordering = ['-appointment_date']

    @action(detail=False, methods=['get'])
    def by_date(self, request):
        """Consultar citas por fecha específica - RF_C_004"""
        date_str = request.query_params.get('date', '')
        if not date_str:
            return Response(
                {'error': 'Parámetro date requerido (YYYY-MM-DD)'}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            from datetime import datetime
            date_obj = datetime.strptime(date_str, '%Y-%m-%d').date()
            appointments = self.queryset.filter(appointment_date__date=date_obj)
            serializer = self.get_serializer(appointments, many=True)
            return Response(serializer.data)
        except ValueError:
            return Response(
                {'error': 'Formato de fecha inválido. Use YYYY-MM-DD'}, 
                status=status.HTTP_400_BAD_REQUEST
            )

# Vista simple para verificar conexión
class StatusView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        return Response({
            'message': 'API funcionando correctamente',
            'user': request.user.username,
            'models_count': {
                'owners': Owner.objects.filter(is_active=True).count(),
                'pets': Pet.objects.filter(is_active=True).count(),
                'services': Service.objects.filter(is_active=True).count(),
                'appointments': Appointment.objects.count(),
            }
        })