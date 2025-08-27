from rest_framework import viewsets
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.utils import timezone
from django.db.models import Count, Sum, Avg
from datetime import datetime, timedelta
from django.http import HttpResponse
import csv

from ..models import Owner, Pet, Service, Appointment
from ..serializers import (
    OwnerSerializer, PetSerializer, ServiceSerializer,
    AppointmentSerializer
)
from django.db.models import Q


class ReportsViewSet(viewsets.ViewSet):
    """ViewSet para generación de informes del sistema"""
    permission_classes = [IsAuthenticated]

    @action(detail=False, methods=['get'])
    def appointments_summary(self, request):
        """Reporte de citas por estado y período"""
        # Parámetros de fecha
        start_date = request.query_params.get('start_date')
        end_date = request.query_params.get('end_date')

        appointments = Appointment.objects.all()

        if start_date:
            try:
                start = timezone.make_aware(datetime.strptime(start_date, '%Y-%m-%d'))
                appointments = appointments.filter(appointment_date__gte=start)
            except ValueError:
                pass

        if end_date:
            try:
                end = timezone.make_aware(datetime.strptime(end_date, '%Y-%m-%d'))
                end = end.replace(hour=23, minute=59, second=59)
                appointments = appointments.filter(appointment_date__lte=end)
            except ValueError:
                pass

        # Estadísticas por estado
        stats_by_status = appointments.values('status').annotate(
            count=Count('id')
        ).order_by('status')

        # Estadísticas por servicio
        stats_by_service = appointments.values(
            'service__name', 'service__service_type'
        ).annotate(
            count=Count('id'),
            total_revenue=Sum('service__price')
        ).order_by('-count')

        # Estadísticas por profesional (removido)

        # Tendencia por días
        ultimos_30_dias = []
        for i in range(29, -1, -1):
            dia = timezone.now().date() - timedelta(days=i)
            cantidad = appointments.filter(appointment_date__date=dia).count()
            ultimos_30_dias.append({
                'date': dia.strftime('%Y-%m-%d'),
                'count': cantidad
            })

        return Response({
            'total_appointments': appointments.count(),
            'by_status': list(stats_by_status),
            'by_service': list(stats_by_service),
            'last_30_days': ultimos_30_dias,
            'period': {
                'start': start_date,
                'end': end_date
            }
        })

    @action(detail=False, methods=['get'])
    def services_report(self, request):
        """Reporte de servicios más solicitados y rentabilidad"""
        services_stats = Service.objects.annotate(
            appointments_count=Count('appointment'),
            total_revenue=Sum('appointment__service__price'),
            avg_appointments_per_month=Avg('appointment__id')
        ).order_by('-appointments_count')

        # Servicios por tipo
        by_type = Service.objects.values('service_type').annotate(
            count=Count('appointment'),
            revenue=Sum('appointment__service__price')
        ).order_by('-count')

        return Response({
            'services_performance': ServiceSerializer(services_stats, many=True).data,
            'by_type': list(by_type),
            'total_services': Service.objects.filter(is_active=True).count()
        })

    @action(detail=False, methods=['get'])
    def clients_report(self, request):
        """Reporte de datos de clientes y mascotas"""
        # Estadísticas de dueños
        owners_stats = Owner.objects.annotate(
            pets_count=Count('pets', filter=Q(pets__is_active=True)),
            appointments_count=Count('pets__appointments')
        ).order_by('-appointments_count')

        # Mascotas más atendidas
        pets_stats = Pet.objects.annotate(
            appointments_count=Count('appointments')
        ).filter(appointments_count__gt=0).order_by('-appointments_count')[:10]

        # Registros nuevos último mes
        last_month = timezone.now() - timedelta(days=30)
        new_owners = Owner.objects.filter(created_at__gte=last_month).count()
        new_pets = Pet.objects.filter(created_at__gte=last_month).count()

        # Razas más comunes
        breed_stats = Pet.objects.values('breed').annotate(
            count=Count('id')
        ).order_by('-count')[:10]

        return Response({
            'total_owners': Owner.objects.filter(is_active=True).count(),
            'total_pets': Pet.objects.filter(is_active=True).count(),
            'new_owners_last_month': new_owners,
            'new_pets_last_month': new_pets,
            'top_clients': OwnerSerializer(owners_stats[:10], many=True).data,
            'most_attended_pets': PetSerializer(pets_stats, many=True).data,
            'breed_distribution': list(breed_stats)
        })

    @action(detail=False, methods=['get'])
    def dashboard_metrics(self, request):
        """Métricas principales para dashboard"""
        today = timezone.now().date()
        this_month = timezone.now().replace(day=1).date()

        # Métricas de hoy
        today_appointments = Appointment.objects.filter(appointment_date__date=today)

        # Métricas del mes
        month_appointments = Appointment.objects.filter(appointment_date__date__gte=this_month)
        month_revenue = month_appointments.aggregate(
            revenue=Sum('service__price')
        )['revenue'] or 0

        # Próximas citas
        upcoming = Appointment.objects.filter(
            appointment_date__gte=timezone.now(),
            status__in=['pendiente', 'confirmada']
        ).order_by('appointment_date')[:5]

        return Response({
            'today': {
                'total_appointments': today_appointments.count(),
                'pending': today_appointments.filter(status='pendiente').count(),
                'confirmed': today_appointments.filter(status='confirmada').count(),
                'completed': today_appointments.filter(status='realizada').count(),
            },
            'month': {
                'total_appointments': month_appointments.count(),
                'revenue': float(month_revenue),
                'avg_per_day': month_appointments.count() / timezone.now().day
            },
            'totals': {
                'owners': Owner.objects.filter(is_active=True).count(),
                'pets': Pet.objects.filter(is_active=True).count(),
                'services': Service.objects.filter(is_active=True).count(),
            },
            'upcoming_appointments': AppointmentSerializer(upcoming, many=True).data
        })

    @action(detail=False, methods=['get'])
    def export_appointments(self, request):
        """Exportar citas a CSV"""
        start_date = request.query_params.get('start_date')
        end_date = request.query_params.get('end_date')

        appointments = Appointment.objects.select_related(
            'pet', 'pet__owner', 'service'
        ).all()

        if start_date:
            try:
                start = timezone.make_aware(datetime.strptime(start_date, '%Y-%m-%d'))
                appointments = appointments.filter(appointment_date__gte=start)
            except ValueError:
                pass

        if end_date:
            try:
                end = timezone.make_aware(datetime.strptime(end_date, '%Y-%m-%d'))
                appointments = appointments.filter(appointment_date__lte=end)
            except ValueError:
                pass

        response = HttpResponse(content_type='text/csv')
        response['Content-Disposition'] = 'attachment; filename="citas_export.csv"'

        writer = csv.writer(response)
        writer.writerow([
            'Fecha', 'Hora', 'Mascota', 'Dueño', 'Servicio',
            'Estado', 'Precio', 'Observaciones'
        ])

        for apt in appointments:
            writer.writerow([
                apt.appointment_date.strftime('%Y-%m-%d'),
                apt.appointment_date.strftime('%H:%M'),
                apt.pet.name,
                apt.pet.owner.full_name,
                apt.service.name,
                apt.get_status_display(),
                f'${apt.service.price}',
                apt.observations or ''
            ])

        return response