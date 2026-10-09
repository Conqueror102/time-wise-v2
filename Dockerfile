# syntax=docker/dockerfile:1

# ---- Dependencies ----
FROM node:22-alpine AS deps
WORKDIR /app
RUN corepack enable && corepack prepare pnpm@10 --activate
COPY package.json pnpm-lock.yaml ./
# Keep downloaded packages between builds so rebuilds don't re-download them
RUN --mount=type=cache,id=pnpm-store,target=/pnpm-store pnpm config set store-dir /pnpm-store && pnpm install --frozen-lockfile

# ---- Build ----
FROM node:22-alpine AS builder
WORKDIR /app
RUN corepack enable && corepack prepare pnpm@10 --activate
COPY --from=deps /app/node_modules ./node_modules
COPY . .
ENV NEXT_TELEMETRY_DISABLED=1
# Placeholders so route modules can load during the build; real values are
# supplied at runtime by docker-compose
RUN JWT_SECRET=build-time-placeholder MONGODB_URI=mongodb://build-placeholder:27017 pnpm build

# ---- Runtime ----
FROM node:22-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production \
    NEXT_TELEMETRY_DISABLED=1 \
    PORT=3000 \
    HOSTNAME=0.0.0.0

RUN addgroup -S nodejs -g 1001 && adduser -S nextjs -u 1001 -G nodejs

COPY --from=builder --chown=nextjs:nodejs /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs
EXPOSE 3000
CMD ["node", "server.js"]
