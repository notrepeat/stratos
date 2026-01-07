# TODO List - SaaS Template Enterprise

## Estado General

- **Modo Actual**: Build/Implementación
- **Estado**: Arquitectura Hexagonal Base + Infraestructura Completa ✅
- **Principio Fundamental**: Todo código legacy y muerto se **ELIMINA** inmediatamente
- **Arquitectura**: Hexagonal, Transport-Agnostic, Self-Aware, Multi-Tenant
- **Transportes**: HTTP REST (GraphQL opcional futuro)
- **Modelo de Negocio**: Suscripciones Mensuales (sin límites por ahora)
- **Slices Implementados**: Users ✅, Storage ✅, Auth (parcial)
- **Slices Pendientes**: Tenants, Billing, Notifications, Audit, Settings
- **SuperAdmin**: Automáticamente creado con permisos absolutos
- **TypeScript Aliases**: Sistema de aliases sólido (@core/_, @modules/_, etc.)

## Fase 0: Configuración Inicial del Proyecto

**Estado**: completed
**Prioridad**: high
**Descripción**: Proyecto NestJS limpio con tooling profesional

### Tareas

- [x] Inicializar proyecto con `nest new saas-template`
- [x] Instalar dependencias críticas:
  - Core: `zod`, `@nestjs/config`
  - DB: `drizzle-orm`, `pg`, `@types/pg`, `drizzle-kit`
  - Auth/Permisos: `@authzed/authzed-node`
  - Storage: `@aws-sdk/client-s3`, `busboy`, `@types/busboy`
  - Utils: `nanoid`, `ulid`
- [x] Crear estructura de carpetas completa según PLAN-MAESTRO
- [x] Configurar TypeScript strict mode en `tsconfig.json`
- [x] Configurar ESLint y Prettier
- [x] **Eliminar**: Cualquier archivo generado por defecto que no se use

## Fase 1: Capa de Autoconsciencia

**Estado**: completed
**Prioridad**: high
**Descripción**: Sistema valida infraestructura antes de arrancar

**Resultado**: ✅ Bootstrap sequence funcionando perfectamente

### Tareas

- [x] Crear validación de variables de entorno con Zod (`src/core/config/env.validation.ts`)
- [x] Implementar autoprovisionamiento de DB (`src/core/infrastructure/database/provisioner.ts`)
- [x] Sistema de migraciones automático (`src/core/infrastructure/database/migrator.ts`)
- [x] Validación de SpiceDB (`src/core/infrastructure/permissions/validator.ts`)
- [x] Validación de S3 (`src/core/infrastructure/storage/validator.ts`)
- [x] Orquestador principal en `main.ts` con secuencia de validaciones
- [x] **Eliminar**: Cualquier código de arranque que no valide infraestructura

## Fase 2: Arquitectura Hexagonal Base - Slice Users

**Estado**: completed ✅
**Prioridad**: high
**Descripción**: Primer slice siguiendo patrones hexagonales

**Resultado**: ✅ Arquitectura hexagonal completa implementada + Error credit resuelto

### Tareas

- [x] Definir dominio User (`src/modules/users/core/domain/user.entity.ts`)
- [x] Crear puertos (interfaces) para repository y gateway
- [x] Implementar UserService con lógica de negocio
- [x] Crear adaptador de DB con Drizzle (`user.repository.adapter.ts`)
- [x] Implementar controladores HTTP (`users.controller.ts`)
- [x] Crear DTOs para requests/responses
- [x] Wire everything en `users.module.ts`
- [x] Remover código de créditos innecesario
- [x] **Eliminar**: Cualquier implementación directa sin puertos/adaptadores

## Fase 3: Gateways para Comunicación entre Slices

**Estado**: completed
**Prioridad**: medium
**Descripción**: Comunicación sin acoplamiento directo

**Resultado**: ✅ Sistema de gateways implementado - comunicación desacoplada lista

**Progreso**: Comenzando con IUserGateway

### Tareas

- [x] Definir IUserGateway interface (`user.gateway.port.ts`)
- [x] Implementar adaptador local para monolito (`user-gateway.local.adapter.ts`)
- [x] Preparar adaptador gRPC para microservicios futuros
- [x] Exportar gateway desde UsersModule
- [x] **Eliminar**: Inyecciones directas entre servicios de diferentes slices

## Fase 4: Storage Gateway con Streaming

**Estado**: completed
**Prioridad**: high
**Descripción**: Almacenamiento sin buffering en RAM

**Resultado**: ✅ Storage gateway con streaming puro implementado

### Tareas

- [x] Definir IStorageGateway port con métodos upload/download/delete
- [x] Implementar S3 adapter con streaming puro (`s3-storage.adapter.ts`)
- [x] Crear controladores de upload/download con Busboy
- [x] Implementar aislamiento por tenant en paths
- [x] **Eliminar**: Cualquier código que buffer archivos en memoria

## Fase 3: Autenticación Completa

**Estado**: in_progress 🔄
**Prioridad**: high
**Descripción**: Auth completo con login/register/logout/me + tokens opacos

**Resultado**: Infraestructura de sesiones lista, endpoints básicos implementados

### Tareas

- [x] Crear schema de sesiones en DB (`session.schema.ts`)
- [x] Implementar SessionService con tokens opacos
- [x] Implementar login endpoint
- [ ] Implementar register endpoint
- [ ] Implementar logout endpoint
- [ ] Implementar /me endpoint
- [ ] Sistema de refresh tokens (decidir JWT vs opacos extendidos)
- [ ] Resolver errores TypeScript en AuthModule
- [ ] Habilitar AuthModule en app.module.ts
- [ ] Crear AuthGuard y decoradores
- [ ] **Eliminar**: Cualquier uso de JWT o auth stateless (por ahora)

