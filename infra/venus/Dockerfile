FROM livekit/livekit-server:v1.13.11@sha256:04668840140552c7e5d7faf28959cbf2256fb04ea641c4fd23ea69cbf3d7d105 AS media_binary
FROM node:24.22.1-bookworm-slim@sha256:2dd9a4f758e173b65fee15388f7706af6fb01ef50cf7a2c0538711d67a6981ae AS build
WORKDIR /app
COPY package.json package-lock.json .npmrc ./
COPY apps/api/package.json apps/api/
COPY apps/web/package.json apps/web/
COPY packages/contracts/package.json packages/contracts/
COPY packages/i18n/package.json packages/i18n/
COPY packages/relationship-engine/package.json packages/relationship-engine/
COPY packages/card-catalog/package.json packages/card-catalog/
RUN npm ci
COPY tsconfig*.json ./
COPY apps apps
COPY packages packages
ARG SOURCE_REVISION
ARG RELEASE_VERSION=0.0.0
RUN test -n "$SOURCE_REVISION" && npm run build && node --input-type=module -e 'import fs from "node:fs"; const version=process.env.RELEASE_VERSION; if(!/^(0|[1-9][0-9]*)\.(0|[1-9][0-9]*)\.(0|[1-9][0-9]*)$/.test(version))process.exit(1); fs.writeFileSync("build-metadata.json",JSON.stringify({version,source_revision:process.env.SOURCE_REVISION}))'
RUN npm prune --omit=dev --ignore-scripts && mkdir -p apps/api/node_modules

FROM node:24.22.1-bookworm-slim@sha256:2dd9a4f758e173b65fee15388f7706af6fb01ef50cf7a2c0538711d67a6981ae
RUN apt-get update && apt-get install -y --no-install-recommends \
    poppler-utils=22.12.0-2+deb12u3 libpoppler126=22.12.0-2+deb12u3 \
    python3=3.11.2-1+b1 python3-minimal=3.11.2-1+b1 libpython3-stdlib=3.11.2-1+b1 \
    python3.11=3.11.2-6+deb12u9 python3.11-minimal=3.11.2-6+deb12u9 \
    libpython3.11-minimal=3.11.2-6+deb12u9 libpython3.11-stdlib=3.11.2-6+deb12u9 \
    && rm -rf /var/lib/apt/lists/*
ARG SOURCE_REVISION
ARG RELEASE_VERSION=0.0.0
LABEL org.opencontainers.image.title="Venus" org.opencontainers.image.version="$RELEASE_VERSION" org.opencontainers.image.revision="$SOURCE_REVISION" org.opencontainers.image.source="https://github.com/psewdon1m/venus"
COPY --from=media_binary /livekit-server /usr/local/bin/venus-media-server
COPY third-party/livekit-server-1.13.11 /usr/share/licenses/venus/livekit-server-1.13.11
ENV NODE_ENV=production
WORKDIR /app
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/packages ./packages
COPY --from=build /app/apps/api/dist ./apps/api/dist
COPY --from=build /app/apps/api/package.json ./apps/api/package.json
COPY --from=build /app/apps/api/node_modules ./apps/api/node_modules
COPY --from=build /app/apps/api/migrations ./apps/api/migrations
COPY --from=build /app/apps/api/game-migrations ./apps/api/game-migrations
COPY --from=build /app/apps/api/catalog-migrations ./apps/api/catalog-migrations
COPY --from=build /app/apps/api/chat-migrations ./apps/api/chat-migrations
COPY --from=build /app/apps/api/music-migrations ./apps/api/music-migrations
COPY --from=build /app/apps/api/media-migrations ./apps/api/media-migrations
COPY --from=build /app/apps/api/presentation-migrations ./apps/api/presentation-migrations
COPY infra/venus/media-supervisor.mjs ./infra/venus/media-supervisor.mjs
COPY infra/venus/presentation-guardian.py infra/venus/presentation-render.py infra/venus/presentation-dependencies.json ./infra/venus/
COPY infra/venus/presentation-app-entry.mjs ./infra/venus/
COPY --from=build /app/apps/api/private-topic-migrations ./apps/api/private-topic-migrations
COPY --from=build /app/apps/web/dist ./apps/web/dist
COPY --from=build /app/package.json /app/build-metadata.json ./
RUN mkdir -p /var/lib/venus/topic-births /var/lib/venus/topic-personal /var/lib/venus/topic-personal-witness /var/lib/venus/topic-lifecycle /var/lib/venus/topic-lifecycle-witness && chmod 0700 /var/lib/venus/topic-* && chown -R node:node /var/lib/venus
USER 1000:1000
VOLUME ["/var/lib/venus"]
EXPOSE 4300
STOPSIGNAL SIGTERM
CMD ["node", "apps/api/dist/server.js"]

COPY tools/media-inventory.mjs tools/media-inventory.mjs
COPY tools/presentation-inventory.mjs tools/presentation-inventory.mjs

COPY tools/delivery-inventory.mjs tools/delivery-inventory.mjs
