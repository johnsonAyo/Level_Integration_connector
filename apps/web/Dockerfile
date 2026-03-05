# Build stage
FROM node:20-alpine AS builder

WORKDIR /app

# Enable Next.js standalone output for smaller image size
ENV NEXT_TELEMETRY_DISABLED=1

# Copy workspace config and lockfile
COPY package.json package-lock.json ./

# Copy api-contract
COPY packages/api-contract/package.json ./packages/api-contract/
COPY packages/api-contract/tsconfig.json ./packages/api-contract/
COPY packages/api-contract/src ./packages/api-contract/src

# Copy web app config
COPY apps/web/package.json ./apps/web/
COPY apps/web/tsconfig.json ./apps/web/
COPY apps/web/next.config.ts ./apps/web/
COPY apps/web/postcss.config.mjs ./apps/web/
COPY apps/web/eslint.config.mjs ./apps/web/

# Install workspace deps
RUN npm install --workspace=@level/api-contract --workspace=@level/web

# Build api-contract
RUN npm run build --workspace=@level/api-contract

# Copy web source and build
COPY apps/web/src ./apps/web/src
COPY apps/web/public ./apps/web/public
RUN npm run build --workspace=@level/web

# Production stage
FROM node:20-alpine

WORKDIR /app
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3000

# Copy Next.js standalone output
# Next.js standalone mode bundles dependencies automatically
COPY --from=builder /app/apps/web/public ./apps/web/public
COPY --from=builder /app/apps/web/.next/standalone ./
COPY --from=builder /app/apps/web/.next/static ./apps/web/.next/static

EXPOSE 3000

# Standalone output puts the server file at apps/web/server.js relative to the project root
CMD ["node", "apps/web/server.js"]
