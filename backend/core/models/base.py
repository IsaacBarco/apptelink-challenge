from django.db import models
from django.core.validators import RegexValidator, MinValueValidator
from django.core.exceptions import ValidationError
from django.utils import timezone
from datetime import date, timedelta


class TimeStampedModel(models.Model):
    """Modelo base con campos de timestamp"""
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        abstract = True


class ActiveModel(models.Model):
    """Modelo base con campo is_active"""
    is_active = models.BooleanField(default=True)
    
    class Meta:
        abstract = True


class BaseModel(TimeStampedModel, ActiveModel):
    """Modelo base completo con timestamps y estado activo"""
    
    class Meta:
        abstract = True