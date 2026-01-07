import { Injectable } from '@nestjs/common';
import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
  DeleteObjectCommand,
  HeadObjectCommand,
} from '@aws-sdk/client-s3';
import { Readable } from 'stream';
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
    const { stream, path, mimeType, tenantId } = options;
    const key = `${tenantId}/${path}`;

    // Simple upload without progress tracking for now
    const command = new PutObjectCommand({
      Bucket: env.AWS_S3_BUCKET,
      Key: key,
      Body: stream,
      ContentType: mimeType,
    });

    await this.client.send(command);

    return {
      path: key,
      size: 0, // TODO: Get actual size
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
