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
  compressed?: boolean;
}

export interface FileMetadata {
  size: number;
  mimeType: string;
  uploadedAt: Date;
}
