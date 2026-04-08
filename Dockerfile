<<<<<<< HEAD
FROM node:20-alpine AS builder
=======
FROM node:18-alpine AS builder
>>>>>>> e1d6a9b (perf(engine): optimize context string buffering (#32))

WORKDIR /app

# Install dependencies
COPY package*.json ./
<<<<<<< HEAD
RUN npm ci
=======
RUN npm ci --only=production
>>>>>>> e1d6a9b (perf(engine): optimize context string buffering (#32))

# Copy source
COPY . .

<<<<<<< HEAD
# Build TypeScript
RUN npm run build

# Runtime image
FROM node:20-alpine
WORKDIR /app

# Copy built app and production deps
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./
=======
# Build step (none needed for JS, but placeholder)
RUN npm run build || echo "No build step"

# Runtime image
FROM node:18-alpine
WORKDIR /app

# Copy from builder
COPY --from=builder /app /app
>>>>>>> e1d6a9b (perf(engine): optimize context string buffering (#32))

# Create output directories
RUN mkdir -p outputs/markdown outputs/json

<<<<<<< HEAD
# Entrypoint
ENTRYPOINT ["node", "dist/index.js"]
=======
# Expose port for web UI (if used)
EXPOSE 3001

# Entrypoint
ENTRYPOINT ["node", "bin/cli.js"]
>>>>>>> e1d6a9b (perf(engine): optimize context string buffering (#32))
CMD ["--help"]
