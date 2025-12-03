# Multi-stage Dockerfile for API Gateway

ARG SERVICE_NAME=@venus/api-gateway
ARG SERVICE_PATH=services/api-gateway

# ==================================================
# Base stage
# ==================================================
FROM node:20-alpine AS base
WORKDIR /workspace
RUN corepack enable && corepack prepare pnpm@latest --activate

# ==================================================
# Dependencies stage
# ==================================================
FROM base AS dependencies
ARG SERVICE_NAME
ARG SERVICE_PATH

# Copy workspace manifests and scoped packages
COPY package.json pnpm-lock.yaml* pnpm-workspace.yaml tsconfig.json ./
COPY shared ./shared
COPY ${SERVICE_PATH} ./${SERVICE_PATH}

# Install only the service and its dependencies
RUN pnpm install --filter ${SERVICE_NAME}... --frozen-lockfile

# ==================================================
# Build stage
# ==================================================
FROM dependencies AS build
ARG SERVICE_NAME

# Build shared types (if present) and the service itself
RUN pnpm --filter @venus/types run build || true
RUN pnpm --filter ${SERVICE_NAME} run build

# ==================================================
# Production stage
# ==================================================
FROM node:20-alpine AS production
WORKDIR /workspace
ENV NODE_ENV=production
ARG SERVICE_PATH

COPY --from=dependencies /workspace/node_modules ./node_modules
COPY --from=build /workspace/shared ./shared
COPY --from=build /workspace/${SERVICE_PATH} ./${SERVICE_PATH}

WORKDIR /workspace/${SERVICE_PATH}
EXPOSE 4000
CMD ["node", "dist/index.js"]
