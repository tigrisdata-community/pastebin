# syntax=docker/dockerfile:1.7

# ---- Base image ----
ARG NODE_VERSION=24
FROM node:${NODE_VERSION}-alpine AS base
WORKDIR /app
ENV CI=true

# ---- Install full deps for building ----
FROM base AS deps
COPY package*.json ./
RUN npm install

# ---- Build application (tsc + tailwind) ----
FROM deps AS build
COPY tsconfig.json ./
COPY postcss.config.js ./
COPY src ./src
# Build JS and CSS
RUN npm run build
# Copy static assets and views into the dist folder expected at runtime
RUN mkdir -p dist/public dist/views \
  && cp -r src/public/* dist/public/ \
  && cp -r src/views/* dist/views/

# ---- Production-only dependencies ----
FROM base AS prod-deps
COPY package*.json ./
RUN npm ci --omit=dev

# ---- Runtime image ----
FROM node:${NODE_VERSION}-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV PORT=3333

# Run as non-root user for security
USER node

# Copy only the needed runtime artifacts
COPY --chown=node:node --from=prod-deps /app/node_modules ./node_modules
COPY --chown=node:node package*.json ./
COPY --chown=node:node --from=build /app/dist ./dist

EXPOSE 3333
# Simple healthcheck hitting the root page
HEALTHCHECK --interval=30s --timeout=3s --start-period=20s --retries=3 CMD wget -q -O - http://127.0.0.1:${PORT}/ || exit 1

CMD ["node", "dist/main.js"]
