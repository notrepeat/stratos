# PLAN MAESTRO: NESTJS SELF-AWARE TEMPLATE
## De `nest new` a Arquitectura de Élite

---

## 🚫 CONSTITUCIÓN DEL PROYECTO: LO PROHIBIDO

### ARTÍCULO I: Prohibiciones de Arquitectura

#### 1.1 PROHIBIDO: Acoplamiento Directo Entre Slices
```typescript
// ❌ NUNCA HACER ESTO
@Injectable()
export class BillingService {
  constructor(
    private readonly userService: UserService // VIOLACIÓN CRÍTICA
  ) {}
}

// ✅ HACER ESTO
@Injectable()
export class BillingService {
  constructor(
    @Inject('USER_GATEWAY') 
    private readonly userGateway: IUserGateway // Contrato, no implementación
  ) {}
}
```

**Consecuencia de Violación:** Imposibilidad de extraer módulos a microservicios sin refactor masivo.

**Regla de Oro:** Si necesitas datos de otro slice, SIEMPRE usa un Gateway (interfaz).

---

#### 1.2 PROHIBIDO: Buffering de Archivos en Memoria

```typescript
// ❌ NUNCA HACER ESTO
@Post('upload')
async uploadFile(@UploadedFile() file: Express.Multer.File) {
  const buffer = file.buffer; // TODO EL ARCHIVO EN RAM
  await this.s3.upload(buffer);
}

// ✅ HACER ESTO
@Post('upload')
async uploadFile(@Req() request: Request) {
  const stream = request; // Stream directo
  await this.storageGateway.pipeToS3(stream);
}
```

**Consecuencia de Violación:** 
- 1 archivo de 500MB = 500MB de RAM ocupada
- 10 uploads concurrentes = 5GB RAM = servidor muerto

**Regla de Oro:** Los archivos NUNCA tocan la RAM. Solo fluyen (streaming).

---

#### 1.3 PROHIBIDO: Inicio sin Validación de Infraestructura

```typescript
// ❌ NUNCA HACER ESTO
async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  await app.listen(3000); // Esperanza ciega
}

// ✅ HACER ESTO
async function bootstrap() {
  await validateEnvironment();
  await ensureDatabaseExists();
  await runMigrations();
  await syncSpiceDBSchema();
  await testS3Connection();
  
  const app = await NestFactory.create(AppModule);
  await app.listen(3000);
}
```

**Consecuencia de Violación:** El servidor arranca pero las requests fallan silenciosamente.

**Regla de Oro:** El sistema NO arranca si la infraestructura no está 100% operativa.

---

#### 1.4 PROHIBIDO: Acceso Directo del Cliente a Infraestructura

```typescript
// ❌ NUNCA HACER ESTO
// Frontend obtiene presigned URL y sube directamente a S3
const presignedUrl = await getPresignedUrl();
await fetch(presignedUrl, { method: 'PUT', body: file });

// ✅ HACER ESTO
// Frontend SIEMPRE pasa por el backend
const formData = new FormData();
formData.append('file', file);
await fetch('/api/storage/upload', { 
  method: 'POST', 
  body: formData 
});
```

**Consecuencia de Violación:** 
- Imposibilidad de validar permisos en tiempo real
- Bypass de políticas de negocio
- Costos de S3 incontrolables

**Regla de Oro:** El backend es el ÚNICO que habla con infraestructura externa.

---

#### 1.5 PROHIBIDO: Lógica de Permisos Hardcodeada

```typescript
// ❌ NUNCA HACER ESTO
@Get('courses/:id')
async getCourse(@Param('id') id: string, @User() user: User) {
  if (user.role !== 'admin' && user.role !== 'teacher') {
    throw new ForbiddenException();
  }
}

// ✅ HACER ESTO
@Get('courses/:id')
@CheckPermission('course', 'view') // Decorator que consulta SpiceDB
async getCourse(@Param('id') id: string) {
  // La lógica de permisos está en SpiceDB, no en código
}
```

**Consecuencia de Violación:** 
- Cambiar un permiso = redeploy completo
- Lógica de permisos esparcida por toda la app
- Imposibilidad de auditar quién puede hacer qué

**Regla de Oro:** Los permisos son DATA en SpiceDB, no CÓDIGO en controladores.

---

### ARTÍCULO II: Prohibiciones de Desarrollo

#### 2.1 PROHIBIDO: Variables de Entorno sin Validación

```typescript
// ❌ NUNCA HACER ESTO
const dbUrl = process.env.DATABASE_URL;
// ¿Y si es undefined? ¿Y si tiene formato incorrecto?

// ✅ HACER ESTO
import { z } from 'zod';

const envSchema = z.object({
  DATABASE_URL: z.string().url(),
  AWS_ACCESS_KEY: z.string().min(16),
  SPICEDB_ENDPOINT: z.string().url(),
  PORT: z.coerce.number().default(3000),
});

export const env = envSchema.parse(process.env);
```

**Regla de Oro:** Si una variable no está validada con Zod, NO existe.

---

#### 2.2 PROHIBIDO: Migraciones Manuales

```bash
# ❌ NUNCA HACER ESTO
# "Recuerda correr las migraciones antes de deployar"
npm run migrate

# ✅ HACER ESTO
# El sistema corre migraciones automáticamente en bootstrap
# Si fallan, el servidor NO arranca
```

**Regla de Oro:** Las migraciones son parte del proceso de arranque, no un paso manual.

---

#### 2.3 PROHIBIDO: Logs sin Contexto

```typescript
// ❌ NUNCA HACER ESTO
console.log('Error uploading file');

// ✅ HACER ESTO
this.logger.error('Storage upload failed', {
  tenantId: context.tenantId,
  userId: context.userId,
  fileName: file.originalName,
  fileSize: file.size,
  error: error.message,
  stack: error.stack,
});
```

**Regla de Oro:** Todo log incluye: tenantId, userId, operación, timestamp.

---

## 🎯 OBJETIVOS FINALES: LA PLANTILLA DEFINITIVA

### 1. Self-Awareness (Autoconsciencia)
El sistema conoce el estado de su infraestructura en todo momento:

```typescript
// Al iniciar
✅ Postgres accessible
✅ Database 'saas_prod' exists
✅ Migrations synced (version: 20240115_001)
✅ SpiceDB schema hash: abc123 (match)
✅ S3 bucket 'prod-storage' writable
🚀 Server ready on port 3000

// Si algo falla
❌ Cannot connect to SpiceDB at localhost:50051
💀 Bootstrap aborted
```

### 2. Transport Agnostic (Agnóstico de Transporte)
La lógica de negocio NO sabe si es HTTP, GraphQL o gRPC:

```
Client Request (HTTP/GraphQL/gRPC)
         ↓
    Controller/Resolver (Transport Layer)
         ↓
    Service (Core Logic) ← NO SABE DE HTTP
         ↓
    Gateway (Interface)
         ↓
    Adapter (Implementation)
```

### 3. Zero-Config Multi-Tenancy
```typescript
// Cada request conoce su tenant automáticamente
@Get('courses')
async getCourses(@TenantContext() tenant: TenantInfo) {
  // tenant.id, tenant.subscription, tenant.limits
  return this.courseService.findAll(tenant.id);
}
```

### 4. Streaming-First Storage
```typescript
// 10GB de video = 50MB RAM usage
await this.storageGateway.upload({
  stream: request, // Pipe directo
  path: 'courses/video-123.mp4',
  onProgress: (bytes) => ws.send({ uploaded: bytes }),
});
```

### 5. Permission-as-Code con SpiceDB
```yaml
# schema.zed
definition course {
  relation owner: user
  relation org: organization
  
  permission view = owner + org->member
  permission edit = owner + org->admin
  permission delete = owner
}
```

---

## 📋 PLANIFICACIÓN FASE POR FASE

## FASE 0: Preparación del Terreno (Día 1)

### Objetivo
Proyecto NestJS limpio con tooling profesional.

### Tareas

#### 1. Inicializar Proyecto
```bash
nest new saas-template
cd saas-template
```

#### 2. Instalar Dependencias Críticas
```bash
# Core
pnpm add zod @nestjs/config

# Database
pnpm add drizzle-orm pg
pnpm add -D drizzle-kit @types/pg

# Auth & Permissions
pnpm add @authzed/authzed-node

# Storage
pnpm add @aws-sdk/client-s3 busboy
pnpm add -D @types/busboy

# Utilities
pnpm add nanoid ulid
```

#### 3. Estructura de Carpetas
```
src/
├── main.ts                    # Bootstrap orchestrator
├── app.module.ts
├── core/
│   ├── config/
│   │   ├── env.validation.ts  # Zod schemas
│   │   └── env.config.ts
│   ├── infrastructure/
│   │   ├── database/
│   │   │   ├── database.module.ts
│   │   │   ├── drizzle.provider.ts
│   │   │   └── migrations/
│   │   ├── permissions/
│   │   │   ├── spicedb.module.ts
│   │   │   ├── spicedb.provider.ts
│   │   │   └── schemas/
│   │   │       └── schema.zed
│   │   └── storage/
│   │       ├── storage.module.ts
│   │       └── s3.provider.ts
│   └── shared/
│       ├── decorators/
│       ├── guards/
│       ├── interceptors/
│       └── pipes/
└── modules/
    └── (aquí irán los slices)
```

#### 4. Configurar TypeScript Strict
```json
// tsconfig.json
{
  "compilerOptions": {
    "strict": true,
    "strictNullChecks": true,
    "noImplicitAny": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noImplicitReturns": true
  }
}
```

