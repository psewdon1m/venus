# AI-CV Service

AI-powered CV generation microservice for Venus Platform.

## Responsibilities

- CV generation from persona data
- AI-powered content optimization
- Template selection and customization
- PDF generation and formatting
- CV analytics and improvement suggestions
- Multi-language CV generation

## API Endpoints

### CV Generation
- `POST /cv/generate` - Generate CV from persona
- `GET /cv/:id` - Get generated CV details
- `GET /cv/:id/download` - Download CV as PDF
- `PUT /cv/:id` - Update CV content
- `DELETE /cv/:id` - Delete generated CV

### Templates
- `GET /cv/templates` - List available CV templates
- `GET /cv/templates/:id` - Get template details
- `POST /cv/templates/:id/preview` - Preview CV with template

### Analytics
- `GET /cv/:id/analytics` - Get CV performance analytics
- `POST /cv/:id/optimize` - Get AI optimization suggestions

### Health
- `GET /health` - Service health check

## Environment Variables

See [`.env.example`](../../.env.example) for configuration options.

**Required:**
- `DATABASE_URL` - PostgreSQL connection string
- `JWT_SECRET` - Secret for JWT validation
- `OPENAI_API_KEY` - OpenAI API key for CV generation
- `REDIS_URL` - Redis connection string (optional, for caching)
- `PDF_GENERATOR_URL` - PDF generation service URL (optional)

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
docker build -t venus/ai-cv-service .

# Run container
docker run -p 4005:4005 --env-file .env venus/ai-cv-service
```

## Architecture

```
Client Request
    ↓
AI-CV Service (Express + OpenAI)
    ├─→ POST /cv/generate → Get Persona Data → Generate Content with AI → Create PDF
    ├─→ GET /cv/:id → Find CV Record → Return Details + Download Link
    ├─→ POST /cv/:id/optimize → Analyze CV → Generate Suggestions → Return Tips
    └─→ GET /cv/templates → Query Templates → Return Available Options
         ↓
    PostgreSQL (CVs, Templates)
    OpenAI API (Content Generation)
    PDF Generator (Document Creation)
    Redis (Cache)
```

## Features

- AI-powered content generation and optimization
- Multiple CV templates (Modern, Classic, Creative, Technical)
- Multi-language support (EN, RU, DE, FR, ES)
- PDF export with professional formatting
- CV analytics and performance tracking
- Content suggestions and improvements
- Template customization options

## AI Capabilities

- **Content Generation:** Creates compelling descriptions from project data
- **Optimization:** Suggests improvements for ATS compatibility
- **Language Translation:** Generates CVs in multiple languages
- **Template Matching:** Recommends best templates for specific roles
- **Keyword Analysis:** Identifies relevant keywords for job applications

## Status

**Current:** Initialization complete, endpoints stubbed
**Next:** Implement CV generation logic with OpenAI integration (Этап 1.3)

## Related

- Database schema: [`../../infrastructure/postgres/schema.prisma`](../../infrastructure/postgres/schema.prisma)
- Shared types: [`../../shared/types`](../../shared/types)
- Documentation: [`../../docs/stages.md`](../../docs/stages.md) section 1.3
