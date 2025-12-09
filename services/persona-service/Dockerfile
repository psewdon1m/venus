# Multi-stage Dockerfile for Persona Service

ARG SERVICE_NAME=@venus/persona-service
ARG SERVICE_PATH=services/persona-service
ARG DATABASE_URL=postgresql://postgres:password@postgres:5432/venus_dev
ARG PNPM_VERSION=9.12.3

FROM node:20-alpine AS base
ARG PNPM_VERSION
ARG DATABASE_URL
ENV DATABASE_URL=${DATABASE_URL}
WORKDIR /workspace
RUN corepack enable && corepack prepare pnpm@${PNPM_VERSION} --activate
RUN apk add --no-cache python3 make g++
RUN apk add --no-cache curl \
    && wget -q -O /tmp/libcrypto1.1.apk https://dl-cdn.alpinelinux.org/alpine/v3.18/community/x86_64/libcrypto1.1-1.1.1u-r1.apk \
    && wget -q -O /tmp/libssl1.1.apk https://dl-cdn.alpinelinux.org/alpine/v3.18/community/x86_64/libssl1.1-1.1.1u-r1.apk \
    && apk add --no-cache --allow-untrusted /tmp/libcrypto1.1.apk /tmp/libssl1.1.apk \
    && rm /tmp/libcrypto1.1.apk /tmp/libssl1.1.apk

FROM base AS dependencies
ARG SERVICE_NAME
ARG SERVICE_PATH
ARG DATABASE_URL
ENV DATABASE_URL=${DATABASE_URL}

COPY package.json pnpm-lock.yaml* pnpm-workspace.yaml tsconfig.json .npmrc ./
COPY shared ./shared
COPY infrastructure ./infrastructure
COPY ${SERVICE_PATH} ./${SERVICE_PATH}

RUN --mount=type=cache,id=pnpm-store,target=/workspace/.pnpm-store \
    pnpm install --filter ${SERVICE_NAME}... --frozen-lockfile --prefer-offline --store-dir=/workspace/.pnpm-store
RUN pnpm prisma generate --schema infrastructure/postgres/schema.prisma

FROM dependencies AS build
ARG SERVICE_NAME
RUN pnpm --filter @venus/types run build || true
RUN pnpm --filter ${SERVICE_NAME} run build

FROM dependencies AS development
ARG SERVICE_PATH
WORKDIR /workspace/${SERVICE_PATH}
ENV NODE_ENV=development
CMD ["sh", "-c", "pnpm dev"]

FROM node:20-alpine AS production
WORKDIR /workspace
ENV NODE_ENV=production
ARG SERVICE_PATH
RUN apk add --no-cache curl \
    && wget -q -O /tmp/libcrypto1.1.apk https://dl-cdn.alpinelinux.org/alpine/v3.18/community/x86_64/libcrypto1.1-1.1.1u-r1.apk \
    && wget -q -O /tmp/libssl1.1.apk https://dl-cdn.alpinelinux.org/alpine/v3.18/community/x86_64/libssl1.1-1.1.1u-r1.apk \
    && apk add --no-cache --allow-untrusted /tmp/libcrypto1.1.apk /tmp/libssl1.1.apk \
    && rm /tmp/libcrypto1.1.apk /tmp/libssl1.1.apk

COPY --from=dependencies /workspace/node_modules ./node_modules
COPY --from=build /workspace/shared ./shared
COPY --from=build /workspace/${SERVICE_PATH} ./${SERVICE_PATH}

WORKDIR /workspace/${SERVICE_PATH}
EXPOSE 4003
CMD ["node", "dist/index.js"]