**Entregable:** Proyecto con estructura base y dependencias instaladas.

---

## FASE 1: Self-Awareness Layer (Días 2-4)

### Objetivo
El sistema valida su entorno antes de arrancar.

### 1.1 Validación de Variables de Entorno

**Archivo:** `src/core/config/env.validation.ts`
```typescript
import { z } from 'zod';

const envSchema = z.object({
  // Server
  NODE_ENV: z.enum(['development', 'production', 'test']),
  PORT: z.coerce.number().default(3000),
  
  // Database
  DB_HOST: z.string(),
  DB_PORT: z.coerce.number().default(5432),
  DB_USER: z.string(),
  DB_PASSWORD: z.string(),
  DB_NAME: z.string(),
  DB_ROOT_USER: z.string().default('postgres'),
  DB_ROOT_PASSWORD: z.string(),
  
  // SpiceDB
  SPICEDB_ENDPOINT: z.string().url(),
  SPICEDB_TOKEN: z.string().optional(),
  
  // AWS S3
  AWS_REGION: z.string().default('us-east-1'),
  AWS_ACCESS_KEY_ID: z.string().min(16),
  AWS_SECRET_ACCESS_KEY: z.string().min(40),
  AWS_S3_BUCKET: z.string(),
  
  // Sessions (tokens opacos en DB)
  SESSION_DURATION_HOURS: z.coerce.number().default(168), // 7 días
});

export type Env = z.infer<typeof envSchema>;

export function validateEnv(): Env {
  try {
    return envSchema.parse(process.env);
  } catch (error) {
    if (error instanceof z.ZodError) {
      const missing = error.errors.map(e => e.path.join('.')).join(', ');
      throw new Error(`❌ Environment validation failed. Missing/invalid: ${missing}`);
    }
    throw error;
  }
}
```

**Archivo:** `src/core/config/env.config.ts`
```typescript
import { validateEnv } from './env.validation';

export const env = validateEnv();
```

### 1.2 Autoprovisionamiento de Base de Datos

**Archivo:** `src/core/infrastructure/database/provisioner.ts`
```typescript
import { Client } from 'pg';
import { env } from '../../config/env.config';

export async function ensureDatabaseExists(): Promise<void> {
  const rootClient = new Client({
    host: env.DB_HOST,
    port: env.DB_PORT,
    user: env.DB_ROOT_USER,
    password: env.DB_ROOT_PASSWORD,
    database: 'postgres', // Connect to default DB
  });

  try {
    await rootClient.connect();
    
    // Check if database exists
    const result = await rootClient.query(
      `SELECT 1 FROM pg_database WHERE datname = $1`,
      [env.DB_NAME]
    );

    if (result.rowCount === 0) {
      console.log(`📦 Creating database: ${env.DB_NAME}`);
      await rootClient.query(`CREATE DATABASE "${env.DB_NAME}"`);
      console.log(`✅ Database created successfully`);
    } else {
      console.log(`✅ Database ${env.DB_NAME} already exists`);
    }
  } catch (error) {
    console.error('❌ Database provisioning failed:', error);
    throw error;
  } finally {
    await rootClient.end();
  }
}
```

### 1.3 Sistema de Migraciones Automático

**Archivo:** `src/core/infrastructure/database/migrator.ts`
```typescript
import { drizzle } from 'drizzle-orm/node-postgres';
import { migrate } from 'drizzle-orm/node-postgres/migrator';
import { Pool } from 'pg';
import { env } from '../../config/env.config';

export async function runMigrations(): Promise<void> {
  const pool = new Pool({
    host: env.DB_HOST,
    port: env.DB_PORT,
    user: env.DB_USER,
    password: env.DB_PASSWORD,
    database: env.DB_NAME,
  });

  const db = drizzle(pool);

  try {
    console.log('🔄 Running database migrations...');
    await migrate(db, { migrationsFolder: './drizzle/migrations' });
    console.log('✅ Migrations completed successfully');
  } catch (error) {
    console.error('❌ Migration failed:', error);
    throw error;
  } finally {
    await pool.end();
  }
}
```

### 1.4 Validación de SpiceDB

**Archivo:** `src/core/infrastructure/permissions/validator.ts`
```typescript
import { v1 } from '@authzed/authzed-node';
import { readFileSync } from 'fs';
import { createHash } from 'crypto';
import { env } from '../../config/env.config';

export async function syncSpiceDBSchema(): Promise<void> {
  const client = v1.NewClient(
    env.SPICEDB_TOKEN || '',
    env.SPICEDB_ENDPOINT,
  );

  try {
    // Read local schema
    const localSchema = readFileSync(
      './src/core/infrastructure/permissions/schemas/schema.zed',
      'utf-8'
    );
    const localHash = createHash('sha256').update(localSchema).digest('hex');

    console.log('🔄 Checking SpiceDB schema...');

    // Read remote schema
    const response = await client.schemaService.readSchema({});
    const remoteHash = createHash('sha256')
      .update(response.schemaText)
      .digest('hex');

    if (localHash !== remoteHash) {
      console.log('📝 Schema mismatch. Updating SpiceDB...');
      await client.schemaService.writeSchema({
        schema: localSchema,
      });
      console.log('✅ SpiceDB schema updated');
    } else {
      console.log('✅ SpiceDB schema is up to date');
    }
  } catch (error) {
    console.error('❌ SpiceDB validation failed:', error);
    throw error;
  }
}
```

### 1.5 Validación de S3

**Archivo:** `src/core/infrastructure/storage/validator.ts`
```typescript
import { S3Client, HeadBucketCommand, PutObjectCommand } from '@aws-sdk/client-s3';
import { env } from '../../config/env.config';

export async function testS3Connection(): Promise<void> {
  const client = new S3Client({
    region: env.AWS_REGION,
    credentials: {
      accessKeyId: env.AWS_ACCESS_KEY_ID,
      secretAccessKey: env.AWS_SECRET_ACCESS_KEY,
    },
  });

  try {
    console.log('🔄 Testing S3 connection...');

    // Check if bucket exists
    await client.send(new HeadBucketCommand({ 
      Bucket: env.AWS_S3_BUCKET 
    }));

    // Try to write a test file
    const testKey = `.health-check/${Date.now()}`;
    await client.send(new PutObjectCommand({
      Bucket: env.AWS_S3_BUCKET,
      Key: testKey,
      Body: 'health-check',
    }));

    console.log(`✅ S3 bucket '${env.AWS_S3_BUCKET}' is accessible`);
  } catch (error) {
    console.error('❌ S3 connection failed:', error);
    throw error;
  }
}
```

### 1.6 Orquestador Principal

**Archivo:** `src/main.ts`
```typescript
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { env } from './core/config/env.config';
import { ensureDatabaseExists } from './core/infrastructure/database/provisioner';
import { runMigrations } from './core/infrastructure/database/migrator';
import { syncSpiceDBSchema } from './core/infrastructure/permissions/validator';
import { testS3Connection } from './core/infrastructure/storage/validator';

async function bootstrap() {
  console.log('🚀 Starting bootstrap sequence...\n');

  try {
    // Phase 1: Environment
    console.log('📋 Phase 1: Environment Validation');
    console.log(`   NODE_ENV: ${env.NODE_ENV}`);
    console.log(`   PORT: ${env.PORT}`);
    console.log('   ✅ Environment validated\n');

    // Phase 2: Database
    console.log('📋 Phase 2: Database Provisioning');
    await ensureDatabaseExists();
    await runMigrations();
    console.log('   ✅ Database ready\n');

    // Phase 3: Permissions
    console.log('📋 Phase 3: Permission System');
    await syncSpiceDBSchema();
    console.log('   ✅ SpiceDB ready\n');

    // Phase 4: Storage
    console.log('📋 Phase 4: Storage System');
    await testS3Connection();
    console.log('   ✅ S3 ready\n');

    // Phase 5: Start Server
    console.log('📋 Phase 5: Starting NestJS Application');
    const app = await NestFactory.create(AppModule);
    
    app.enableCors();
    app.setGlobalPrefix('api');

    await app.listen(env.PORT);
    
    console.log('\n🎉 ================================');
    console.log(`🎉 Server is running on port ${env.PORT}`);
    console.log('🎉 All systems operational');
    console.log('🎉 ================================\n');

  } catch (error) {
    console.error('\n💀 ================================');
    console.error('💀 BOOTSTRAP FAILED');
    console.error('💀 ================================\n');
    console.error(error);
    process.exit(1);
  }
}

bootstrap();
```

**Entregable:** Sistema que valida infraestructura completa antes de arrancar.

---

## FASE 2: Arquitectura Hexagonal Base (Días 5-7)

### Objetivo
Implementar el primer slice siguiendo arquitectura hexagonal.

### 2.1 Estructura de un Slice

```
src/modules/users/
├── api/                    # Transport Layer
│   ├── controllers/
│   │   └── users.controller.ts
│   └── dto/
│       ├── create-user.dto.ts
│       └── update-user.dto.ts
├── core/                   # Business Logic
│   ├── domain/
│   │   ├── user.entity.ts
│   │   └── user.types.ts
│   ├── ports/              # Interfaces (contratos)
│   │   ├── user.repository.port.ts
│   │   └── email.service.port.ts
│   └── services/
│       └── user.service.ts
├── infrastructure/         # Adapters (implementaciones)
│   ├── adapters/
│   │   ├── user.repository.adapter.ts
│   │   └── email.service.adapter.ts
│   └── database/
│       └── user.schema.ts
└── users.module.ts
```

