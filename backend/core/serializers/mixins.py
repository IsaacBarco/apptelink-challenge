from rest_framework import serializers


class MixinNombreCorto:
    """Mixin para generar nombres cortos (primer nombre + primer apellido)"""
    
    @staticmethod
    def obtener_nombre_corto_desde_completo(nombre_completo):
        """Extrae nombre y apellido principal del nombre completo"""
        if not nombre_completo:
            return ""
            
        partes_nombre = nombre_completo.split()
        
        if len(partes_nombre) == 1:
            return partes_nombre[0]  # Solo un nombre
        elif len(partes_nombre) == 2:
            return f"{partes_nombre[0]} {partes_nombre[1]}"  # Nombre Apellido
        elif len(partes_nombre) == 3:
            return f"{partes_nombre[0]} {partes_nombre[2]}"  # Primer_Nombre Primer_Apellido
        elif len(partes_nombre) >= 4:
            return f"{partes_nombre[0]} {partes_nombre[2]}"  # Primer_Nombre Primer_Apellido
        
        return nombre_completo


class MixinValidacion:
    """Mixin con validaciones comunes"""
    
    def validar_numero_identificacion(self, valor):
        """Validación específica para número de identificación"""
        if len(valor) < 6:
            raise serializers.ValidationError(
                "El número de identificación debe tener al menos 6 caracteres"
            )
        return valor

    def validar_telefono(self, valor):
        """Validación para número de teléfono"""
        telefono_limpio = valor.replace(' ', '').replace('-', '')
        if len(telefono_limpio) < 7:
            raise serializers.ValidationError(
                "El teléfono debe tener al menos 7 dígitos"
            )
        return valor