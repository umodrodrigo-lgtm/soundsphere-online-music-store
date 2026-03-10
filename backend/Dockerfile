FROM node:20-alpine

# Create app user (never run as root)
RUN addgroup -S appgroup && adduser -S appuser -G appgroup

WORKDIR /app

# Install dependencies first (cached layer)
COPY package*.json ./
RUN npm ci --omit=dev

# Copy source
COPY src/ ./src/

# Upload folders must exist; actual files come from a mounted volume
RUN mkdir -p uploads/audio \
             uploads/images/artists \
             uploads/images/albums \
             uploads/images/banners \
             uploads/images/avatars \
    && chown -R appuser:appgroup /app

USER appuser

EXPOSE 5000

HEALTHCHECK --interval=30s --timeout=10s --start-period=15s --retries=3 \
    CMD wget -qO- http://localhost:5000/api/health || exit 1

CMD ["node", "src/server.js"]
