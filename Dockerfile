FROM node:20-alpine AS builder

WORKDIR /app

# Install dependencies
COPY package*.json ./
RUN npm ci

# Copy source
COPY . .

# Build TypeScript
RUN npm run build

# Runtime image
FROM node:20-alpine
WORKDIR /app

# Copy built app and production deps
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./

# Create output directories
RUN mkdir -p outputs/markdown outputs/json

# Entrypoint
ENTRYPOINT ["node", "dist/index.js"]
CMD ["--help"]
