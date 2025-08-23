# Sistema Web de Atención Canina

Sistema integral para la gestión de un centro de servicios veterinarios caninos.

## 🚀 Stack Tecnológico

- **Backend**: Django 5 + Django REST Framework + JWT
- **Frontend**: React + Vite + React Router
- **Base de Datos**: SQLite (desarrollo)

## 📦 Instalación

### Backend
```bash
cd backend
python -m venv venv
venv\Scripts\activate  # Windows
pip install -r requirements.txt
python manage.py migrate
python manage.py createsuperuser
python manage.py runserver