// Media entity types

export interface MediaFile {
  id: string;
  accountId: string;
  filename: string;
  storagePath: string;
  mimeType: string;
  sizeBytes: number;
  metadata: MediaMetadata;
  createdAt: Date;
}

export interface MediaMetadata {
  width?: number;
  height?: number;
  duration?: number; // for videos, in seconds
  format?: string;
  colorSpace?: string;
  hasAlpha?: boolean;
  exifData?: Record<string, unknown>;
}

export interface CreateMediaInput {
  filename: string;
  mimeType: string;
  sizeBytes: number;
  metadata?: MediaMetadata;
}

export interface MediaUploadResponse {
  id: string;
  url: string;
  cdnUrl: string;
  thumbnailUrl?: string;
}
