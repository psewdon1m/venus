// Venus Platform - Media Service
// Media processing, upload, and storage microservice

import { PrismaClient } from '@prisma/client';
import cors from 'cors';
import dotenv from 'dotenv';
import express from 'express';
import helmet from 'helmet';
import multer from 'multer';
import path from 'path';
import { fileTypeFromBuffer } from 'file-type';
import { PutObjectCommand, S3Client } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { z } from 'zod';

import type { HealthCheckResponse } from '@venus/types';
import { authenticateToken, requireAdmin } from './middleware/auth';

dotenv.config();

// ==================================================
// Zod validation schemas
// ==================================================

const fileIdSchema = z.object({
  params: z.object({
    id: z.string().uuid(),
  }),
});

const uploadFileSchema = z.object({
  body: z.object({
    // File validation is handled by multer and validateFile middleware
    // No additional body validation needed for file uploads
  }),
});

// Validation middleware
const validate = (schema: any) => {
  return (req: any, res: any, next: any) => {
    try {
      schema.parse(req);
      next();
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Invalid input data',
            details: error.errors,
          },
        });
      }
      next(error);
    }
  };
};

const app = express();
const PORT = process.env.MEDIA_SERVICE_PORT || 4004;
const prisma = new PrismaClient();

// S3/R2 client configuration
const s3Client = new S3Client({
  region: process.env.AWS_REGION || 'auto',
  endpoint: process.env.S3_ENDPOINT || 'https://<account-id>.r2.cloudflarestorage.com',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID || '',
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || '',
  },
});

const BUCKET_NAME = process.env.S3_BUCKET_NAME || 'venus-media';

app.use(helmet());
app.use(cors());
app.use(express.json({ limit: '50mb' }));

// Configure multer for file uploads
const storage = multer.memoryStorage();
const upload = multer({
  storage,
  limits: {
    fileSize: 50 * 1024 * 1024, // 50MB
  },
});

// File validation middleware
const validateFile = async (req: express.Request, res: express.Response, next: express.NextFunction) => {
  const file = req.file;

  if (!file) {
    return res.status(400).json({
      success: false,
      error: { code: 'NO_FILE', message: 'No file uploaded' },
    });
  }

  // Check file extension
  const allowedExtensions = ['.jpg', '.jpeg', '.png', '.webp', '.avif', '.svg', '.gif', '.mp4', '.webm', '.pdf'];
  const ext = path.extname(file.originalname).toLowerCase();
  if (!allowedExtensions.includes(ext)) {
    return res.status(400).json({
      success: false,
      error: { code: 'INVALID_FILE_TYPE', message: 'File type not allowed' },
    });
  }

  // Check magic bytes
  try {
    const fileType = await fileTypeFromBuffer(file.buffer);
    if (!fileType) {
      return res.status(400).json({
        success: false,
        error: { code: 'INVALID_FILE', message: 'Could not determine file type' },
      });
    }

    // Validate mime type matches extension
    const allowedMimeTypes = [
      'image/jpeg', 'image/png', 'image/webp', 'image/avif', 'image/svg+xml', 'image/gif',
      'video/mp4', 'video/webm',
      'application/pdf'
    ];

    if (!allowedMimeTypes.includes(fileType.mime)) {
      return res.status(400).json({
        success: false,
        error: { code: 'INVALID_MIME_TYPE', message: 'File mime type not allowed' },
      });
    }

    // Store validated file info
    req.validatedFile = {
      buffer: file.buffer,
      originalname: file.originalname,
      mimetype: fileType.mime,
      size: file.size,
      detectedMime: fileType.mime,
      ext: fileType.ext,
    };

    next();
  } catch (error) {
    return res.status(400).json({
      success: false,
      error: { code: 'FILE_VALIDATION_ERROR', message: 'File validation failed' },
    });
  }
};

