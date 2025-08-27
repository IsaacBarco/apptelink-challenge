from django.core.management.base import BaseCommand
from core.models import Service


class Command(BaseCommand):
    help = 'Limpia y corrige los servicios duplicados o incorrectos'

    def handle(self, *args, **options):
        self.stdout.write('Iniciando limpieza de servicios...')
        
        # Eliminar servicios duplicados o incorrectos
        services_to_delete = Service.objects.filter(
            name__icontains='baño desparasitado'
        )
        
        if services_to_delete.exists():
            count = services_to_delete.count()
            self.stdout.write(f'Eliminando {count} servicios duplicados...')
            services_to_delete.delete()
            self.stdout.write(self.style.SUCCESS(f'Se eliminaron {count} servicios duplicados'))
        else:
            self.stdout.write('No se encontraron servicios duplicados')
        
        # Verificar que existan los servicios correctos según los requisitos
        required_services = [
            {
                'name': 'Baño Normal',
                'service_type': 'baño_normal',
                'description': 'Servicio de baño regular para mascotas',
                'price': '15.00',
                'duration_minutes': 45,
                'requires_medication': False,
                'default_instructions': 'Baño con champú regular, secado y cepillado'
            },
            {
                'name': 'Baño Medicado',
                'service_type': 'baño_medicado',
                'description': 'Baño con medicamentos específicos para problemas de piel',
                'price': '25.00',
                'duration_minutes': 60,
                'requires_medication': True,
                'default_instructions': 'Baño con champú medicado según prescripción veterinaria'
            },
            {
                'name': 'Peluquería Canina',
                'service_type': 'peluqueria',
                'description': 'Servicio completo de peluquería y estética canina',
                'price': '30.00',
                'duration_minutes': 90,
                'requires_medication': False,
                'default_instructions': 'Corte de pelo, baño, secado y cepillado profesional'
            },
            {
                'name': 'Desparasitación',
                'service_type': 'desparasitacion',
                'description': 'Aplicación de medicamentos antiparasitarios',
                'price': '20.00',
                'duration_minutes': 30,
                'requires_medication': True,
                'default_instructions': 'Aplicación de antiparasitario según peso y edad de la mascota'
            },
            {
                'name': 'Atención Canina General',
                'service_type': 'atencion_general',
                'description': 'Consulta veterinaria general y revisión de salud',
                'price': '35.00',
                'duration_minutes': 45,
                'requires_medication': False,
                'default_instructions': 'Revisión general de salud, vacunación si es necesaria'
            }
        ]
        
        # Crear o actualizar servicios requeridos
        for service_data in required_services:
            service, created = Service.objects.get_or_create(
                name=service_data['name'],
                defaults=service_data
            )
            
            if created:
                self.stdout.write(f'Creado servicio: {service.name}')
            else:
                # Actualizar si ya existe
                for key, value in service_data.items():
                    if key != 'name':
                        setattr(service, key, value)
                service.save()
                self.stdout.write(f'Actualizado servicio: {service.name}')
        
        self.stdout.write(self.style.SUCCESS('Limpieza de servicios completada exitosamente'))
        
        # Mostrar resumen final
        total_services = Service.objects.count()
        self.stdout.write(f'Total de servicios en la base de datos: {total_services}')
        
        for service_type in ['baño_normal', 'baño_medicado', 'peluqueria', 'desparasitacion', 'atencion_general']:
            count = Service.objects.filter(service_type=service_type).count()
            self.stdout.write(f'- {service_type}: {count} servicios')
