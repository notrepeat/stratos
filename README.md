# SaaS Template Enterprise

Base enterprise-ready para construir cualquier aplicación SaaS con arquitectura hexagonal autoconsiente.

## 🚀 Inicio Rápido

### 1. Configurar Infraestructura

```bash
# Iniciar servicios
docker-compose up -d postgres spicedb rustfs

# Verificar que estén corriendo
docker-compose ps
```

### 2. Configurar Variables de Entorno

Copia `.env.example` a `.env` y configura:

```bash
cp .env.example .env
# Editar .env con tus valores
```

**Variables críticas (sin defaults):**

- `SUPER_ADMIN_EMAIL` - Email del superadmin
- `SUPER_ADMIN_NAME` - Nombre del superadmin
- `SUPER_ADMIN_DEFAULT_PASSWORD` - Password inicial (cambiar después)

### 3. Ejecutar Migraciones Iniciales

```bash
# Generar migraciones desde schemas
pnpm migrate:generate

# Ejecutar migraciones iniciales (usa root user para crear tablas)
pnpm migrate:init

# Para migraciones futuras, usar el usuario de .env
pnpm migrate
```

### 4. Iniciar Aplicación

```bash
pnpm start:dev
```

La aplicación ejecutará automáticamente:

- ✅ Validación de entorno
- ✅ Provisionamiento de DB
- ✅ Migraciones automáticas
- ✅ Creación de SuperAdmin
- ✅ Validación de SpiceDB y S3

## 🏗️ Arquitectura

### Hexagonal Architecture

```
Domain (Business Logic)
  ↓
Ports (Interfaces)
  ↓
Adapters (Infrastructure)
```

### Self-Aware Bootstrap

1. **Environment** - Valida variables críticas
2. **Database** - Provisiona DB y ejecuta migraciones
3. **Permissions** - Valida SpiceDB
4. **Storage** - Valida S3
5. **Application** - Inicia NestJS

## 🔐 SuperAdmin

**Automáticamente creado** durante bootstrap con:

- Email: Configurado en `.env`
- Password: Hasheado con Argon2
- Tenant: `global` (acceso total)
- Permisos: Bypass de todas las reglas

### Login

```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "tu-superadmin@email.com",
    "password": "tu-password"
  }'
```

## 🛠️ Desarrollo

### Migraciones

```bash
# Generar nuevas migraciones
pnpm migrate:generate

# Ejecutar migraciones (usa usuario de .env)
pnpm migrate
```

### Scripts Disponibles

- `pnpm start:dev` - Desarrollo con hot reload
- `pnpm build` - Compilar para producción
- `pnpm lint` - Ejecutar ESLint
- `pnpm test` - Ejecutar tests
- `pnpm migrate:generate` - Generar migraciones
- `pnpm migrate:init` - Migraciones iniciales con root
- `pnpm migrate` - Migraciones normales con app user

## 📁 Estructura del Proyecto

```
src/
├── core/                 # Lógica core compartida
│   ├── config/          # Configuración (env, validation)
│   ├── infrastructure/  # Adaptadores de infraestructura
│   └── shared/          # Utilidades compartidas
├── modules/             # Slices de negocio
│   ├── users/          # Gestión de usuarios
│   ├── auth/           # Autenticación
│   ├── storage/        # Almacenamiento de archivos
│   └── ...
├── main.ts             # Bootstrap orchestrator
└── app.module.ts       # Módulo raíz
```

## 🔧 Tecnologías

- **Framework**: NestJS
- **Lenguaje**: TypeScript (strict mode)
- **Base de Datos**: PostgreSQL + Drizzle ORM
- **Permisos**: SpiceDB (Zanzibar model)
- **Storage**: S3 compatible (MinIO/RustFS)
- **Hashing**: Argon2
- **Validación**: Zod

## 🚨 Principios Fundamentales

1. **Sin código legacy** - Todo código muerto se elimina inmediatamente
2. **Zero defaults** - Nada funciona sin configuración explícita
3. **Self-aware** - Sistema valida infraestructura antes de iniciar
4. **Transport agnostic** - Lógica independiente de HTTP/GraphQL
5. **Security first** - Autenticación robusta desde el inicio

## 📚 Documentación Adicional

- [SuperAdmin](SUPERADMIN.md) - Configuración y uso del superadmin
- [Aliases](ALIASES.md) - Sistema de aliases TypeScript
- [Arquitectura](ARCHITECTURE.md) - Detalles técnicos

## 🤝 Contribuir

1. Seguir arquitectura hexagonal
2. Mantener tests actualizados
3. Usar aliases para imports
4. Eliminar código legacy
5. Validar con bootstrap completo