// Health check
app.get('/health', async (req, res) => {
  let dbHealthy = false;
  let storageHealthy = true; // TODO: Actual S3/R2 check

  try {
    await prisma.$queryRaw`SELECT 1`;
    dbHealthy = true;
  } catch (error) {
    dbHealthy = false;
  }

  const health: HealthCheckResponse = {
    status: dbHealthy && storageHealthy ? 'healthy' : 'degraded',
    timestamp: new Date().toISOString(),
    service: 'media-service',
    version: '0.0.1-alpha',
    uptime: process.uptime(),
    checks: {
      database: dbHealthy,
      storage: storageHealthy,
    },
  };

  res.status(dbHealthy && storageHealthy ? 200 : 503).json(health);
});

// Media upload endpoint with validation
app.post('/media/upload', authenticateToken, upload.single('file'), validateFile, validate(uploadFileSchema), async (req, res) => {
  try {
    const userId = req.user!.userId;
    const validatedFile = req.validatedFile!;

    // Generate unique filename
    const timestamp = Date.now();
    const randomId = Math.random().toString(36).substring(2, 15);
    const extension = validatedFile.ext || path.extname(validatedFile.originalname).slice(1);
    const filename = `${timestamp}-${randomId}.${extension}`;
    const key = `uploads/${userId}/${filename}`;

    // Upload to S3/R2
    const uploadCommand = new PutObjectCommand({
      Bucket: BUCKET_NAME,
      Key: key,
      Body: validatedFile.buffer,
      ContentType: validatedFile.mimetype,
      Metadata: {
        originalFilename: validatedFile.originalname,
        accountId: userId,
      },
    });

    await s3Client.send(uploadCommand);

    // Save metadata to database
    const mediaFile = await prisma.mediaFile.create({
      data: {
        accountId: userId,
        filename: validatedFile.originalname,
        storagePath: key,
        mimeType: validatedFile.mimetype,
        sizeBytes: validatedFile.size,
        metadata: JSON.stringify({
          detectedMime: validatedFile.detectedMime,
          extension: validatedFile.ext,
          uploadedAt: new Date().toISOString(),
          s3Key: key,
          bucket: BUCKET_NAME,
        }),
      },
    });

    // Generate CDN URL (Cloudflare R2 with custom domain)
    const cdnUrl = process.env.CDN_BASE_URL
      ? `${process.env.CDN_BASE_URL}/${key}`
      : `https://${BUCKET_NAME}.r2.cloudflarestorage.com/${key}`;

    res.status(201).json({
      success: true,
      data: {
        message: 'File uploaded successfully',
        file: {
          id: mediaFile.id,
          filename: mediaFile.filename,
          mimeType: mediaFile.mimeType,
          sizeBytes: mediaFile.sizeBytes,
          url: cdnUrl,
          storagePath: key,
        },
      },
    });
  } catch (error) {
    console.error('Upload error:', error);
    res.status(500).json({
      success: false,
      error: { code: 'UPLOAD_FAILED', message: 'File upload failed' },
    });
  }
});

const server = app.listen(PORT, () => {
  console.log(`Media Service started on port ${PORT}`);
});

process.on('SIGTERM', async () => {
  await prisma.$disconnect();
  server.close(() => process.exit(0));
});

// ==================================================
// Admin Operations (require admin role)
// ==================================================

// GET /admin/files - List all media files (admin only)
app.get('/admin/files', requireAdmin, async (req, res) => {
  try {

    const files = await prisma.mediaFile.findMany({
      select: {
        id: true,
        filename: true,
        mimeType: true,
        sizeBytes: true,
        accountId: true,
        createdAt: true,
      },
    });

    res.json({
      success: true,
      data: { files },
    });
  } catch (error) {
    console.error('Admin list files error:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Failed to list files',
      },
    });
  }
});

// DELETE /admin/files/:id - Delete any media file (admin only)
app.delete('/admin/files/:id', requireAdmin, validate(fileIdSchema), async (req, res) => {
  try {

    const fileId = req.params.id;

    const file = await prisma.mediaFile.findUnique({
      where: { id: fileId },
    });

    if (!file) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: 'File not found',
        },
      });
    }

    await prisma.mediaFile.delete({
      where: { id: fileId },
    });

    console.log('Media file deleted by admin', { adminId: req.user!.userId, fileId });

    res.json({
      success: true,
      data: {
        message: 'File deleted successfully',
      },
    });
  } catch (error) {
    console.error('Admin delete file error:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Failed to delete file',
      },
    });
  }
});

export default app;
