FROM node:lts-alpine

ARG NODE_ENV=production
ENV NODE_ENV=$NODE_ENV

WORKDIR /usr/src/app

# Install system dependencies
RUN apk add --no-cache \
    ffmpeg \
    python3 \
    dumb-init \
    curl

# Copy package files
COPY ["package.json", "package-lock.json*", "npm-shrinkwrap.json*", "./"]

# Install dependencies
RUN npm ci --only=production --silent && \
    npm cache clean --force && \
    mv node_modules ../

# Copy application
COPY . .

# Create non-root user
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001 && \
    chown -R nodejs:nodejs /usr/src/app /usr/src/node_modules

# Create logs directory
RUN mkdir -p /usr/src/app/logs && chown nodejs:nodejs /usr/src/app/logs

USER nodejs

EXPOSE 8000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD curl -f http://localhost:8000/ping || exit 1

ENTRYPOINT ["/usr/bin/dumb-init", "--"]
CMD ["node", "src/index.js"]
