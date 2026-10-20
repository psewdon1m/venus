FROM node:24.22.0-bookworm-slim@sha256:a5f4366e834695d5f363b920c104953a535d3a9864d1bdf74566a0ebe01daee5 AS build
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
RUN test -n "$SOURCE_REVISION" && npm run build && node --input-type=module -e 'import fs from "node:fs"; fs.writeFileSync("build-metadata.json",JSON.stringify({version:"0.0.0",source_revision:process.env.SOURCE_REVISION}))'
RUN npm prune --omit=dev --ignore-scripts && mkdir -p apps/api/node_modules

FROM node:24.22.0-bookworm-slim@sha256:a5f4366e834695d5f363b920c104953a535d3a9864d1bdf74566a0ebe01daee5
ARG SOURCE_REVISION
LABEL org.opencontainers.image.title="Venus" org.opencontainers.image.version="0.0.0" org.opencontainers.image.revision="$SOURCE_REVISION" org.opencontainers.image.source="https://github.com/psewdon1m/venus"
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
COPY --from=build /app/apps/api/private-topic-migrations ./apps/api/private-topic-migrations
COPY --from=build /app/apps/web/dist ./apps/web/dist
COPY --from=build /app/package.json /app/build-metadata.json ./
RUN mkdir -p /var/lib/venus/topic-births /var/lib/venus/topic-personal /var/lib/venus/topic-personal-witness /var/lib/venus/topic-lifecycle /var/lib/venus/topic-lifecycle-witness && chmod 0700 /var/lib/venus/topic-* && chown -R node:node /var/lib/venus
USER 1000:1000
VOLUME ["/var/lib/venus"]
EXPOSE 4300
STOPSIGNAL SIGTERM
CMD ["node", "apps/api/dist/server.js"]
