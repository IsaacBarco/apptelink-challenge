from django.urls import path, include
from rest_framework.routers import DefaultRouter
from . import views

router = DefaultRouter()
router.register(r'owners', views.OwnerViewSet)
router.register(r'pets', views.PetViewSet)
router.register(r'services', views.ServiceViewSet)
router.register(r'professionals', views.ProfessionalViewSet)
router.register(r'appointments', views.AppointmentViewSet)

urlpatterns = [
    path('', include(router.urls)),
    path('status/', views.StatusView.as_view(), name='api_status'),
]