// Venus Platform - Media Service
// Media processing, upload, and storage microservice

import path from 'path';

import { PutObjectCommand, S3Client } from '@aws-sdk/client-s3';
import { PrismaClient } from '@prisma/client';
import cors from 'cors';
import { config } from 'dotenv';
import express, {
  json,
  type Express,
  type NextFunction,
  type Request,
  type Response,
} from 'express';
import helmet from 'helmet';
import multer, { memoryStorage } from 'multer';
import { z, ZodError, type ZodTypeAny } from 'zod';

import type { HealthCheckResponse } from '@venus/types';
import { authenticateToken, requireAdmin, type AuthenticatedRequest } from './middleware/auth';
import { logger } from './utils/logger';

config();

interface ValidatedFile {
  buffer: Buffer;
  originalname: string;
  mimetype: string;
  size: number;
  detectedMime: string;
  ext: string;
}

interface ValidatedFileRequest extends AuthenticatedRequest {
  validatedFile?: ValidatedFile;
}

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

const validate = (schema: ZodTypeAny) => {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      schema.parse(req);
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        res.status(400).json({
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Invalid input data',
            details: error.errors,
          },
        });
        return;
      }
      next(error);
    }
  };
};

const app: Express = express();
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
app.use(json({ limit: '50mb' }));

// Configure multer for file uploads
const storage = memoryStorage();
const upload = multer({
  storage,
  limits: {
    fileSize: 50 * 1024 * 1024, // 50MB
  },
});

// File validation middleware
const validateFile = async (
  req: ValidatedFileRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  const file = req.file;

  if (!file) {
    res.status(400).json({
      success: false,
      error: { code: 'NO_FILE', message: 'No file uploaded' },
    });
    return;
  }

  // Check file extension
  const allowedExtensions = ['.jpg', '.jpeg', '.png', '.webp', '.avif', '.svg', '.gif', '.mp4', '.webm', '.pdf'];
  const ext = path.extname(file.originalname).toLowerCase();
  if (!allowedExtensions.includes(ext)) {
    res.status(400).json({
      success: false,
      error: { code: 'INVALID_FILE_TYPE', message: 'File type not allowed' },
    });
    return;
  }

  // Check magic bytes
  try {
    // TODO: Re-enable file type validation when file-type dependency is installed
    // if (!fileType) {
    //   res.status(400).json({
    //     success: false,
    //     error: { code: 'INVALID_FILE', message: 'Could not determine file type' },
    //   });
    //   return;
    // }

    // // Validate mime type matches extension
    // const allowedMimeTypes = [
    //   'image/jpeg', 'image/png', 'image/webp', 'image/avif', 'image/svg+xml', 'image/gif',
    //   'video/mp4', 'video/webm',
    //   'application/pdf'
    // ];

    // if (!allowedMimeTypes.includes(fileType.mime)) {
    //   res.status(400).json({
    //     success: false,
    //     error: { code: 'INVALID_MIME_TYPE', message: 'File mime type not allowed' },
    //   });
    //   return;
    // }

    // Store validated file info (basic validation only)
    req.validatedFile = {
      buffer: file.buffer,
      originalname: file.originalname,
      mimetype: file.mimetype,
      size: file.size,
      detectedMime: file.mimetype,
      ext: path.extname(file.originalname).slice(1),
    };

    next();
  } catch (error) {
    res.status(400).json({
      success: false,
      error: { code: 'FILE_VALIDATION_ERROR', message: 'File validation failed' },
    });
    return;
  }
};

// Health check
app.get('/health', async (_req, res) => {
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
app.post(
  '/media/upload',
  authenticateToken,
  upload.single('file'),
  validateFile,
  validate(uploadFileSchema),
  async (req: ValidatedFileRequest, res) => {
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
    logger.error('Upload error', { error });
    res.status(500).json({
      success: false,
      error: { code: 'UPLOAD_FAILED', message: 'File upload failed' },
    });
  }
});

const server = app.listen(PORT, () => {
  logger.info(`Media Service started on port ${PORT}`);
});

process.on('SIGTERM', () => {
  prisma
    .$disconnect()
    .catch((error) => logger.error('Prisma disconnect error', { error }))
    .finally(() => server.close(() => process.exit(0)));
});

// ==================================================
// Admin Operations (require admin role)
// ==================================================

// GET /admin/files - List all media files (admin only)
app.get('/admin/files', requireAdmin, async (_req: AuthenticatedRequest, res) => {
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
    logger.error('Admin list files error', { error });
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
app.delete(
  '/admin/files/:id',
  requireAdmin,
  validate(fileIdSchema),
  async (req: AuthenticatedRequest, res): Promise<void> => {
  try {

    const fileId = req.params.id;

    const file = await prisma.mediaFile.findUnique({
      where: { id: fileId },
    });

    if (!file) {
      res.status(404).json({
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: 'File not found',
        },
      });
      return;
    }

    await prisma.mediaFile.delete({
      where: { id: fileId },
    });

    logger.info('Media file deleted by admin', { adminId: req.user!.userId, fileId });

    res.json({
      success: true,
      data: {
        message: 'File deleted successfully',
      },
    });
  } catch (error) {
    logger.error('Admin delete file error', { error });
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