### 2.2 Definir el Dominio

**Archivo:** `src/modules/users/core/domain/user.entity.ts`
```typescript
export class User {
  id: string;
  email: string;
  name: string;
  tenantId: string;
  createdAt: Date;
  updatedAt: Date;

  constructor(data: User) {
    Object.assign(this, data);
  }

  // Business logic here, NOT in service
  canAccessTenant(tenantId: string): boolean {
    return this.tenantId === tenantId;
  }

  updateProfile(name: string): void {
    this.name = name;
    this.updatedAt = new Date();
  }
}
```

### 2.3 Definir los Puertos (Interfaces)

**Archivo:** `src/modules/users/core/ports/user.repository.port.ts`
```typescript
import { User } from '../domain/user.entity';

export interface IUserRepository {
  create(data: CreateUserData): Promise<User>;
  findById(id: string): Promise<User | null>;
  findByEmail(email: string): Promise<User | null>;
  update(id: string, data: Partial<User>): Promise<User>;
  delete(id: string): Promise<void>;
}

export const USER_REPOSITORY = Symbol('USER_REPOSITORY');

export interface CreateUserData {
  email: string;
  name: string;
  tenantId: string;
}
```

### 2.4 Implementar el Servicio (Core)

**Archivo:** `src/modules/users/core/services/user.service.ts`
```typescript
import { Inject, Injectable } from '@nestjs/common';
import { USER_REPOSITORY, IUserRepository } from '../ports/user.repository.port';
import { User } from '../domain/user.entity';

@Injectable()
export class UserService {
  constructor(
    @Inject(USER_REPOSITORY)
    private readonly repository: IUserRepository,
  ) {}

  async createUser(data: { email: string; name: string; tenantId: string }): Promise<User> {
    // Business validation
    const existing = await this.repository.findByEmail(data.email);
    if (existing) {
      throw new Error('Email already exists');
    }

    return this.repository.create(data);
  }

  async getUserById(id: string): Promise<User> {
    const user = await this.repository.findById(id);
    if (!user) {
      throw new Error('User not found');
    }
    return user;
  }

  // ... more methods
}
```

### 2.5 Implementar el Adaptador (Infraestructura)

**Archivo:** `src/modules/users/infrastructure/database/user.schema.ts`
```typescript
import { pgTable, varchar, timestamp } from 'drizzle-orm/pg-core';

export const users = pgTable('users', {
  id: varchar('id', { length: 26 }).primaryKey(),
  email: varchar('email', { length: 255 }).notNull().unique(),
  name: varchar('name', { length: 255 }).notNull(),
  tenantId: varchar('tenant_id', { length: 26 }).notNull(),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});
```

**Archivo:** `src/modules/users/infrastructure/adapters/user.repository.adapter.ts`
```typescript
import { Injectable, Inject } from '@nestjs/common';
import { NodePgDatabase } from 'drizzle-orm/node-postgres';
import { eq } from 'drizzle-orm';
import { ulid } from 'ulid';
import { IUserRepository, CreateUserData } from '../../core/ports/user.repository.port';
import { User } from '../../core/domain/user.entity';
import { users } from '../database/user.schema';

@Injectable()
export class UserRepositoryAdapter implements IUserRepository {
  constructor(
    @Inject('DRIZZLE_DB')
    private readonly db: NodePgDatabase,
  ) {}

  async create(data: CreateUserData): Promise<User> {
    const id = ulid();
    const now = new Date();

    const [inserted] = await this.db.insert(users).values({
      id,
      email: data.email,
      name: data.name,
      tenantId: data.tenantId,
      createdAt: now,
      updatedAt: now,
    }).returning();

    return new User(inserted);
  }

  async findById(id: string): Promise<User | null> {
    const [row] = await this.db
      .select()
      .from(users)
      .where(eq(users.id, id));

    return row ? new User(row) : null;
  }

  async findByEmail(email: string): Promise<User | null> {
    const [row] = await this.db
      .select()
      .from(users)
      .where(eq(users.email, email));

    return row ? new User(row) : null;
  }

  async update(id: string, data: Partial<User>): Promise<User> {
    const [updated] = await this.db
      .update(users)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(users.id, id))
      .returning();

    return new User(updated);
  }

  async delete(id: string): Promise<void> {
    await this.db.delete(users).where(eq(users.id, id));
  }
}
```

### 2.6 Wire Everything (Module)

**Archivo:** `src/modules/users/users.module.ts`
```typescript
import { Module } from '@nestjs/common';
import { UserService } from './core/services/user.service';
import { UserRepositoryAdapter } from './infrastructure/adapters/user.repository.adapter';
import { USER_REPOSITORY } from './core/ports/user.repository.port';
import { UsersController } from './api/controllers/users.controller';
import { DatabaseModule } from '../../core/infrastructure/database/database.module';

@Module({
  imports: [DatabaseModule],
  controllers: [UsersController],
  providers: [
    UserService,
    {
      provide: USER_REPOSITORY,
      useClass: UserRepositoryAdapter, // Aquí decides qué implementación usar
    },
  ],
  exports: [UserService],
})
export class UsersModule {}
```

**LA MAGIA:** Si mañana quieres usar MongoDB en lugar de Postgres, solo creas `UserRepositoryMongoAdapter` y cambias el `useClass`. El `UserService` NO cambia ni una línea.

**Entregable:** Primer slice funcional con arquitectura hexagonal completa.

---

## FASE 3: Gateways para Comunicación Entre Slices (Días 8-10)

### Objetivo
Permitir que slices se comuniquen sin acoplarse.

### 3.1 Definir el Gateway (Contrato)

**Archivo:** `src/modules/users/core/ports/user.gateway.port.ts`
```typescript
// Este es el CONTRATO que otros slices verán
export interface IUserGateway {
  getUserCredit(userId: string): Promise<number>;
  getUserEmail(userId: string): Promise<string>;
  decrementCredit(userId: string, amount: number): Promise<void>;
}

export const USER_GATEWAY = Symbol('USER_GATEWAY');
```

### 3.2 Implementar Adaptador Local (Monolito)

**Archivo:** `src/modules/users/infrastructure/adapters/user-gateway.local.adapter.ts`
```typescript
import { Injectable } from '@nestjs/common';
import { IUserGateway } from '../../core/ports/user.gateway.port';
import { UserService } from '../../core/services/user.service';

@Injectable()
export class UserGatewayLocalAdapter implements IUserGateway {
  constructor(
    private readonly userService: UserService, // ✅ ÚNICA EXCEPCIÓN: dentro del mismo slice
  ) {}

  async getUserEmail(userId: string): Promise<string> {
    const user = await this.userService.getUserById(userId);
    return user.email;
  }
}
```

### 3.3 Exportar el Gateway desde el Módulo

**Archivo:** `src/modules/users/users.module.ts`
```typescript
import { Module } from '@nestjs/common';
import { UserService } from './core/services/user.service';
import { UserRepositoryAdapter } from './infrastructure/adapters/user.repository.adapter';
import { UserGatewayLocalAdapter } from './infrastructure/adapters/user-gateway.local.adapter';
import { USER_REPOSITORY } from './core/ports/user.repository.port';
import { USER_GATEWAY } from './core/ports/user.gateway.port';
import { UsersController } from './api/controllers/users.controller';
import { DatabaseModule } from '../../core/infrastructure/database/database.module';

@Module({
  imports: [DatabaseModule],
  controllers: [UsersController],
  providers: [
    UserService,
    {
      provide: USER_REPOSITORY,
      useClass: UserRepositoryAdapter,
    },
    {
      provide: USER_GATEWAY,
      useClass: UserGatewayLocalAdapter, // Hoy local, mañana gRPC
    },
  ],
  exports: [
    USER_GATEWAY, // ✅ Exportamos el GATEWAY, NO el Service
  ],
})
export class UsersModule {}
```

### 3.4 Usar el Gateway en Otro Slice

**Archivo:** `src/modules/billing/core/services/billing.service.ts`
```typescript
import { Injectable, Inject } from '@nestjs/common';
import { USER_GATEWAY, IUserGateway } from '../../../users/core/ports/user.gateway.port';

@Injectable()
export class BillingService {
  constructor(
    @Inject(USER_GATEWAY)
    private readonly userGateway: IUserGateway, // ✅ Solo conoce la interfaz
  ) {}

  async chargeSubscription(userId: string, planId: string): Promise<void> {
    // TODO: Implementar lógica de suscripción mensual
    // Validar plan activo, procesar pago, etc.
    console.log(`Processing monthly subscription for user ${userId}, plan ${planId}`);
  }
}
```

**Archivo:** `src/modules/billing/billing.module.ts`
```typescript
import { Module } from '@nestjs/common';
import { BillingService } from './core/services/billing.service';
import { BillingController } from './api/controllers/billing.controller';
import { UsersModule } from '../users/users.module';

@Module({
  imports: [
    UsersModule, // ✅ Importa el módulo completo
  ],
  controllers: [BillingController],
  providers: [BillingService],
  exports: [BillingService],
})
export class BillingModule {}
```

### 3.5 Preparar para Microservicios (Adaptador Remoto)

