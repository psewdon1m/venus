# Multi-stage Dockerfile for Media Service

ARG SERVICE_NAME=@venus/media-service
ARG SERVICE_PATH=services/media-service

FROM node:20-alpine AS base
WORKDIR /workspace
RUN corepack enable && corepack prepare pnpm@latest --activate

FROM base AS dependencies
ARG SERVICE_NAME
ARG SERVICE_PATH

COPY package.json pnpm-lock.yaml* pnpm-workspace.yaml tsconfig.json ./
COPY shared ./shared
COPY ${SERVICE_PATH} ./${SERVICE_PATH}

RUN pnpm install --filter ${SERVICE_NAME}... --frozen-lockfile

FROM dependencies AS build
ARG SERVICE_NAME
RUN pnpm --filter @venus/types run build || true
RUN pnpm --filter ${SERVICE_NAME} run build

FROM node:20-alpine AS production
WORKDIR /workspace
ENV NODE_ENV=production
ARG SERVICE_PATH

COPY --from=dependencies /workspace/node_modules ./node_modules
COPY --from=build /workspace/shared ./shared
COPY --from=build /workspace/${SERVICE_PATH} ./${SERVICE_PATH}

WORKDIR /workspace/${SERVICE_PATH}
EXPOSE 4004
CMD ["node", "dist/index.js"]
