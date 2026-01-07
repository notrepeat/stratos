import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable } from 'rxjs';

@Injectable()
export class TenantInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = this.getRequestFromContext(context);

    // El tenant viene del AuthGuard (extraído del token)
    if (request?.user?.tenantId) {
      // Inyectar tenantId en el contexto de la request
      request.tenantId = request.user.tenantId;
    }

    return next.handle();
  }

  private getRequestFromContext(context: ExecutionContext): any {
    // Handle both HTTP and GraphQL contexts
    try {
      // Try HTTP context first
      return context.switchToHttp().getRequest();
    } catch {
      // If HTTP context fails, it's GraphQL
      // In GraphQL, get the context from the resolver arguments
      const args = context.getArgs();
      if (args && args.length >= 3) {
        const gqlContext = args[2]; // GraphQL context
        return gqlContext?.req;
      }
    }

    return null;
  }
}
