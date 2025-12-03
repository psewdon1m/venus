# Multi-stage Dockerfile for Venus Frontend (Next.js)

# ==================================================
# Base stage
# ==================================================
FROM node:20-alpine AS base
WORKDIR /app

# Install pnpm
RUN corepack enable && corepack prepare pnpm@latest --activate

# ==================================================
# Dependencies stage
# ==================================================
FROM base AS dependencies

# Copy package files
COPY package.json pnpm-lock.yaml* ./

# Install dependencies
RUN pnpm install --frozen-lockfile

# ==================================================
# Build stage
# ==================================================
FROM base AS build

# Copy dependencies
COPY --from=dependencies /app/node_modules ./node_modules

# Copy source code
COPY . .

# Copy shared types if needed
# COPY ../shared/types ./shared/types

# Build Next.js application
RUN pnpm build

# ==================================================
# Production stage
# ==================================================
FROM base AS production

ENV NODE_ENV=production

# Copy built application
COPY --from=build /app/.next ./.next
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/package.json ./package.json
COPY --from=build /app/public ./public
COPY --from=build /app/next.config.ts ./

# Create non-root user
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001

USER nodejs

EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:3000/api/health || exit 1

CMD ["pnpm", "start"]

# ==================================================
# Development stage
# ==================================================
FROM base AS development

ENV NODE_ENV=development

# Install all dependencies (including devDependencies)
COPY package.json pnpm-lock.yaml* ./
RUN pnpm install

# Copy source
COPY . .

EXPOSE 3000

CMD ["pnpm", "dev"]