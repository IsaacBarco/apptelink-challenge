from rest_framework import status
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework_simplejwt.tokens import RefreshToken
from django.contrib.auth import authenticate
from django.utils import timezone
from datetime import timedelta
from .models import CustomUser
from .serializers import UserSerializer

class LoginView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        username = request.data.get('username')
        password = request.data.get('password')

        if not username or not password:
            return Response(
                {'error': 'Usuario y contraseña son requeridos'},
                status=status.HTTP_400_BAD_REQUEST
            )

        try:
            user = CustomUser.objects.get(username=username)
            
            # Verificar bloqueo
            if user.is_locked:
                if user.locked_until and timezone.now() > user.locked_until:
                    user.is_locked = False
                    user.failed_login_attempts = 0
                    user.locked_until = None
                    user.save()
                else:
                    return Response(
                        {'error': 'Usuario bloqueado. Intente más tarde.'},
                        status=status.HTTP_423_LOCKED
                    )

            # Autenticar
            authenticated_user = authenticate(username=username, password=password)
            
            if authenticated_user:
                user.failed_login_attempts = 0
                user.save()
                
                refresh = RefreshToken.for_user(authenticated_user)
                return Response({
                    'message': 'Login exitoso',
                    'user': UserSerializer(authenticated_user).data,
                    'access': str(refresh.access_token),
                    'refresh': str(refresh),
                })
            else:
                user.failed_login_attempts += 1
                
                if user.failed_login_attempts >= 3:
                    user.is_locked = True
                    user.locked_until = timezone.now() + timedelta(minutes=15)
                    user.save()
                    return Response(
                        {'error': 'Usuario bloqueado por múltiples intentos fallidos'},
                        status=status.HTTP_423_LOCKED
                    )
                else:
                    user.save()
                    remaining = 3 - user.failed_login_attempts
                    return Response(
                        {'error': f'Credenciales inválidas. {remaining} intentos restantes'},
                        status=status.HTTP_401_UNAUTHORIZED
                    )

        except CustomUser.DoesNotExist:
            return Response(
                {'error': 'Usuario no encontrado'},
                status=status.HTTP_401_UNAUTHORIZED
            )

class UserProfileView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        serializer = UserSerializer(request.user)
        return Response(serializer.data)