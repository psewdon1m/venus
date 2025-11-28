# Media Service

Media management and file processing microservice for Venus Platform.

## Responsibilities

- File upload and storage management
- Image processing and optimization
- Video/audio processing
- Cloud storage integration (Cloudflare R2)
- Media metadata extraction
- CDN integration and caching

## API Endpoints

### Media Upload
- `POST /media/upload` - Upload single file
- `POST /media/upload/batch` - Upload multiple files
- `GET /media/:id` - Get media details
- `DELETE /media/:id` - Delete media file

### Processing
- `POST /media/:id/process` - Process uploaded media
- `GET /media/:id/status` - Get processing status
- `GET /media/:id/download` - Download processed media

### Health
- `GET /health` - Service health check

## Environment Variables

See [`.env.example`](../../.env.example) for configuration options.

**Required:**
- `DATABASE_URL` - PostgreSQL connection string
- `JWT_SECRET` - Secret for JWT validation
- `CLOUDFLARE_R2_ACCESS_KEY` - Cloudflare R2 access key
- `CLOUDFLARE_R2_SECRET_KEY` - Cloudflare R2 secret key
- `CLOUDFLARE_R2_BUCKET` - Cloudflare R2 bucket name
- `CLOUDFLARE_R2_PUBLIC_URL` - Cloudflare R2 public URL
- `REDIS_URL` - Redis connection string (optional, for caching)

## Development

```bash
# Install dependencies
pnpm install

# Run in development mode
pnpm dev

# Build
pnpm build

# Run tests
pnpm test

# Lint
pnpm lint
```

## Docker

```bash
# Build image
docker build -t venus/media-service .

# Run container
docker run -p 4004:4004 --env-file .env venus/media-service
```

## Architecture

```
Client Request
    ↓
Media Service (Express + Multer)
    ├─→ POST /media/upload → Validate File → Upload to R2 → Save Metadata
    ├─→ POST /media/:id/process → Queue Processing → Process File → Update DB
    ├─→ GET /media/:id → Check Permissions → Return Metadata + CDN URL
    └─→ DELETE /media/:id → Check Permissions → Delete from R2 → Remove DB Record
         ↓
    PostgreSQL (Media Records)
    Cloudflare R2 (File Storage)
    Redis (Processing Queue)
```

## Features

- Support for images, videos, audio, documents
- Automatic image resizing and optimization
- Video transcoding and thumbnail generation
- File type validation and virus scanning
- CDN integration with caching headers
- Batch upload with progress tracking
- Media analytics and usage statistics

## Supported Formats

**Images:** JPEG, PNG, WebP, GIF, SVG
**Videos:** MP4, WebM, MOV, AVI
**Audio:** MP3, WAV, AAC, OGG
**Documents:** PDF, DOC, DOCX, TXT

## Status

**Current:** Initialization complete, endpoints stubbed
**Next:** Implement file upload and processing logic (Этап 1.3)

## Related

- Database schema: [`../../infrastructure/postgres/schema.prisma`](../../infrastructure/postgres/schema.prisma)
- Shared types: [`../../shared/types`](../../shared/types)
- Documentation: [`../../docs/stages.md`](../../docs/stages.md) section 1.3
