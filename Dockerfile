# ==========================================
# Stage 1: Build Frontend & Backend
# ==========================================
FROM node:20-alpine AS builder
WORKDIR /app

# Install dependencies
COPY package.json package-lock.json* ./
RUN npm ci || npm install

# Copy configuration files and source code
COPY index.html ./
COPY vite.config.ts ./
COPY tsconfig*.json ./
COPY tailwind.config.js postcss.config.js ./
COPY src/ ./src/
COPY server/ ./server/

# Build client (dist) and server (server/dist)
RUN npm run build

# ==========================================
# Stage 2: Production Runtime
# ==========================================
FROM node:20-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV PORT=5000
ENV HOST=0.0.0.0
ENV DATA_DIR=/app/server/data

# Install production dependencies only
COPY package.json package-lock.json* ./
RUN npm install --omit=dev && npm cache clean --force

# Copy compiled frontend and backend assets from builder
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/server/dist ./server/dist

# Ensure data directory exists
RUN mkdir -p /app/server/data

# Persist database directory
VOLUME ["/app/server/data"]

EXPOSE 5000

# Healthcheck endpoint
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://127.0.0.1:5000/api/health || exit 1

CMD ["node", "server/dist/index.js"]
