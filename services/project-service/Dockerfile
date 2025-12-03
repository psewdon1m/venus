# Multi-stage Dockerfile for Project Service

ARG SERVICE_NAME=@venus/project-service
ARG SERVICE_PATH=services/project-service

FROM node:20-alpine AS base
WORKDIR /workspace
RUN corepack enable && corepack prepare pnpm@latest --activate

FROM base AS dependencies
ARG SERVICE_NAME
ARG SERVICE_PATH

COPY package.json pnpm-lock.yaml* pnpm-workspace.yaml tsconfig.json .npmrc ./
COPY shared ./shared
COPY ${SERVICE_PATH} ./${SERVICE_PATH}
COPY .pnpm-store ./.pnpm-store
ENV PNPM_HOME=/workspace/.pnpm-store

RUN pnpm install --filter ${SERVICE_NAME}... --frozen-lockfile --offline

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
EXPOSE 4002
CMD ["node", "dist/index.js"]
