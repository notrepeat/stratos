import { Injectable } from '@nestjs/common';
import {
  S3Client,
  GetObjectCommand,
  DeleteObjectCommand,
  HeadObjectCommand,
} from '@aws-sdk/client-s3';
import { Upload } from '@aws-sdk/lib-storage';
import { Readable, PassThrough } from 'stream';
import { createGzip } from 'zlib';
import { env } from '@config';
import {
  IStorageGateway,
  UploadOptions,
  DownloadOptions,
  UploadResult,
  FileMetadata,
} from '../ports/storage.port';

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
      endpoint: env.AWS_ENDPOINT,
      forcePathStyle: true,
    });
  }

  async upload(options: UploadOptions): Promise<UploadResult> {
    const {
      stream,
      path,
      mimeType = 'application/octet-stream',
      tenantId,
      userId,
      onProgress,
    } = options;
    const key = `${tenantId}/${path}`;

    // Optimize stream with highWaterMark for better performance
    const optimizedStream = stream.pipe(
      new PassThrough({ highWaterMark: 256 * 1024 }), // 256KB chunks
    );

    // Apply compression for text-based files
    let finalStream: Readable = optimizedStream;
    let finalMimeType = mimeType;
    let finalKey = key;
    const shouldCompressFile = this.shouldCompress(mimeType);

    if (shouldCompressFile) {
      finalStream = optimizedStream.pipe(createGzip());
      finalMimeType = `${mimeType}; charset=utf-8`;
      finalKey = `${key}.gz`;
    }

    // Use Upload class for multipart upload with progress tracking
    const upload = new Upload({
      client: this.client,
      params: {
        Bucket: env.AWS_S3_BUCKET,
        Key: finalKey,
        Body: finalStream,
        ContentType: finalMimeType,
        Metadata: {
          tenantId,
          userId: userId || '',
          originalMimeType: mimeType,
          uploadedAt: new Date().toISOString(),
        },
      },
      queueSize: 4, // Upload 4 parts in parallel
      partSize: 64 * 1024 * 1024, // 64MB parts for large files
      leavePartsOnError: false,
    });

    // Track upload progress
    let totalSize = 0;
    upload.on('httpUploadProgress', (progress) => {
      if (progress.total) {
        totalSize = progress.total;
      }
      const loaded = progress.loaded || 0;
      onProgress?.(loaded);
    });

    try {
      await upload.done();

      return {
        path: finalKey,
        size: totalSize,
        uploadedAt: new Date(),
        compressed: shouldCompressFile,
      };
    } catch (error) {
      // Cleanup on error
      try {
        await this.client.send(
          new DeleteObjectCommand({
            Bucket: env.AWS_S3_BUCKET,
            Key: finalKey,
          }),
        );
      } catch (cleanupError) {
        console.warn('Failed to cleanup failed upload:', cleanupError);
      }
      throw error;
    }
  }

  private shouldCompress(mimeType: string): boolean {
    const compressibleTypes = [
      'text/plain',
      'text/html',
      'text/css',
      'text/javascript',
      'application/json',
      'application/xml',
      'application/javascript',
    ];
    return compressibleTypes.some((type) => mimeType.startsWith(type));
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
