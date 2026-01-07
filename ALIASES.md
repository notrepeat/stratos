# TypeScript Path Aliases

Para mantener imports limpios y evitar rutas relativas largas, usamos aliases de TypeScript.

## Configuración

Los aliases están definidos en `tsconfig.json`:

```json
{
  "compilerOptions": {
    "paths": {
      "@core/*": ["src/core/*"],
      "@modules/*": ["src/modules/*"],
      "@shared/*": ["src/core/shared/*"],
      "@config": ["src/core/config/env.config"],
      "@env": ["src/core/config/env.validation"]
    }
  }
}
```

## Uso

### En lugar de rutas relativas largas:

```typescript
// ❌ MAL
import { env } from '../../../core/config/env.config';
import { UserService } from '../../users/core/services/user.service';

// ✅ BIEN
import { env } from '@config';
import { UserService } from '@modules/users/core/services/user.service';
```

### Aliases disponibles:

- `@core/*` → `src/core/*`
  - `@core/config/env.config`
  - `@core/infrastructure/database/*`

- `@modules/*` → `src/modules/*`
  - `@modules/users/core/domain/user.entity`
  - `@modules/auth/api/controllers/auth.controller`

- `@shared/*` → `src/core/shared/*`
  - `@shared/guards/*`
  - `@shared/decorators/*`

- `@config` → `src/core/config/env.config`
- `@env` → `src/core/config/env.validation`

## Beneficios

1. **Imports limpios**: No más `../../../` everywhere
2. **Refactoring seguro**: Los moves de archivos no rompen imports
3. **Auto-completado**: IDEs entienden los aliases
4. **Consistencia**: Patrón uniforme en todo el proyecto

## Reglas

- ✅ Usa aliases para imports entre módulos
- ✅ Usa aliases para shared utilities
- ❌ No uses aliases para archivos en el mismo directorio
- ❌ No uses rutas relativas cuando hay alias disponible
