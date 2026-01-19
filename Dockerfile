# Build Stage
FROM node:18-alpine AS builder

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY tsconfig.json ./
COPY src ./src

RUN npm run build

# Production Stage
FROM node:18-alpine

WORKDIR /app

COPY package*.json ./
RUN npm install --production

COPY --from=builder /app/dist ./dist

# Cloud Run defaults to 8080, but we use PORT env
ENV PORT=8080
EXPOSE 8080

CMD ["node", "dist/server.js"]
