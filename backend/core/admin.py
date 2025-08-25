from django.contrib import admin
from .models import Owner, Pet, Service, Appointment

@admin.register(Owner)
class OwnerAdmin(admin.ModelAdmin):
    list_display = ['full_name', 'identification_number', 'phone', 'pets_count']
    search_fields = ['full_name', 'identification_number', 'phone']
    list_filter = ['identification_type', 'is_active']
    
    def pets_count(self, obj):
        return obj.pets.filter(is_active=True).count()
    pets_count.short_description = 'Mascotas'

@admin.register(Pet)
class PetAdmin(admin.ModelAdmin):
    list_display = ['name', 'breed', 'owner', 'gender', 'age_display']
    search_fields = ['name', 'breed', 'owner__full_name']
    list_filter = ['gender', 'breed', 'is_active']
    
    def age_display(self, obj):
        return f"{obj.age_in_months} meses"
    age_display.short_description = 'Edad'

@admin.register(Service)
class ServiceAdmin(admin.ModelAdmin):
    list_display = ['name', 'service_type', 'price', 'duration_minutes', 'requires_medication']
    list_filter = ['service_type', 'requires_medication', 'is_active']
    search_fields = ['name', 'description']

@admin.register(Appointment)
class AppointmentAdmin(admin.ModelAdmin):
    list_display = ['appointment_date', 'pet', 'service', 'status']
    list_filter = ['status', 'service__service_type']
    search_fields = ['pet__name', 'pet__owner__full_name', 'service__name']
    date_hierarchy = 'appointment_date'