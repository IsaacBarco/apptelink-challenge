# ViewSet para gestión de citas - funcionalidad principal del sistema
from rest_framework import viewsets, status, filters
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django_filters.rest_framework import DjangoFilterBackend
from django.core.exceptions import ValidationError

from ..models import Appointment
from ..serializers import AppointmentSerializer, AppointmentCalendarSerializer


class AppointmentViewSet(viewsets.ModelViewSet):
    """ViewSet para gestión completa de citas"""
    queryset = Appointment.objects.all()
    serializer_class = AppointmentSerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['status', 'service', 'pet']
    search_fields = ['pet__name', 'pet__owner__full_name', 'service__name', 'reason']
    ordering_fields = ['appointment_date', 'created_at']
    ordering = ['-appointment_date']

    def perform_create(self, serializer):
        """Guarda la cita y asigna el usuario que la creó"""
        try:
            serializer.save(created_by=self.request.user)
        except ValidationError as e:
            # Convertir ValidationError de Django a DRF ValidationError
            from rest_framework.exceptions import ValidationError as DRFValidationError
            raise DRFValidationError(e.message_dict)

    @action(detail=False, methods=['get'])
    def by_date(self, request):
        """Consultar citas por fecha específica - RF_C_004"""
        fecha_str = request.query_params.get('date', '')
        if not fecha_str:
            return Response(
                {'error': 'Parámetro date requerido (YYYY-MM-DD)'},
                status=status.HTTP_400_BAD_REQUEST
            )

        try:
            from datetime import datetime
            fecha_obj = datetime.strptime(fecha_str, '%Y-%m-%d').date()
            citas = self.queryset.filter(appointment_date__date=fecha_obj)
            serializer = self.get_serializer(citas, many=True)
            return Response(serializer.data)
        except ValueError:
            return Response(
                {'error': 'Formato de fecha inválido. Use YYYY-MM-DD'},
                status=status.HTTP_400_BAD_REQUEST
            )


    @action(detail=False, methods=['get'])
    def by_pet(self, request):
        """Consultar citas por mascota específica - RF_C_004"""
        id_mascota = request.query_params.get('pet_id', '')
        if not id_mascota:
            return Response(
                {'error': 'Parámetro pet_id requerido'},
                status=status.HTTP_400_BAD_REQUEST
            )

        citas = self.queryset.filter(pet_id=id_mascota)
        serializer = self.get_serializer(citas, many=True)
        return Response(serializer.data)

    @action(detail=False, methods=['get'])
    def calendar_week(self, request):
        """Vista de calendario semanal - usado por el frontend"""
        from datetime import datetime, timedelta

        # Obtener fecha de inicio de semana (parámetro opcional)
        fecha_str = request.query_params.get('date', '')
        if fecha_str:
            try:
                fecha_base = datetime.strptime(fecha_str, '%Y-%m-%d').date()
            except ValueError:
                return Response(
                    {'error': 'Formato de fecha inválido'},
                    status=status.HTTP_400_BAD_REQUEST
                )
        else:
            # Si no se especifica fecha, usar la actual
            from django.utils import timezone
            fecha_base = timezone.now().date()

        # Calcular inicio y fin de semana (Lunes a Sábado)
        dias_desde_lunes = fecha_base.weekday()
        inicio_semana = fecha_base - timedelta(days=dias_desde_lunes)
        fin_semana = inicio_semana + timedelta(days=6)

        # Obtener solo las citas de esa semana
        citas = self.queryset.filter(
            appointment_date__date__gte=inicio_semana,
            appointment_date__date__lte=fin_semana
        )

        # Usar serializer optimizado para calendario
        serializer = AppointmentCalendarSerializer(citas, many=True)
        return Response({
            'inicio_semana': inicio_semana,
            'fin_semana': fin_semana,
            'citas': serializer.data
        })

    @action(detail=True, methods=['patch'])
    def update_status(self, request, pk=None):
        """Actualizar solo el estado de una cita - RF_C_006"""
        cita = self.get_object()
        nuevo_estado = request.data.get('status')

        if nuevo_estado not in ['pendiente', 'confirmada', 'realizada', 'cancelada']:
            return Response(
                {'error': 'Estado inválido'},
                status=status.HTTP_400_BAD_REQUEST
            )

        cita.status = nuevo_estado

        # Auto-completar tiempos si se marca como realizada
        if nuevo_estado == 'realizada' and not cita.actual_end_time:
            from django.utils import timezone
            cita.actual_end_time = timezone.now()
            if not cita.actual_start_time:
                cita.actual_start_time = cita.appointment_date

        try:
            cita.save()
        except ValidationError as e:
            return Response(
                {'error': e.message_dict if hasattr(e, 'message_dict') else str(e)},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        serializer = self.get_serializer(cita)
        return Response(serializer.data)

    def destroy(self, request, *args, **kwargs):
        """Eliminar cita completamente - usado por botón 'Cancelar Cita'"""
        instance = self.get_object()
        
        # Regla de negocio: no eliminar citas ya realizadas
        if instance.status == 'realizada':
            return Response(
                {'error': 'No se pueden eliminar citas que ya fueron realizadas'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Eliminar la cita de la base de datos
        self.perform_destroy(instance)
        return Response(status=status.HTTP_204_NO_CONTENT)