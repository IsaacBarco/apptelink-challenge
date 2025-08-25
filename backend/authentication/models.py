from django.contrib.auth.models import AbstractUser
from django.db import models

class CustomUser(AbstractUser):
    failed_login_attempts = models.IntegerField(default=0)
    is_locked = models.BooleanField(default=False)
    locked_until = models.DateTimeField(null=True, blank=True)
    
    ROLE_CHOICES = [
        ('admin', 'Administrador'),
        ('staff', 'Personal'),
    ]
    role = models.CharField(max_length=10, choices=ROLE_CHOICES, default='staff')

    class Meta:
        db_table = 'authentication_customuser'

    def __str__(self):
        return self.username