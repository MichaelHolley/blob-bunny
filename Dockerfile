# syntax=docker/dockerfile:1

# --- Dependencies stage -------------------------------------------------------
FROM oven/bun:1 AS deps
WORKDIR /app

# Install only production dependencies using the frozen lockfile.
COPY package.json bun.lock ./
RUN bun install --frozen-lockfile --production

# --- Runtime stage ------------------------------------------------------------
FROM oven/bun:1 AS runtime
WORKDIR /app

ENV NODE_ENV=production \
    PORT=3000 \
    BLOB_BUNNY_DATA_DIR=/data/blob-data

# Bring in the resolved dependencies and application source.
COPY --from=deps /app/node_modules ./node_modules
COPY package.json bun.lock tsconfig.json ./
COPY src ./src

# Persist the SQLite metadata DB and blob files here.
# blobs.db is created relative to the working directory, so run from /data.
RUN mkdir -p /data/blob-data && chown -R bun:bun /data /app
VOLUME ["/data"]
WORKDIR /data

USER bun
EXPOSE 3000

CMD ["bun", "run", "/app/src/index.ts"]