**Archivo:** `src/modules/users/infrastructure/adapters/user-gateway.grpc.adapter.ts`
```typescript
import { Injectable } from '@nestjs/common';
import { IUserGateway } from '../../core/ports/user.gateway.port';

@Injectable()
export class UserGatewayGrpcAdapter implements IUserGateway {
  // Este adaptador usaría @grpc/grpc-js para llamar al microservicio

  async getUserCredit(userId: string): Promise<number> {
    // const response = await this.grpcClient.getUserCredit({ userId });

    throw new Error('Not implemented yet');
  }

  async getUserEmail(userId: string): Promise<string> {
    throw new Error('Not implemented yet');
  }

  async decrementCredit(userId: string, amount: number): Promise<void> {
    throw new Error('Not implemented yet');
  }
}
```

**Para migrar a microservicios:**
```typescript
// Solo cambias esto en users.module.ts:
{
  provide: USER_GATEWAY,
  useClass: UserGatewayGrpcAdapter, // ← Solo este cambio
}
```

**Entregable:** Sistema de comunicación entre slices sin acoplamiento.

---

## FASE 4: Storage Gateway con Streaming (Días 11-14)

### Objetivo
Sistema de almacenamiento que maneja archivos de cualquier tamaño sin usar RAM.

### 4.1 Definir el Puerto del Storage

**Archivo:** `src/core/infrastructure/storage/ports/storage.port.ts`
```typescript
import { Readable } from 'stream';

export interface UploadOptions {
  stream: Readable;
  path: string;
  mimeType?: string;
  tenantId: string;
  userId: string;
  onProgress?: (bytes: number) => void;
}

export interface DownloadOptions {
  path: string;
  tenantId: string;
  userId: string;
}

export interface IStorageGateway {
  upload(options: UploadOptions): Promise<UploadResult>;
  download(options: DownloadOptions): Promise<Readable>;
  delete(path: string, tenantId: string): Promise<void>;
  getMetadata(path: string, tenantId: string): Promise<FileMetadata>;
}

export const STORAGE_GATEWAY = Symbol('STORAGE_GATEWAY');

export interface UploadResult {
  path: string;
  size: number;
  uploadedAt: Date;
}

export interface FileMetadata {
  size: number;
  mimeType: string;
  uploadedAt: Date;
}
```

### 4.2 Implementar Adaptador S3 con Streaming

**Archivo:** `src/core/infrastructure/storage/adapters/s3-storage.adapter.ts`
```typescript
import { Injectable } from '@nestjs/common';
import { S3Client, PutObjectCommand, GetObjectCommand, DeleteObjectCommand, HeadObjectCommand } from '@aws-sdk/client-s3';
import { Upload } from '@aws-sdk/lib-storage';
import { Readable } from 'stream';
import { env } from '../../../config/env.config';
import { IStorageGateway, UploadOptions, DownloadOptions, UploadResult, FileMetadata } from '../ports/storage.port';

@Injectable()
export class S3StorageAdapter implements IStorageGateway {
  private readonly client: S3Client;

  constructor() {
    this.client = new S3Client({
      region: env.AWS_REGION,
      credentials: {
        accessKeyId: env.AWS_ACCESS_KEY_ID,
        secretAccessKey: env.AWS_SECRET_ACCESS_KEY,
      },
    });
  }

  async upload(options: UploadOptions): Promise<UploadResult> {
    const { stream, path, mimeType, tenantId, onProgress } = options;

    // Construir key con tenant isolation
    const key = `${tenantId}/${path}`;

    // Upload con streaming (NO buffering)
    const upload = new Upload({
      client: this.client,
      params: {
        Bucket: env.AWS_S3_BUCKET,
        Key: key,
        Body: stream,
        ContentType: mimeType,
      },
    });

    // Track progress
    let uploadedBytes = 0;
    upload.on('httpUploadProgress', (progress) => {
      if (progress.loaded) {
        uploadedBytes = progress.loaded;
        onProgress?.(uploadedBytes);
      }
    });

    await upload.done();

    return {
      path: key,
      size: uploadedBytes,
      uploadedAt: new Date(),
    };
  }

  async download(options: DownloadOptions): Promise<Readable> {
    const { path, tenantId } = options;
    const key = `${tenantId}/${path}`;

    const command = new GetObjectCommand({
      Bucket: env.AWS_S3_BUCKET,
      Key: key,
    });

    const response = await this.client.send(command);
    
    if (!response.Body) {
      throw new Error('Empty response from S3');
    }

    // Return stream directly (NO buffering)
    return response.Body as Readable;
  }

  async delete(path: string, tenantId: string): Promise<void> {
    const key = `${tenantId}/${path}`;

    const command = new DeleteObjectCommand({
      Bucket: env.AWS_S3_BUCKET,
      Key: key,
    });

    await this.client.send(command);
  }

  async getMetadata(path: string, tenantId: string): Promise<FileMetadata> {
    const key = `${tenantId}/${path}`;

    const command = new HeadObjectCommand({
      Bucket: env.AWS_S3_BUCKET,
      Key: key,
    });

    const response = await this.client.send(command);

    return {
      size: response.ContentLength || 0,
      mimeType: response.ContentType || 'application/octet-stream',
      uploadedAt: response.LastModified || new Date(),
    };
  }
}
```

### 4.3 Controlador de Upload con Streaming

**Archivo:** `src/modules/storage/api/controllers/storage.controller.ts`
```typescript
import { Controller, Post, Get, Delete, Param, Req, Res, UseGuards, StreamableFile } from '@nestjs/common';
import { Request, Response } from 'express';
import Busboy from 'busboy';
import { Inject } from '@nestjs/common';
import { STORAGE_GATEWAY, IStorageGateway } from '../../../../core/infrastructure/storage/ports/storage.port';
import { TenantContext } from '../../../../core/shared/decorators/tenant-context.decorator';
import { CurrentUser } from '../../../../core/shared/decorators/current-user.decorator';

@Controller('storage')
export class StorageController {
  constructor(
    @Inject(STORAGE_GATEWAY)
    private readonly storageGateway: IStorageGateway,
  ) {}

  @Post('upload')
  async upload(
    @Req() request: Request,
    @Res() response: Response,
    @TenantContext() tenantId: string,
    @CurrentUser() userId: string,
  ): Promise<void> {
    const busboy = Busboy({ headers: request.headers });

    let uploadResult: any;

    // CRÍTICO: Este código NO bufferea el archivo
    busboy.on('file', async (fieldname, file, info) => {
      const { filename, mimeType } = info;

      try {
        // El stream 'file' va DIRECTO a S3
        uploadResult = await this.storageGateway.upload({
          stream: file, // ← Stream directo, NO Buffer
          path: `uploads/${Date.now()}-${filename}`,
          mimeType,
          tenantId,
          userId,
          onProgress: (bytes) => {
            // Opcional: enviar progreso via WebSocket
            console.log(`Uploaded ${bytes} bytes`);
          },
        });

        response.status(200).json(uploadResult);
      } catch (error) {
        response.status(500).json({ error: error.message });
      }
    });

    busboy.on('error', (error) => {
      response.status(500).json({ error: error.message });
    });

    // Pipe request → busboy (streaming)
    request.pipe(busboy);
  }

  @Get('download/:path(*)')
  async download(
    @Param('path') path: string,
    @Res({ passthrough: true }) response: Response,
    @TenantContext() tenantId: string,
    @CurrentUser() userId: string,
  ): Promise<StreamableFile> {
    // Verificar permisos en SpiceDB aquí...

    const stream = await this.storageGateway.download({
      path,
      tenantId,
      userId,
    });

    const metadata = await this.storageGateway.getMetadata(path, tenantId);

    response.set({
      'Content-Type': metadata.mimeType,
      'Content-Length': metadata.size,
    });

    // Stream directo al cliente (NO buffering)
    return new StreamableFile(stream);
  }

  @Delete(':path(*)')
  async delete(
    @Param('path') path: string,
    @TenantContext() tenantId: string,
  ): Promise<void> {
    // Verificar permisos...
    await this.storageGateway.delete(path, tenantId);
  }
}
```

### 4.4 Resultado: Arquitectura de Streaming Completa

```
Cliente (10GB video)
    ↓ Stream HTTP
Backend (50MB RAM)
    ↓ Pipe con Busboy
Storage Gateway
    ↓ AWS SDK Upload (streaming)
S3 Bucket
```

**PROHIBIDO:**
```typescript
// ❌ NUNCA HACER ESTO
const buffer = await file.arrayBuffer();
await s3.upload(Buffer.from(buffer));
```

**PERMITIDO:**
```typescript
// ✅ SIEMPRE HACER ESTO
await storageGateway.upload({ stream: fileStream });
```

**Entregable:** Sistema de almacenamiento con streaming real, sin límites de tamaño.

---

## FASE 5: Sistema de Autenticación con Tokens Opacos (Días 15-17)

### Objetivo
Auth basado en sesiones en base de datos (tokens opacos, no JWT).

### 5.1 Schema de Sesiones

**Archivo:** `src/modules/auth/infrastructure/database/session.schema.ts`
```typescript
import { pgTable, varchar, timestamp, boolean } from 'drizzle-orm/pg-core';

export const sessions = pgTable('sessions', {
  id: varchar('id', { length: 26 }).primaryKey(), // ULID
  userId: varchar('user_id', { length: 26 }).notNull(),
  tenantId: varchar('tenant_id', { length: 26 }).notNull(),
  token: varchar('token', { length: 64 }).notNull().unique(), // Token opaco
  ipAddress: varchar('ip_address', { length: 45 }),
  userAgent: varchar('user_agent', { length: 500 }),
  expiresAt: timestamp('expires_at').notNull(),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  isRevoked: boolean('is_revoked').notNull().default(false),
});

// Índices
export const sessionIndexes = {
  tokenIndex: 'idx_sessions_token',
  userIdIndex: 'idx_sessions_user_id',
  expiresAtIndex: 'idx_sessions_expires_at',
};
```

