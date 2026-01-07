import {
  Controller,
  Post,
  Get,
  Delete,
  Param,
  Req,
  Res,
  UseGuards,
  Inject,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import type { Response } from 'express';
import Busboy from 'busboy';
import { STORAGE_GATEWAY } from '../../../../core/infrastructure/storage/ports/storage.port';
import type { IStorageGateway } from '../../../../core/infrastructure/storage/ports/storage.port';
import { AuthGuard } from '../../../../core/guards/auth.guard';
import { Readable } from 'stream';

interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    tenantId: string;
  };
  tenantContext?: {
    tenantId: string;
    userId: string;
  };
}

// Rate limiting: Map to track concurrent uploads per tenant
const uploadLimiter = new Map<string, number>();

@Controller('storage')
@UseGuards(AuthGuard)
export class StorageController {
  constructor(
    @Inject(STORAGE_GATEWAY)
    private readonly storageGateway: IStorageGateway,
  ) {}

  @Get('health')
  getHealth() {
    return {
      status: 'Storage module operational',
      message: 'Optimized S3 streaming adapter with multipart upload',
      features: [
        'multipart',
        'compression',
        'progress-polling',
        'rate-limiting',
      ],
      bucket: process.env.AWS_S3_BUCKET || 'stratos',
      endpoint: process.env.AWS_ENDPOINT || 'http://localhost:9000',
    };
  }

  @Post('upload')
  async upload(
    @Req() request: AuthenticatedRequest,
    @Res() response: Response,
  ): Promise<void> {
    const tenantId = request.tenantContext?.tenantId || request.user?.tenantId;
    const userId = request.tenantContext?.userId || request.user?.id;

    if (!tenantId || !userId) {
      throw new HttpException(
        'Tenant context not found',
        HttpStatus.UNAUTHORIZED,
      );
    }

    // Rate limiting: Max 5 concurrent uploads per tenant
    const currentUploads = uploadLimiter.get(tenantId) || 0;
    if (currentUploads >= 5) {
      throw new HttpException(
        'Too many concurrent uploads for this tenant',
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }

    uploadLimiter.set(tenantId, currentUploads + 1);

    const busboy = Busboy({
      headers: request.headers as any,
      limits: {
        fileSize: 1024 * 1024 * 1024, // 1GB max
        files: 1, // Only one file per request
      },
    });

    let uploadResult: any = null;
    const uploadProgress: {
      loaded: number;
      total: number;
      percentage: number;
    } = {
      loaded: 0,
      total: 0,
      percentage: 0,
    };

    // Store progress in memory for polling (in production, use Redis/database)
    const progressKey = `${tenantId}_${userId}_${Date.now()}`;
    (global as any).uploadProgress =
      (global as any).uploadProgress || new Map();
    (global as any).uploadProgress.set(progressKey, uploadProgress);

    busboy.on('file', async (_, file, info) => {
      try {
        const { filename, mimeType } = info;

        // Validate filename
        if (!filename || filename.length > 255) {
          throw new HttpException('Invalid filename', HttpStatus.BAD_REQUEST);
        }

        // Generate unique path
        const timestamp = Date.now();
        const safeFilename = filename.replace(/[^a-zA-Z0-9.-]/g, '_');
        const path = `uploads/${timestamp}_${safeFilename}`;

        uploadResult = await this.storageGateway.upload({
          stream: file,
          path,
          mimeType,
          tenantId,
          userId,
          onProgress: (loaded: number) => {
            uploadProgress.loaded = loaded;
            uploadProgress.percentage =
              uploadProgress.total > 0
                ? Math.round((loaded / uploadProgress.total) * 100)
                : 0;

            // Update global progress
            (global as any).uploadProgress.set(progressKey, uploadProgress);
          },
        });

        // Set total size when upload completes
        uploadProgress.total = uploadResult.size;
        uploadProgress.percentage = 100;
        (global as any).uploadProgress.set(progressKey, uploadProgress);
      } catch (error) {
        console.error('Upload error:', error);
        response.status(500).json({
          error: 'Upload failed',
          message: (error as Error).message,
          progressKey,
        });
        return;
      }
    });

    busboy.on('finish', () => {
      // Decrement rate limiter
      const current = uploadLimiter.get(tenantId) || 1;
      uploadLimiter.set(tenantId, Math.max(0, current - 1));

      if (uploadResult) {
        response.json({
          success: true,
          data: uploadResult,
          progressKey,
        });
      } else {
        response.status(400).json({
          error: 'No file uploaded',
          progressKey,
        });
      }
    });

    busboy.on('error', (error) => {
      // Decrement rate limiter on error
      const current = uploadLimiter.get(tenantId) || 1;
      uploadLimiter.set(tenantId, Math.max(0, current - 1));

      console.error('Busboy error:', error);
      response.status(500).json({
        error: 'Upload processing failed',
        message: (error as Error).message,
        progressKey,
      });
    });

    // Pipe request to busboy for streaming
    (request as any).pipe(busboy);
  }

  @Get('upload/progress/:progressKey')
  getUploadProgress(@Param('progressKey') progressKey: string) {
    const progress = (global as any).uploadProgress?.get(progressKey);
    if (!progress) {
      throw new HttpException('Progress not found', HttpStatus.NOT_FOUND);
    }

    return {
      loaded: progress.loaded,
      total: progress.total,
      percentage: progress.percentage,
      completed: progress.percentage >= 100,
    };
  }

  @Get('download/:path(*)')
  async download(
    @Param('path') path: string,
    @Res({ passthrough: true }) response: Response,
    @Req() request: AuthenticatedRequest,
  ): Promise<Readable> {
    const tenantId = request.tenantContext?.tenantId || request.user?.tenantId;

    if (!tenantId) {
      throw new HttpException(
        'Tenant context not found',
        HttpStatus.UNAUTHORIZED,
      );
    }

    try {
      const stream = await this.storageGateway.download({
        path,
        tenantId,
        userId: '',
      });

      const metadata = await this.storageGateway.getMetadata(path, tenantId);

      response.set({
        'Content-Type': metadata.mimeType,
        'Content-Length': metadata.size.toString(),
        'Content-Disposition': `attachment; filename="${path.split('/').pop()}"`,
      });

      return stream;
    } catch (error) {
      throw new HttpException('File not found', HttpStatus.NOT_FOUND);
    }
  }

  @Delete(':path(*)')
  async delete(
    @Param('path') path: string,
    @Req() request: AuthenticatedRequest,
  ): Promise<{ success: boolean }> {
    const tenantId = request.tenantContext?.tenantId || request.user?.tenantId;

    if (!tenantId) {
      throw new HttpException(
        'Tenant context not found',
        HttpStatus.UNAUTHORIZED,
      );
    }

    try {
      await this.storageGateway.delete(path, tenantId);
      return { success: true };
    } catch (error) {
      throw new HttpException(
        'Delete failed',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Get('files/:path(*)')
  async getFileInfo(
    @Param('path') path: string,
    @Req() request: AuthenticatedRequest,
  ) {
    const tenantId = request.tenantContext?.tenantId || request.user?.tenantId;

    if (!tenantId) {
      throw new HttpException(
        'Tenant context not found',
        HttpStatus.UNAUTHORIZED,
      );
    }

    try {
      const metadata = await this.storageGateway.getMetadata(path, tenantId);
      return {
        path,
        size: metadata.size,
        mimeType: metadata.mimeType,
        uploadedAt: metadata.uploadedAt,
      };
    } catch (error) {
      throw new HttpException('File not found', HttpStatus.NOT_FOUND);
    }
  }
}
