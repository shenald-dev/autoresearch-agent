FROM node:18-alpine AS builder

WORKDIR /app

# Install dependencies
COPY package*.json ./
RUN npm ci --only=production

# Copy source
COPY . .

# Build step (none needed for JS, but placeholder)
RUN npm run build || echo "No build step"

# Runtime image
FROM node:18-alpine
WORKDIR /app

# Copy from builder
COPY --from=builder --chown=node:node /app /app

# Create output directories
RUN mkdir -p outputs/markdown outputs/json && \
    chown -R node:node /app/outputs

USER node

# Expose port for web UI (if used)
EXPOSE 3001

# Entrypoint
ENTRYPOINT ["node", "bin/cli.js"]
CMD ["--help"]