### 5.2 Servicio de Sesiones

**Archivo:** `src/modules/auth/core/services/session.service.ts`
```typescript
import { Injectable, Inject } from '@nestjs/common';
import { NodePgDatabase } from 'drizzle-orm/node-postgres';
import { eq, and, gt } from 'drizzle-orm';
import { ulid } from 'ulid';
import { randomBytes } from 'crypto';
import { sessions } from '../../infrastructure/database/session.schema';
import { env } from '../../../../core/config/env.config';

@Injectable()
export class SessionService {
  constructor(
    @Inject('DRIZZLE_DB')
    private readonly db: NodePgDatabase,
  ) {}

  async createSession(data: {
    userId: string;
    tenantId: string;
    ipAddress?: string;
    userAgent?: string;
  }): Promise<string> {
    const sessionId = ulid();
    
    // Token opaco aleatorio (64 caracteres hex = 32 bytes)
    const token = randomBytes(32).toString('hex');
    
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + env.SESSION_DURATION_HOURS);

    await this.db.insert(sessions).values({
      id: sessionId,
      userId: data.userId,
      tenantId: data.tenantId,
      token,
      ipAddress: data.ipAddress,
      userAgent: data.userAgent,
      expiresAt,
      isRevoked: false,
    });

    return token; // Este token se envía al cliente
  }

  async validateSession(token: string): Promise<{
    userId: string;
    tenantId: string;
  } | null> {
    const [session] = await this.db
      .select()
      .from(sessions)
      .where(
        and(
          eq(sessions.token, token),
          eq(sessions.isRevoked, false),
          gt(sessions.expiresAt, new Date()),
        ),
      );

    if (!session) {
      return null;
    }

    return {
      userId: session.userId,
      tenantId: session.tenantId,
    };
  }

  async revokeSession(token: string): Promise<void> {
    await this.db
      .update(sessions)
      .set({ isRevoked: true })
      .where(eq(sessions.token, token));
  }

  async revokeAllUserSessions(userId: string): Promise<void> {
    await this.db
      .update(sessions)
      .set({ isRevoked: true })
      .where(eq(sessions.userId, userId));
  }

  async cleanupExpiredSessions(): Promise<void> {
    // Llamar esto desde un cron job
    await this.db
      .delete(sessions)
      .where(gt(new Date(), sessions.expiresAt));
  }
}
```

### 5.3 Guard de Autenticación

**Archivo:** `src/core/shared/guards/auth.guard.ts`
```typescript
import { Injectable, CanActivate, ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { SessionService } from '../../../modules/auth/core/services/session.service';

@Injectable()
export class AuthGuard implements CanActivate {
  constructor(private readonly sessionService: SessionService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    
    // Extraer token del header Authorization
    const authHeader = request.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new UnauthorizedException('Missing token');
    }

    const token = authHeader.substring(7);

    // Validar sesión en DB
    const session = await this.sessionService.validateSession(token);
    if (!session) {
      throw new UnauthorizedException('Invalid or expired token');
    }

    // Inyectar datos en request
    request.user = {
      userId: session.userId,
      tenantId: session.tenantId,
    };

    return true;
  }
}
```

### 5.4 Decorators para Extraer Datos

**Archivo:** `src/core/shared/decorators/current-user.decorator.ts`
```typescript
import { createParamDecorator, ExecutionContext } from '@nestjs/common';

export const CurrentUser = createParamDecorator(
  (data: unknown, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest();
    return request.user.userId;
  },
);
```

**Archivo:** `src/core/shared/decorators/tenant-context.decorator.ts`
```typescript
import { createParamDecorator, ExecutionContext } from '@nestjs/common';

export const TenantContext = createParamDecorator(
  (data: unknown, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest();
    return request.user.tenantId;
  },
);
```

### 5.5 Uso en Controladores

```typescript
@Controller('courses')
@UseGuards(AuthGuard) // ← Aplica autenticación
export class CoursesController {
  @Get()
  async getCourses(
    @CurrentUser() userId: string, // ← Extrae userId
    @TenantContext() tenantId: string, // ← Extrae tenantId
  ) {
    // userId y tenantId automáticamente disponibles
  }
}
```

**Entregable:** Sistema de autenticación con tokens opacos en DB.

---

## FASE 6: Integración con SpiceDB (Días 18-21)

### Objetivo
Sistema de permisos granular basado en relaciones.

### 6.1 Schema de SpiceDB

**Archivo:** `src/core/infrastructure/permissions/schemas/schema.zed`
```zed
definition user {}

definition organization {
  relation member: user
  relation admin: user
  
  permission view_members = member + admin
  permission manage_members = admin
}

definition course {
  relation owner: user
  relation org: organization
  relation enrolled: user
  
  permission view = owner + enrolled + org->member
  permission edit = owner + org->admin
  permission delete = owner
  permission enroll = org->member
}

definition lesson {
  relation course: course
  relation creator: user
  
  permission view = course->view
  permission edit = course->edit + creator
}

definition file {
  relation course: course
  relation uploader: user
  
  permission download = course->view
  permission delete = uploader + course->owner
}
```

### 6.2 Cliente SpiceDB

**Archivo:** `src/core/infrastructure/permissions/spicedb.client.ts`
```typescript
import { v1 } from '@authzed/authzed-node';
import { env } from '../../config/env.config';

export class SpiceDBClient {
  private readonly client: v1.ZedClientInterface;

  constructor() {
    this.client = v1.NewClient(
      env.SPICEDB_TOKEN || '',
      env.SPICEDB_ENDPOINT,
    );
  }

  async createRelationship(data: {
    resource: { type: string; id: string };
    relation: string;
    subject: { type: string; id: string };
  }): Promise<void> {
    await this.client.permissionsService.writeRelationships({
      updates: [
        {
          operation: v1.RelationshipUpdate_Operation.CREATE,
          relationship: {
            resource: {
              objectType: data.resource.type,
              objectId: data.resource.id,
            },
            relation: data.relation,
            subject: {
              object: {
                objectType: data.subject.type,
                objectId: data.subject.id,
              },
            },
          },
        },
      ],
    });
  }

  async checkPermission(data: {
    resource: { type: string; id: string };
    permission: string;
    subject: { type: string; id: string };
  }): Promise<boolean> {
    const response = await this.client.permissionsService.checkPermission({
      resource: {
        objectType: data.resource.type,
        objectId: data.resource.id,
      },
      permission: data.permission,
      subject: {
        object: {
          objectType: data.subject.type,
          objectId: data.subject.id,
        },
      },
    });

    return response.permissionship === v1.CheckPermissionResponse_Permissionship.HAS_PERMISSION;
  }

  async deleteRelationship(data: {
    resource: { type: string; id: string };
    relation: string;
    subject: { type: string; id: string };
  }): Promise<void> {
    await this.client.permissionsService.writeRelationships({
      updates: [
        {
          operation: v1.RelationshipUpdate_Operation.DELETE,
          relationship: {
            resource: {
              objectType: data.resource.type,
              objectId: data.resource.id,
            },
            relation: data.relation,
            subject: {
              object: {
                objectType: data.subject.type,
                objectId: data.subject.id,
              },
            },
          },
        },
      ],
    });
  }
}
```

### 6.3 Guard de Permisos

**Archivo:** `src/core/shared/guards/permission.guard.ts`
```typescript
import { Injectable, CanActivate, ExecutionContext, ForbiddenException, SetMetadata } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { SpiceDBClient } from '../../infrastructure/permissions/spicedb.client';

export const CHECK_PERMISSION_KEY = 'checkPermission';

export const CheckPermission = (resourceType: string, permission: string) =>
  SetMetadata(CHECK_PERMISSION_KEY, { resourceType, permission });

@Injectable()
export class PermissionGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly spicedb: SpiceDBClient,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const permissionMeta = this.reflector.get<{
      resourceType: string;
      permission: string;
    }>(CHECK_PERMISSION_KEY, context.getHandler());

    if (!permissionMeta) {
      return true; // No se especificó permiso
    }

    const request = context.switchToHttp().getRequest();
    const userId = request.user?.userId;
    
    if (!userId) {
      throw new ForbiddenException('User not authenticated');
    }

    // Extraer ID del recurso desde params
    const resourceId = request.params.id;
    if (!resourceId) {
      throw new ForbiddenException('Resource ID not found');
    }

    const hasPermission = await this.spicedb.checkPermission({
      resource: {
        type: permissionMeta.resourceType,
        id: resourceId,
      },
      permission: permissionMeta.permission,
      subject: {
        type: 'user',
        id: userId,
      },
    });

    if (!hasPermission) {
      throw new ForbiddenException(
        `User ${userId} does not have permission ${permissionMeta.permission} on ${permissionMeta.resourceType}:${resourceId}`,
      );
    }

    return true;
  }
}
```

### 6.4 Uso en Controladores

```typescript
@Controller('courses')
@UseGuards(AuthGuard, PermissionGuard)
export class CoursesController {
  @Get(':id')
  @CheckPermission('course', 'view') // ← Consulta automática a SpiceDB
  async getCourse(@Param('id') id: string) {
    // Si llegamos aquí, el usuario TIENE permiso
  }

  @Put(':id')
  @CheckPermission('course', 'edit')
  async updateCourse(@Param('id') id: string) {
    // ...
  }

  @Delete(':id')
  @CheckPermission('course', 'delete')
  async deleteCourse(@Param('id') id: string) {
    // ...
  }
}
```

