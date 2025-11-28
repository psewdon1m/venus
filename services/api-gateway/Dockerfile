# Multi-stage Dockerfile for Auth Service

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
COPY ../../shared/types/package.json ../../shared/types/

# Install dependencies
RUN pnpm install --frozen-lockfile

# ==================================================
# Build stage
# ==================================================
FROM base AS build

# Copy dependencies
COPY --from=dependencies /app/node_modules ./node_modules
COPY --from=dependencies /app/../../shared ./../../shared

# Copy source code
COPY . .

# Build TypeScript
RUN pnpm build

# ==================================================
# Production stage
# ==================================================
FROM base AS production

ENV NODE_ENV=production

# Copy built application
COPY --from=build /app/dist ./dist
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/package.json ./package.json

# Create non-root user
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001

USER nodejs

EXPOSE 4001

CMD ["node", "dist/index.js"]

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

EXPOSE 4001

CMD ["pnpm", "dev"]
