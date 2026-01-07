export abstract class AppException extends Error {
  abstract readonly code: string;
  abstract readonly statusCode: number;

  constructor(
    message: string,
    public details?: any,
  ) {
    super(message);
    this.name = this.constructor.name;
  }

  toJSON() {
    return {
      success: false,
      error: this.code,
      message: this.message,
      ...(this.details && { details: this.details }),
    };
  }
}

export class ValidationException extends AppException {
  readonly code = 'VALIDATION_ERROR';
  readonly statusCode = 400;

  constructor(message: string, details?: any) {
    super(message, details);
  }
}

export class NotFoundException extends AppException {
  readonly code = 'NOT_FOUND';
  readonly statusCode = 404;

  constructor(resource: string, identifier: string) {
    super(`${resource} con identificador '${identifier}' no encontrado`, {
      resource,
      identifier,
    });
  }
}

export class ForbiddenException extends AppException {
  readonly code = 'FORBIDDEN';
  readonly statusCode = 403;

  constructor(message: string = 'Acceso denegado') {
    super(message);
  }
}

export class ConflictException extends AppException {
  readonly code = 'CONFLICT';
  readonly statusCode = 409;

  constructor(message: string, details?: any) {
    super(message, details);
  }
}

export class UnauthorizedException extends AppException {
  readonly code = 'UNAUTHORIZED';
  readonly statusCode = 401;

  constructor(message: string = 'No autorizado') {
    super(message);
  }
}

export class InternalServerException extends AppException {
  readonly code = 'INTERNAL_ERROR';
  readonly statusCode = 500;

  constructor(message: string = 'Error interno del servidor') {
    super(message);
  }
}