### 6.5 Crear Relaciones al Crear Recursos

```typescript
@Injectable()
export class CourseService {
  constructor(
    private readonly spicedb: SpiceDBClient,
  ) {}

  async createCourse(data: CreateCourseDto, userId: string, orgId: string): Promise<Course> {
    const courseId = ulid();

    // 1. Crear curso en DB
    const course = await this.repository.create({
      id: courseId,
      ...data,
    });

    // 2. Crear relaciones en SpiceDB
    await this.spicedb.createRelationship({
      resource: { type: 'course', id: courseId },
      relation: 'owner',
      subject: { type: 'user', id: userId },
    });

    await this.spicedb.createRelationship({
      resource: { type: 'course', id: courseId },
      relation: 'org',
      subject: { type: 'organization', id: orgId },
    });

    return course;
  }
}
```

**Entregable:** Sistema de permisos granular completamente funcional.

---

## FASE 7: Slice Completo de Cursos (Días 22-28)

### Objetivo
Implementar el dominio de Cursos siguiendo todos los patrones establecidos.

### 7.1 Schema de Base de Datos

**Archivo:** `src/modules/courses/infrastructure/database/course.schema.ts`
```typescript
import { pgTable, varchar, text, integer, boolean, timestamp, jsonb } from 'drizzle-orm/pg-core';

export const courses = pgTable('courses', {
  id: varchar('id', { length: 26 }).primaryKey(),
  title: varchar('title', { length: 255 }).notNull(),
  description: text('description'),
  tenantId: varchar('tenant_id', { length: 26 }).notNull(),
  ownerId: varchar('owner_id', { length: 26 }).notNull(),
  thumbnailUrl: varchar('thumbnail_url', { length: 500 }),
  price: integer('price').notNull().default(0),
  isPublished: boolean('is_published').notNull().default(false),
  metadata: jsonb('metadata'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

export const lessons = pgTable('lessons', {
  id: varchar('id', { length: 26 }).primaryKey(),
  courseId: varchar('course_id', { length: 26 }).notNull(),
  title: varchar('title', { length: 255 }).notNull(),
  description: text('description'),
  videoUrl: varchar('video_url', { length: 500 }),
  duration: integer('duration'), // segundos
  order: integer('order').notNull(),
  isPublished: boolean('is_published').notNull().default(false),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

export const enrollments = pgTable('enrollments', {
  id: varchar('id', { length: 26 }).primaryKey(),
  courseId: varchar('course_id', { length: 26 }).notNull(),
  userId: varchar('user_id', { length: 26 }).notNull(),
  progress: integer('progress').notNull().default(0), // 0-100
  enrolledAt: timestamp('enrolled_at').notNull().defaultNow(),
  completedAt: timestamp('completed_at'),
});
```

### 7.2 Dominio de Curso

**Archivo:** `src/modules/courses/core/domain/course.entity.ts`
```typescript
export class Course {
  id: string;
  title: string;
  description?: string;
  tenantId: string;
  ownerId: string;
  thumbnailUrl?: string;
  price: number;
  isPublished: boolean;
  metadata?: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;

  constructor(data: Course) {
    Object.assign(this, data);
  }

  // Business logic
  canBePublished(): boolean {
    return !!this.title && !!this.description && this.price >= 0;
  }

  publish(): void {
    if (!this.canBePublished()) {
      throw new Error('Course cannot be published: missing required data');
    }
    this.isPublished = true;
    this.updatedAt = new Date();
  }

  unpublish(): void {
    this.isPublished = false;
    this.updatedAt = new Date();
  }

  updatePrice(newPrice: number): void {
    if (newPrice < 0) {
      throw new Error('Price cannot be negative');
    }
    this.price = newPrice;
    this.updatedAt = new Date();
  }
}
```

### 7.3 Puertos del Dominio

**Archivo:** `src/modules/courses/core/ports/course.repository.port.ts`
```typescript
import { Course } from '../domain/course.entity';

export interface ICourseRepository {
  create(data: CreateCourseData): Promise<Course>;
  findById(id: string): Promise<Course | null>;
  findByTenant(tenantId: string): Promise<Course[]>;
  findPublished(): Promise<Course[]>;
  update(id: string, data: Partial<Course>): Promise<Course>;
  delete(id: string): Promise<void>;
}

export const COURSE_REPOSITORY = Symbol('COURSE_REPOSITORY');

export interface CreateCourseData {
  title: string;
  description?: string;
  tenantId: string;
  ownerId: string;
  price: number;
}
```

**Archivo:** `src/modules/courses/core/ports/lesson.repository.port.ts`
```typescript
import { Lesson } from '../domain/lesson.entity';

export interface ILessonRepository {
  create(data: CreateLessonData): Promise<Lesson>;
  findById(id: string): Promise<Lesson | null>;
  findByCourse(courseId: string): Promise<Lesson[]>;
  update(id: string, data: Partial<Lesson>): Promise<Lesson>;
  delete(id: string): Promise<void>;
  reorder(courseId: string, lessonIds: string[]): Promise<void>;
}

export const LESSON_REPOSITORY = Symbol('LESSON_REPOSITORY');

export interface CreateLessonData {
  courseId: string;
  title: string;
  description?: string;
  videoUrl?: string;
  duration?: number;
  order: number;
}
```

### 7.4 Servicio de Cursos

**Archivo:** `src/modules/courses/core/services/course.service.ts`
```typescript
import { Injectable, Inject } from '@nestjs/common';
import { COURSE_REPOSITORY, ICourseRepository } from '../ports/course.repository.port';
import { Course } from '../domain/course.entity';
import { SpiceDBClient } from '../../../../core/infrastructure/permissions/spicedb.client';
import { ulid } from 'ulid';

@Injectable()
export class CourseService {
  constructor(
    @Inject(COURSE_REPOSITORY)
    private readonly repository: ICourseRepository,
    private readonly spicedb: SpiceDBClient,
  ) {}

  async createCourse(
    data: {
      title: string;
      description?: string;
      price: number;
    },
    userId: string,
    tenantId: string,
    orgId: string,
  ): Promise<Course> {
    const courseId = ulid();

    // 1. Crear en DB
    const course = await this.repository.create({
      id: courseId,
      title: data.title,
      description: data.description,
      price: data.price,
      tenantId,
      ownerId: userId,
    });

    // 2. Crear relaciones en SpiceDB
    await Promise.all([
      this.spicedb.createRelationship({
        resource: { type: 'course', id: courseId },
        relation: 'owner',
        subject: { type: 'user', id: userId },
      }),
      this.spicedb.createRelationship({
        resource: { type: 'course', id: courseId },
        relation: 'org',
        subject: { type: 'organization', id: orgId },
      }),
    ]);

    return course;
  }

  async publishCourse(courseId: string): Promise<Course> {
    const course = await this.repository.findById(courseId);
    if (!course) {
      throw new Error('Course not found');
    }

    course.publish(); // Lógica de dominio

    return this.repository.update(courseId, {
      isPublished: course.isPublished,
      updatedAt: course.updatedAt,
    });
  }

  async enrollUser(courseId: string, userId: string): Promise<void> {
    // Verificar que el usuario tiene permiso de enroll
    const canEnroll = await this.spicedb.checkPermission({
      resource: { type: 'course', id: courseId },
      permission: 'enroll',
      subject: { type: 'user', id: userId },
    });

    if (!canEnroll) {
      throw new Error('User cannot enroll in this course');
    }

    // Crear relación enrolled
    await this.spicedb.createRelationship({
      resource: { type: 'course', id: courseId },
      relation: 'enrolled',
      subject: { type: 'user', id: userId },
    });

    // Crear registro de enrollment en DB
    // ... (código de enrollment)
  }

  async getCourseById(id: string): Promise<Course> {
    const course = await this.repository.findById(id);
    if (!course) {
      throw new Error('Course not found');
    }
    return course;
  }

  async getPublishedCourses(): Promise<Course[]> {
    return this.repository.findPublished();
  }

  async deleteCourse(courseId: string): Promise<void> {
    // 1. Eliminar de DB
    await this.repository.delete(courseId);

    // 2. Eliminar todas las relaciones de SpiceDB
    // (SpiceDB debería tener cascade configurado en el schema)
  }
}
```

### 7.5 Controlador de Cursos

