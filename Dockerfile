# ---- Builder stage ----
FROM node:22-alpine AS builder

WORKDIR /app

COPY package*.json ./
COPY nest-cli.json ./
COPY tsconfig.json ./
COPY apps/main/tsconfig.app.json ./apps/main/tsconfig.app.json

RUN npm ci

COPY apps/main ./apps/main

RUN npm run build

# ---- Runtime stage ----
FROM node:22-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production

COPY package*.json ./
RUN npm ci --omit=dev

COPY --from=builder /app/dist ./dist

RUN mkdir -p uploads

EXPOSE 3000

CMD ["node", "dist/apps/main/main"]
