from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated

from ..models import Owner, Pet, Service, Appointment


class StatusView(APIView):
    """Vista para verificar el estado de la API y obtener estadísticas básicas"""
    permission_classes = [IsAuthenticated]

    def get(self, request):
        """Devuelve el estado de la API y contadores de los modelos principales"""
        return Response({
            'mensaje': 'API funcionando correctamente',
            'usuario': request.user.username,
            'contadores_modelos': {
                'duenos': Owner.objects.filter(is_active=True).count(),
                'mascotas': Pet.objects.filter(is_active=True).count(),
                'servicios': Service.objects.filter(is_active=True).count(),
                'citas': Appointment.objects.count(),
            }
        })