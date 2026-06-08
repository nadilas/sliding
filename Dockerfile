FROM oven/bun:1 AS base
WORKDIR /app

# Install dependencies
COPY package.json bun.lockb bun.lock .npmrc ./
RUN bun install --frozen-lockfile

# Copy source
COPY . .

# Build
RUN bun run build

# Production
FROM oven/bun:1-slim AS production
WORKDIR /app

ENV NODE_ENV=production
ENV PORT=3000

# Copy from builder
COPY --from=base /app/.output ./.output
COPY --from=base /app/package.json ./
COPY --from=base /app/bun.lockb /app/bun.lock ./
RUN bun install --frozen-lockfile --production

EXPOSE 3000

CMD ["bun", ".output/server/index.mjs"]