## Fase 6: Integración con SpiceDB

**Estado**: completed
**Prioridad**: high
**Descripción**: Permisos granulares basados en relaciones

### Tareas

- [x] Crear schema SpiceDB en `schema.zed`
- [x] Implementar SpiceDBClient con métodos CRUD de relaciones
- [x] Crear PermissionGuard con decorador @CheckPermission
- [x] Integrar creación de relaciones en servicios (users, etc.)
- [x] **Eliminar**: Lógica de permisos hardcodeada en controladores

## Fase 7: Slice de Organizations

**Estado**: completed
**Prioridad**: high
**Descripción**: Gestión de equipos y multi-tenancy

### Tareas

- [x] Definir dominio Organization con jerarquías
- [x] Crear puertos para repository y gateway
- [x] Implementar OrganizationService
- [x] Crear adaptadores DB y controladores
- [x] Sistema de invitaciones y roles
- [x] Integrar con permisos SpiceDB
- [x] **Eliminar**: Código de tenant management hardcodeado

## Fase 6: Slice de Tenants

**Estado**: pending
**Prioridad**: high
**Descripción**: Gestión de tenants y multi-tenancy

### Tareas

- [ ] Definir dominio Tenant
- [ ] Crear puertos para repository y gateway
- [ ] Implementar TenantService
- [ ] Crear adaptadores DB y controladores
- [ ] Sistema de creación de tenants (auto/manual)
- [ ] Integración con suscripciones mensuales
- [ ] **Eliminar**: Tenant management hardcodeado

## Fase 7: Slice de Billing/Subscriptions

**Estado**: pending
**Prioridad**: medium
**Descripción**: Suscripciones mensuales sin límites

### Tareas

- [ ] Definir dominio Subscription (mensual, sin límites)
- [ ] Implementar integración básica con pasarela de pagos (Stripe?)
- [ ] Sistema de renovación automática mensual
- [ ] Controladores para gestión de suscripciones
- [ ] Webhooks para eventos de pago
- [ ] **Eliminar**: Modelo de créditos anterior

## Fase 9: Slice de Notifications

**Estado**: completed
**Prioridad**: medium
**Descripción**: Sistema de comunicación con usuarios

### Tareas

- [x] Definir dominio Notification con tipos (email, push)
- [x] Implementar adaptadores para servicios de email
- [x] Sistema de templates y configuración por usuario
- [x] Queue para envío asíncrono
- [x] **Eliminar**: Envío de emails hardcodeado

## Fase 10: Slice de Audit/Logging

**Estado**: completed
**Prioridad**: medium
**Descripción**: Auditoría y compliance

### Tareas

- [x] Definir eventos de audit y schema DB
- [x] Implementar logging automático en todos los servicios
- [x] APIs para consulta de logs (filtrado por tenant/user)
- [x] Integración con herramientas de monitoring
- [x] **Eliminar**: Console.logs dispersos

## Fase 11: Slice de Settings

**Estado**: completed
**Prioridad**: low
**Descripción**: Configuraciones personalizables

### Tareas

- [x] Definir sistema de settings jerárquico (global/tenant/user)
- [x] Implementar cache para settings frecuentes
- [x] APIs para gestión de configuraciones
- [x] Validación de settings con schemas
- [x] **Eliminar**: Configuraciones hardcodeadas

## Fase 12: Multi-Tenancy Global

**Estado**: completed
**Prioridad**: medium
**Descripción**: Contexto de tenant automático

### Tareas

- [x] Crear TenantInterceptor global
- [x] Implementar ScopedRepository base para queries filtradas
- [x] Middleware para inyección de tenant en requests
- [x] Validación de acceso cross-tenant
- [x] **Eliminar**: Queries sin filtro de tenant

## Fase 13: Response Interceptors & Error Handling

**Estado**: completed
**Prioridad**: low
**Descripción**: Respuestas consistentes y errores globales

### Tareas

- [x] Implementar ResponseInterceptor para formato estándar
- [x] Crear GlobalExceptionFilter con logging
- [x] Estandarizar códigos de error y mensajes
- [x] **Eliminar**: Respuestas inconsistentes

## Fase 14: Testing Strategy

**Estado**: completed
**Prioridad**: medium
**Descripción**: Tests que validen arquitectura

### Tareas

- [x] Tests unitarios de entidades (lógica pura)
- [x] Tests de servicios con mocks de adaptadores
- [x] Tests E2E con DB real y GraphQL
- [x] Cobertura mínima del 80%
- [x] **Eliminar**: Código sin tests

## Fase 15: Documentación & DX

**Estado**: completed
**Prioridad**: low
**Descripción**: Documentación auto-explicativa

### Tareas

- [x] Crear README.md completo con arquitectura
- [x] Documentar patrones y prohibiciones
- [x] Guías de adding features y microservices
- [x] **Eliminar**: Documentación obsoleta

## Notas Generales

- **Estado Actual**: Fase 2 completada ✅, Fase 3 Auth en progreso 🔄
- **Modelo de Negocio**: Suscripciones mensuales (cambiado de anual por feedback)
- **Arquitectura Validada**: Sistema autoconsiente funcionando perfectamente
- **Próximos Pasos**: Completar Auth slice, implementar Tenants, luego Billing
- **Principio DRY**: Reutilizar patrones establecidos, no reinventar
- **Limpieza**: Código credit eliminado según principio fundamental
