# ─── Stage 1: Dependency Builder ─────────────────────────────────────────────
FROM node:20-alpine AS builder

WORKDIR /app

# Copy package files first for layer caching
COPY package.json package-lock.json ./

# Install all dependencies (including devDeps for build tooling)
RUN npm ci --ignore-scripts

# ─── Stage 2: Production Image ────────────────────────────────────────────────
FROM node:20-alpine AS production

# Install dumb-init for proper PID 1 signal handling (graceful shutdown)
RUN apk add --no-cache dumb-init

WORKDIR /app

# Set production environment
ENV NODE_ENV=production

# Copy only production node_modules from builder stage
COPY --from=builder /app/node_modules ./node_modules

# Copy application source
COPY . .

# Remove dev files not needed in production
RUN rm -rf .env.example fix-google-id-migration.js README.md

# Run as non-root user (principle of least privilege)
USER node

# Expose API port
EXPOSE 3000

# Use dumb-init as PID 1 so Node.js receives SIGTERM/SIGINT correctly
ENTRYPOINT ["dumb-init", "--"]
CMD ["node", "server.js"]
