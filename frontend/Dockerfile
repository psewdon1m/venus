# Multi-stage Dockerfile for Venus Frontend (Next.js)

ARG SERVICE_NAME=frontend
ARG SERVICE_PATH=frontend

FROM node:20-alpine AS base
WORKDIR /workspace
RUN apk add --no-cache curl && \
    corepack enable && corepack prepare pnpm@latest --activate

FROM base AS dependencies
ARG SERVICE_NAME
ARG SERVICE_PATH

COPY package.json pnpm-lock.yaml* pnpm-workspace.yaml tsconfig.json .npmrc ./
COPY shared ./shared
COPY ${SERVICE_PATH} ./${SERVICE_PATH}

RUN --mount=type=cache,id=pnpm-store,target=/workspace/.pnpm-store \
    pnpm install --filter ${SERVICE_NAME}... --frozen-lockfile --prefer-offline --store-dir=/workspace/.pnpm-store

FROM dependencies AS build
ARG SERVICE_NAME
RUN pnpm --filter @venus/types run build || true
RUN pnpm --filter ${SERVICE_NAME} run build

FROM node:20-alpine AS production
WORKDIR /workspace
ENV NODE_ENV=production
ARG SERVICE_PATH
RUN apk add --no-cache curl && \
    corepack enable && corepack prepare pnpm@latest --activate

COPY --from=dependencies /workspace/node_modules ./node_modules
COPY --from=build /workspace/shared ./shared
COPY --from=build /workspace/${SERVICE_PATH} ./${SERVICE_PATH}

WORKDIR /workspace/${SERVICE_PATH}
EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:3000/api/health || exit 1

CMD ["pnpm", "start"]
