# Build stage
FROM node:20-alpine AS builder

WORKDIR /app

# Copy root workspace config
COPY package.json ./

# Copy api-contract package
COPY packages/api-contract/package.json ./packages/api-contract/
COPY packages/api-contract/tsconfig.json ./packages/api-contract/
COPY packages/api-contract/src ./packages/api-contract/src

# Copy backend package
COPY apps/backend/package.json apps/backend/package-lock.json ./apps/backend/
COPY apps/backend/tsconfig.json apps/backend/tsconfig.build.json ./apps/backend/
COPY apps/backend/nest-cli.json ./apps/backend/

# Install all workspace deps
RUN npm install --workspace=@level/api-contract --workspace=@level/backend

# Build api-contract first
RUN npm run build --workspace=@level/api-contract

# Copy backend source and build
COPY apps/backend/src ./apps/backend/src
COPY apps/backend/drizzle ./apps/backend/drizzle
COPY apps/backend/drizzle.config.ts ./apps/backend/
RUN npm run build --workspace=@level/backend

# Production stage
FROM node:20-alpine

WORKDIR /app

# Copy root workspace config
COPY package.json ./

# Copy api-contract built output
COPY --from=builder /app/packages/api-contract/package.json ./packages/api-contract/
COPY --from=builder /app/packages/api-contract/dist ./packages/api-contract/dist

# Copy backend production files
COPY --from=builder /app/apps/backend/package.json ./apps/backend/
COPY --from=builder /app/apps/backend/dist ./apps/backend/dist
COPY --from=builder /app/apps/backend/drizzle ./apps/backend/drizzle
COPY --from=builder /app/apps/backend/src/db ./apps/backend/src/db
COPY --from=builder /app/apps/backend/drizzle.config.ts ./apps/backend/
COPY --from=builder /app/apps/backend/tsconfig.json ./apps/backend/

# Install production deps only
RUN npm install --workspace=@level/api-contract --workspace=@level/backend --omit=dev

# Install drizzle-kit for migrations
RUN cd apps/backend && npm install drizzle-kit

COPY apps/backend/entrypoint.sh ./apps/backend/
RUN chmod +x ./apps/backend/entrypoint.sh

EXPOSE 4000

WORKDIR /app/apps/backend
ENTRYPOINT ["./entrypoint.sh"]
