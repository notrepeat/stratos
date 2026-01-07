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
          name: (exception as Error).name,
          message: (exception as Error).message,
          stack: (exception as Error).stack,
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
