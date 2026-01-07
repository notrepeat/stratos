# SuperAdmin Configuration

## ¿Qué es el SuperAdmin?

El SuperAdmin es un usuario especial con **permisos absolutos** en todo el sistema. Tiene acceso a todas las funcionalidades independientemente de las reglas de SpiceDB o restricciones de tenant.

## ⚠️ Configuración OBLIGATORIA

**NO hay valores por defecto.** El sistema NO INICIA si no configuras estas variables:

```env
SUPER_ADMIN_EMAIL=tu-email-de-superadmin@empresa.com
SUPER_ADMIN_NAME=Nombre del Super Admin
SUPER_ADMIN_DEFAULT_PASSWORD=contraseña-temporal-segura-de-al-menos-8-caracteres
```

## Creación Automática

El SuperAdmin se crea automáticamente durante el bootstrap del sistema si:

1. ✅ Las variables de entorno están configuradas correctamente
2. ✅ No existe otro SuperAdmin en la base de datos
3. ✅ El email no está tomado por otro usuario

Si alguna variable falta, el sistema **FALLA** con logs detallados indicando qué falta.

## Características

- **Acceso Global**: Puede acceder a cualquier tenant y recurso
- **Bypass de Permisos**: Ignora todas las reglas de SpiceDB
- **Tenant Especial**: Se asigna al tenant 'global'
- **Único**: Solo puede existir un SuperAdmin en el sistema
- **Password Hashed**: Usa Argon2 para hash seguro

## Inicio de Sesión

Después de que el sistema inicie, puedes hacer login con:

```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "tu-email-de-superadmin@empresa.com",
    "password": "contraseña-temporal-segura"
  }'
```

## Seguridad - ACCIONES CRÍTICAS

🚨 **OBLIGATORIO**: Cambia la contraseña por defecto inmediatamente después del primer login.

⚠️ **Importante**: El SuperAdmin tiene acceso total al sistema. Asegúrate de:

- **Nunca usar contraseñas débiles**
- **Limitar el acceso físico a las variables de entorno**
- **Monitorear TODAS las acciones del SuperAdmin**
- **Considerar 2FA adicional para el SuperAdmin**
- **Rotar credenciales periódicamente**

## Uso en Código

```typescript
// En guards o servicios, verificar si es superadmin
if (user.hasSuperAdminAccess()) {
  // Permitir acceso absoluto - bypass de todas las reglas
  return true;
}
```

## Logs de Validación

Si faltan variables, verás logs como:

```
🚨 CRITICAL: Super admin configuration is incomplete!
Missing required environment variables:
  ❌ SUPER_ADMIN_EMAIL
  ❌ SUPER_ADMIN_NAME
  ❌ SUPER_ADMIN_DEFAULT_PASSWORD

💡 SOLUTION: Configure these variables in your .env file
   The system cannot start without a super admin.
```