**Archivo:** `src/modules/courses/api/controllers/courses.controller.ts`
```typescript
import { Controller, Get, Post, Put, Delete, Body, Param, UseGuards } from '@nestjs/common';
import { CourseService } from '../../core/services/course.service';
import { AuthGuard } from '../../../../core/shared/guards/auth.guard';
import { PermissionGuard, CheckPermission } from '../../../../core/shared/guards/permission.guard';
import { CurrentUser } from '../../../../core/shared/decorators/current-user.decorator';
import { TenantContext } from '../../../../core/shared/decorators/tenant-context.decorator';
import { CreateCourseDto } from '../dto/create-course.dto';
import { UpdateCourseDto } from '../dto/update-course.dto';

@Controller('courses')
@UseGuards(AuthGuard)
export class CoursesController {
  constructor(private readonly courseService: CourseService) {}

  @Post()
  async create(
    @Body() dto: CreateCourseDto,
    @CurrentUser() userId: string,
    @TenantContext() tenantId: string,
  ) {
    // Asumimos que el orgId viene del contexto del tenant
    const orgId = tenantId; // Simplificación
    
    return this.courseService.createCourse(dto, userId, tenantId, orgId);
  }

  @Get()
  async findAll() {
    return this.courseService.getPublishedCourses();
  }

  @Get(':id')
  @UseGuards(PermissionGuard)
  @CheckPermission('course', 'view')
  async findOne(@Param('id') id: string) {
    return this.courseService.getCourseById(id);
  }

  @Put(':id/publish')
  @UseGuards(PermissionGuard)
  @CheckPermission('course', 'edit')
  async publish(@Param('id') id: string) {
    return this.courseService.publishCourse(id);
  }

  @Post(':id/enroll')
  async enroll(
    @Param('id') courseId: string,
    @CurrentUser() userId: string,
  ) {
    await this.courseService.enrollUser(courseId, userId);
    return { message: 'Enrolled successfully' };
  }

  @Delete(':id')
  @UseGuards(PermissionGuard)
  @CheckPermission('course', 'delete')
  async remove(@Param('id') id: string) {
    await this.courseService.deleteCourse(id);
    return { message: 'Course deleted' };
  }
}
```

### 7.6 Controlador de Lecciones con Video Upload

**Archivo:** `src/modules/courses/api/controllers/lessons.controller.ts`
```typescript
import { Controller, Post, Get, Put, Delete, Param, Req, Res, UseGuards, Body } from '@nestjs/common';
import { Request, Response } from 'express';
import Busboy from 'busboy';
import { LessonService } from '../../core/services/lesson.service';
import { STORAGE_GATEWAY, IStorageGateway } from '../../../../core/infrastructure/storage/ports/storage.port';
import { Inject } from '@nestjs/common';
import { AuthGuard } from '../../../../core/shared/guards/auth.guard';
import { PermissionGuard, CheckPermission } from '../../../../core/shared/guards/permission.guard';
import { CurrentUser } from '../../../../core/shared/decorators/current-user.decorator';
import { TenantContext } from '../../../../core/shared/decorators/tenant-context.decorator';

@Controller('courses/:courseId/lessons')
@UseGuards(AuthGuard)
export class LessonsController {
  constructor(
    private readonly lessonService: LessonService,
    @Inject(STORAGE_GATEWAY)
    private readonly storageGateway: IStorageGateway,
  ) {}

  @Post()
  @UseGuards(PermissionGuard)
  @CheckPermission('course', 'edit')
  async create(
    @Param('courseId') courseId: string,
    @Body() dto: { title: string; description?: string; order: number },
  ) {
    return this.lessonService.createLesson({
      courseId,
      ...dto,
    });
  }

  @Get()
  @UseGuards(PermissionGuard)
  @CheckPermission('course', 'view')
  async findAll(@Param('courseId') courseId: string) {
    return this.lessonService.getLessonsByCourse(courseId);
  }

  @Post(':lessonId/video')
  @UseGuards(PermissionGuard)
  @CheckPermission('course', 'edit')
  async uploadVideo(
    @Param('courseId') courseId: string,
    @Param('lessonId') lessonId: string,
    @Req() request: Request,
    @Res() response: Response,
    @CurrentUser() userId: string,
    @TenantContext() tenantId: string,
  ): Promise<void> {
    const busboy = Busboy({ headers: request.headers });

    let uploadResult: any;

    busboy.on('file', async (fieldname, file, info) => {
      const { filename, mimeType } = info;

      // Validar que es un video
      if (!mimeType.startsWith('video/')) {
        response.status(400).json({ error: 'Only video files allowed' });
        return;
      }

      try {
        // Path estructurado: tenant/courses/courseId/lessons/lessonId/video.mp4
        const videoPath = `courses/${courseId}/lessons/${lessonId}/${Date.now()}-${filename}`;

        // STREAMING PURO: archivo nunca toca RAM
        uploadResult = await this.storageGateway.upload({
          stream: file, // ← Stream directo a S3
          path: videoPath,
          mimeType,
          tenantId,
          userId,
          onProgress: (bytes) => {
            // Opcional: enviar progreso via WebSocket
            console.log(`Video upload: ${bytes} bytes`);
          },
        });

        // Actualizar lesson con URL del video
        await this.lessonService.updateLesson(lessonId, {
          videoUrl: uploadResult.path,
        });

        // Crear relación en SpiceDB
        await this.spicedb.createRelationship({
          resource: { type: 'file', id: uploadResult.path },
          relation: 'course',
          subject: { type: 'course', id: courseId },
        });

        response.status(200).json({
          ...uploadResult,
          lessonId,
        });
      } catch (error) {
        console.error('Video upload failed:', error);
        response.status(500).json({ error: error.message });
      }
    });

    busboy.on('error', (error) => {
      console.error('Busboy error:', error);
      response.status(500).json({ error: error.message });
    });

    request.pipe(busboy);
  }

  @Delete(':lessonId')
  @UseGuards(PermissionGuard)
  @CheckPermission('course', 'edit')
  async remove(
    @Param('courseId') courseId: string,
    @Param('lessonId') lessonId: string,
  ) {
    await this.lessonService.deleteLesson(lessonId);
    return { message: 'Lesson deleted' };
  }
}
```

**Entregable:** Slice completo de Cursos con videos, permisos y streaming.

---

## FASE 8: Multi-Tenancy Global (Días 29-30)

### Objetivo
Sistema de tenant context automático en toda la aplicación.

### 8.1 Tenant Interceptor

**Archivo:** `src/core/shared/interceptors/tenant.interceptor.ts`
```typescript
import { Injectable, NestInterceptor, ExecutionContext, CallHandler } from '@nestjs/common';
import { Observable } from 'rxjs';

@Injectable()
export class TenantInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest();

    // El tenant viene del AuthGuard (extraído del token)
    if (request.user?.tenantId) {
      // Inyectar tenantId en el contexto de la request
      request.tenantId = request.user.tenantId;
    }

    return next.handle();
  }
}
```

### 8.2 Aplicar Globalmente

**Archivo:** `src/app.module.ts`
```typescript
import { Module } from '@nestjs/common';
import { APP_INTERCEPTOR } from '@nestjs/core';
import { TenantInterceptor } from './core/shared/interceptors/tenant.interceptor';

@Module({
  providers: [
    {
      provide: APP_INTERCEPTOR,
      useClass: TenantInterceptor,
    },
  ],
})
export class AppModule {}
```

### 8.3 Query Scope Automático en Repository

**Archivo:** `src/core/infrastructure/database/scoped-repository.base.ts`
```typescript
import { NodePgDatabase } from 'drizzle-orm/node-postgres';
import { eq, and, SQL } from 'drizzle-orm';

export abstract class ScopedRepository<T> {
  constructor(
    protected readonly db: NodePgDatabase,
    protected readonly table: any,
  ) {}

  protected scopeToTenant(tenantId: string, additionalFilters?: SQL[]): SQL {
    const filters = [eq(this.table.tenantId, tenantId)];
    
    if (additionalFilters) {
      filters.push(...additionalFilters);
    }

    return and(...filters);
  }

  async findByTenant(tenantId: string): Promise<T[]> {
    return this.db
      .select()
      .from(this.table)
      .where(this.scopeToTenant(tenantId));
  }

  async findByIdScoped(id: string, tenantId: string): Promise<T | null> {
    const [row] = await this.db
      .select()
      .from(this.table)
      .where(
        and(
          eq(this.table.id, id),
          eq(this.table.tenantId, tenantId),
        ),
      );

    return row || null;
  }

  // Más métodos con scope automático...
}
```

**Entregable:** Multi-tenancy automático en toda la aplicación.

---

## FASE 9: Response Interceptors & Error Handling (Día 31)

### Objetivo
Respuestas consistentes y manejo de errores global.

### 9.1 Response Transformer

**Archivo:** `src/core/shared/interceptors/response.interceptor.ts`
```typescript
import { Injectable, NestInterceptor, ExecutionContext, CallHandler } from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

export interface Response<T> {
  success: boolean;
  data: T;
  timestamp: string;
  path: string;
}

@Injectable()
export class ResponseInterceptor<T> implements NestInterceptor<T, Response<T>> {
  intercept(context: ExecutionContext, next: CallHandler): Observable<Response<T>> {
    const request = context.switchToHttp().getRequest();

    return next.handle().pipe(
      map((data) => ({
        success: true,
        data,
        timestamp: new Date().toISOString(),
        path: request.url,
      })),
    );
  }
}
```

### 9.2 Global Exception Filter

**Archivo:** `src/core/shared/filters/http-exception.filter.ts`
```typescript
import { ExceptionFilter, Catch, ArgumentsHost, HttpException, HttpStatus } from '@nestjs/common';
import { Response } from 'express';

@Catch()
export class GlobalExceptionFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest();

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let message = 'Internal server error';
    let errors: any = undefined;

    if (exception instanceof HttpException) {
      status = exception.getStatus();
      const exceptionResponse = exception.getResponse();

      if (typeof exceptionResponse === 'object') {
        message = (exceptionResponse as any).message || message;
        errors = (exceptionResponse as any).errors;
      } else {
        message = exceptionResponse;
      }
    } else if (exception instanceof Error) {
      message = exception.message;
    }

    console.error('Exception caught:', {
      status,
      message,
      path: request.url,
      method: request.method,
      stack: exception instanceof Error ? exception.stack : undefined,
    });

    response.status(status).json({
      success: false,
      statusCode: status,
      message,
      errors,
      timestamp: new Date().toISOString(),
      path: request.url,
    });
  }
}
```

