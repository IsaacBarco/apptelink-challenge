from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    OwnerViewSet,
    PetViewSet,
    ServiceViewSet,
    AppointmentViewSet,
    ReportsViewSet,
    StatusView,
)

router = DefaultRouter()
router.register(r'owners', OwnerViewSet)
router.register(r'pets', PetViewSet)
router.register(r'services', ServiceViewSet)
router.register(r'appointments', AppointmentViewSet)
router.register(r'reports', ReportsViewSet, basename='reports')

urlpatterns = [
    path('', include(router.urls)),
    path('status/', StatusView.as_view(), name='api_status'),
]