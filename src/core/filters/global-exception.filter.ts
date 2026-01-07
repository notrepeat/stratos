import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { Response } from 'express';
import { AppException } from '../exceptions/app.exceptions';

@Catch()
export class GlobalExceptionFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost) {
    // Try to get HTTP context - if it fails or response is not available, it's likely GraphQL
    try {
      const ctx = host.switchToHttp();
      const response = ctx.getResponse<Response>();

      // Additional check: if response doesn't have status method, it's GraphQL
      if (typeof response?.status !== 'function') {
        throw exception; // Let GraphQL handle it
      }
    } catch {
      // For GraphQL or other non-HTTP contexts, let the error bubble up
      throw exception;
    }

    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();

    let statusCode: number;
    let errorResponse: any;

    if (exception instanceof AppException) {
      // Nuestra excepción personalizada
      statusCode = exception.statusCode;
      errorResponse = exception.toJSON();
    } else if (exception instanceof HttpException) {
      // Excepción de NestJS
      statusCode = exception.getStatus();
      const exceptionResponse = exception.getResponse();

      if (typeof exceptionResponse === 'string') {
        errorResponse = {
          success: false,
          error: 'HTTP_ERROR',
          message: exceptionResponse,
        };
      } else if (
        typeof exceptionResponse === 'object' &&
        exceptionResponse !== null
      ) {
        const responseObj = exceptionResponse as any;
        errorResponse = {
          success: false,
          error: responseObj.error || 'HTTP_ERROR',
          message: responseObj.message || exception.message,
          ...(responseObj.details && { details: responseObj.details }),
        };
      } else {
        errorResponse = {
          success: false,
          error: 'HTTP_ERROR',
          message: exception.message,
        };
      }
    } else if (exception instanceof Error) {
      // Error genérico
      statusCode = HttpStatus.INTERNAL_SERVER_ERROR;
      errorResponse = {
        success: false,
        error: 'INTERNAL_ERROR',
        message: 'Ocurrió un error inesperado',
      };

      // En desarrollo, incluir más detalles
      if (process.env.NODE_ENV === 'development') {
        errorResponse.details = {
          name: exception.name,
          message: exception.message,
          stack: exception.stack,
        };
      }
    } else {
      // Excepción desconocida
      statusCode = HttpStatus.INTERNAL_SERVER_ERROR;
      errorResponse = {
        success: false,
        error: 'UNKNOWN_ERROR',
        message: 'Ocurrió un error desconocido',
      };
    }

    // Log del error para debugging
    console.error('Exception caught:', {
      exception:
        exception instanceof Error ? exception.message : String(exception),
      statusCode,
      errorResponse,
    });

    response.status(statusCode).json(errorResponse);
  }
}