### 9.3 Aplicar Globalmente

**Archivo:** `src/main.ts` (actualizar bootstrap)
```typescript
async function bootstrap() {
  // ... validaciones previas

  const app = await NestFactory.create(AppModule);

  // Global filters & interceptors
  app.useGlobalFilters(new GlobalExceptionFilter());
  app.useGlobalInterceptors(new ResponseInterceptor());

  app.enableCors();
  app.setGlobalPrefix('api');

  await app.listen(env.PORT);
}
```

**Entregable:** Respuestas y errores consistentes en toda la API.

---

## FASE 10: Testing Strategy (Días 32-35)

### Objetivo
Tests que validan la arquitectura hexagonal.

### 10.1 Test de Dominio (Puro)

**Archivo:** `src/modules/courses/core/domain/course.entity.spec.ts`
```typescript
import { Course } from './course.entity';

describe('Course Entity', () => {
  it('should not allow publishing without required data', () => {
    const course = new Course({
      id: '1',
      title: '',
      tenantId: '1',
      ownerId: '1',
      price: 0,
      isPublished: false,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    expect(() => course.publish()).toThrow('Course cannot be published');
  });

  it('should allow publishing with valid data', () => {
    const course = new Course({
      id: '1',
      title: 'Test Course',
      description: 'Description',
      tenantId: '1',
      ownerId: '1',
      price: 100,
      isPublished: false,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    course.publish();
    expect(course.isPublished).toBe(true);
  });

  it('should not allow negative price', () => {
    const course = new Course({
      id: '1',
      title: 'Test',
      tenantId: '1',
      ownerId: '1',
      price: 0,
      isPublished: false,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    expect(() => course.updatePrice(-100)).toThrow('Price cannot be negative');
  });
});
```

### 10.2 Test de Servicio (con Mocks)

**Archivo:** `src/modules/courses/core/services/course.service.spec.ts`
```typescript
import { Test } from '@nestjs/testing';
import { CourseService } from './course.service';
import { COURSE_REPOSITORY } from '../ports/course.repository.port';
import { SpiceDBClient } from '../../../../core/infrastructure/permissions/spicedb.client';

describe('CourseService', () => {
  let service: CourseService;
  let mockRepository: any;
  let mockSpiceDB: any;

  beforeEach(async () => {
    mockRepository = {
      create: jest.fn(),
      findById: jest.fn(),
      update: jest.fn(),
    };

    mockSpiceDB = {
      createRelationship: jest.fn(),
      checkPermission: jest.fn(),
    };

    const module = await Test.createTestingModule({
      providers: [
        CourseService,
        {
          provide: COURSE_REPOSITORY,
          useValue: mockRepository,
        },
        {
          provide: SpiceDBClient,
          useValue: mockSpiceDB,
        },
      ],
    }).compile();

    service = module.get<CourseService>(CourseService);
  });

  it('should create course and set permissions', async () => {
    mockRepository.create.mockResolvedValue({
      id: '1',
      title: 'Test Course',
    });

    mockSpiceDB.createRelationship.mockResolvedValue(undefined);

    const result = await service.createCourse(
      { title: 'Test Course', price: 0 },
      'user1',
      'tenant1',
      'org1',
    );

    expect(result.title).toBe('Test Course');
    expect(mockSpiceDB.createRelationship).toHaveBeenCalledTimes(2);
  });
});
```

### 10.3 Test E2E (con DB Real)

**Archivo:** `test/courses.e2e-spec.ts`
```typescript
import { Test } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';

describe('CoursesController (e2e)', () => {
  let app: INestApplication;
  let authToken: string;

  beforeAll(async () => {
    const moduleFixture = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();

    // Login to get token
    const loginResponse = await request(app.getHttpServer())
      .post('/api/auth/login')
      .send({ email: 'test@example.com', password: 'password' });

    authToken = loginResponse.body.data.token;
  });

  afterAll(async () => {
    await app.close();
  });

  it('/api/courses (POST)', () => {
    return request(app.getHttpServer())
      .post('/api/courses')
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        title: 'E2E Test Course',
        description: 'Description',
        price: 100,
      })
      .expect(201)
      .expect((res) => {
        expect(res.body.success).toBe(true);
        expect(res.body.data.title).toBe('E2E Test Course');
      });
  });

  it('/api/courses/:id (GET) should check permissions', async () => {
    // Create course
    const createResponse = await request(app.getHttpServer())
      .post('/api/courses')
      .set('Authorization', `Bearer ${authToken}`)
      .send({ title: 'Test', price: 0 });

    const courseId = createResponse.body.data.id;

    // Should allow access (owner)
    await request(app.getHttpServer())
      .get(`/api/courses/${courseId}`)
      .set('Authorization', `Bearer ${authToken}`)
      .expect(200);

    // TODO: Test with different user (should deny)
  });
});
```

**Entregable:** Suite de tests completa que valida arquitectura.

---

## FASE 11: Documentación & Developer Experience (Días 36-37)

### Objetivo
Documentación que hace la plantilla auto-explicativa.

### 11.1 README Principal

**Archivo:** `README.md`
```markdown
# SaaS Template - Self-Aware & Transport Agnostic

## 🎯 Philosophy

This template follows two core principles:

1. **Self-Awareness**: The system validates its infrastructure before starting
2. **Transport Agnostic**: Business logic is independent of HTTP/GraphQL/gRPC

## 🚫 What's PROHIBITED

### 1. Direct Slice Coupling
❌ NEVER inject services from other slices
✅ ALWAYS use Gateways (interfaces)

### 2. File Buffering
❌ NEVER load files into RAM
✅ ALWAYS use streaming

### 3. Blind Startup
❌ NEVER start without validation
✅ ALWAYS check DB, SpiceDB, S3 first

### 4. Hardcoded Permissions
❌ NEVER write `if (role === 'admin')`
✅ ALWAYS use SpiceDB relationships

### 5. Client Direct Access
❌ NEVER let clients talk to S3 directly
✅ ALWAYS proxy through backend

## 🏗️ Architecture

```
src/
├── core/                    # Shared infrastructure
│   ├── config/             # Env validation
│   ├── infrastructure/     # DB, SpiceDB, S3
│   └── shared/             # Guards, decorators
└── modules/                # Business slices
    └── users/
        ├── api/           # Transport layer
        ├── core/          # Business logic
        │   ├── domain/    # Entities
        │   ├── ports/     # Interfaces
        │   └── services/  # Use cases
        └── infrastructure/
            └── adapters/  # Implementations
```

## 🚀 Getting Started

### 1. Environment Setup

```bash
cp .env.example .env
# Fill in your credentials
```

### 2. Start Infrastructure

```bash
docker-compose up -d
```

### 3. Run Bootstrap

```bash
pnpm install
pnpm start:dev
```

The system will:
✅ Validate environment
✅ Create database if missing
✅ Run migrations
✅ Sync SpiceDB schema
✅ Test S3 connection
✅ Start server

## 📦 Adding a New Slice

1. Create folder structure:
```bash
mkdir -p src/modules/my-feature/{api,core,infrastructure}
```

2. Define domain entity in `core/domain/`
3. Define ports (interfaces) in `core/ports/`
4. Implement service in `core/services/`
5. Implement adapters in `infrastructure/adapters/`
6. Create controllers in `api/controllers/`
7. Wire everything in `my-feature.module.ts`

## 🔐 Permission System

Define relationships in SpiceDB, not code:

```zed
definition course {
  relation owner: user
  relation org: organization
  
  permission edit = owner + org->admin
}
```

Use in controllers:

```typescript
@CheckPermission('course', 'edit')
async updateCourse(@Param('id') id: string) {
  // Permission already checked
}
```

## 📁 File Upload (Streaming)

Always use streaming, never buffering:

```typescript
// ✅ Correct
await storageGateway.upload({
  stream: fileStream,
  path: 'uploads/file.mp4',
});

// ❌ Wrong
const buffer = await file.arrayBuffer();
await s3.upload(buffer);
```

## 🧪 Testing

```bash
# Unit tests
pnpm test

# E2E tests
pnpm test:e2e

# Coverage
pnpm test:cov
```

## 📚 Learn More

- [Architecture Deep Dive](docs/architecture.md)
- [Adding Features](docs/adding-features.md)
- [Migration to Microservices](docs/microservices.md)
```

### 11.2 Arquitectura Detallada

**Archivo:** `docs/architecture.md`
```markdown
# Architecture Deep Dive

## Hexagonal Architecture

Each slice follows hexagonal architecture (ports & adapters):

```
      ┌─────────────────────────┐
      │   API Layer (HTTP)      │ ← Transport
      └───────────┬─────────────┘
                  │
      ┌───────────▼─────────────┐
      │   Core (Business Logic) │ ← Pure logic
      │   - Domain entities     │
      │   - Use cases           │
      │   - Ports (interfaces)  │
      └───────────┬─────────────┘
                  │
      ┌───────────▼─────────────┐
      │   Adapters (Infra)      │ ← Implementation
      │   - DB repositories     │
      │   - External services   │
      └─────────────────────────┘
```

## Why This Works

1. **Business logic is portable**: Core doesn't know about HTTP
2. **Easy testing**: Mock adapters, test core logic
3. **Flexible infrastructure**: Swap Postgres for MongoDB without touching core