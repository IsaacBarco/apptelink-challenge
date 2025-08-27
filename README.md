# Sistema de Atención Canina

Sistema web para gestión de clínica veterinaria con Django REST Framework y React.

## Descripción

Aplicación para administrar una clínica veterinaria que permite manejar citas, mascotas, dueños y servicios. Incluye un calendario semanal y sistema de reportes.

## Funcionalidades

- Gestión de citas con calendario semanal
- Administración de mascotas y dueños
- Catálogo de servicios veterinarios
- Sistema de reportes básicos
- Autenticación con JWT
- Dashboard con navegación lateral

## Tecnologías

**Backend:**
- Django 5.2.5
- Django REST Framework
- SQL Server
- JWT Authentication

**Frontend:**
- React 19
- Vite
- React Router

## Instalación

### Backend

1. Crear entorno virtual:
```bash
cd backend
python -m venv venv
venv\Scripts\activate  # Windows
pip install -r requirements.txt
```

2. Configurar base de datos en `settings.py`

3. Ejecutar migraciones:
```bash
python manage.py migrate
python manage.py createsuperuser
python manage.py runserver
```

### Frontend

1. Instalar dependencias:
```bash
cd frontend
npm install
npm run dev
```

## Uso

1. Acceder a `http://localhost:5173/login`
2. Usar credenciales del superusuario
3. Navegar por las secciones del dashboard
4. Gestionar citas, mascotas, dueños y servicios

## Estructura

```
backend/
├── authentication/    # Login y usuarios
├── core/             # Modelos principales
│   ├── models/       # Pet, Owner, Appointment, Service
│   ├── views/        # API endpoints
│   └── serializers/  # JSON transformers
└── veterinaria/      # Configuración Django

frontend/
├── src/
│   ├── features/     # Componentes por módulo
│   ├── config/       # Configuración API
│   └── utils/        # Utilidades
```

## API Endpoints

- `POST /api/auth/login/` - Login
- `GET /api/appointments/` - Listar citas
- `GET /api/appointments/calendar_week/` - Calendario semanal
- `GET /api/pets/` - Listar mascotas
- `GET /api/owners/` - Listar dueños
- `GET /api/services/` - Listar servicios

## Comandos útiles

```bash
# Backend
python manage.py test
python manage.py makemigrations
python manage.py migrate

# Frontend  
npm run build
npm run lint
npm run dev
```

## Características principales

- Horarios de citas: 8:00 AM - 4:00 PM
- Estados de citas: pendiente, confirmada, realizada, cancelada
- Validaciones de horario automáticas
- Filtros y búsquedas
- Interfaz responsive

---

Desarrollado para gestión veterinaria básica.