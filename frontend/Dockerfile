FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
ARG NEXT_PUBLIC_API_URL
ENV NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL
RUN npm run build

# NOTE: When output: "standalone" is re-enabled in next.config.ts,
# switch this back to standalone mode (COPY .next/standalone, CMD ["node", "server.js"])
FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
COPY --from=builder /app/package*.json ./
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/public ./public
COPY --from=builder /app/node_modules ./node_modules
RUN npm install -g next
EXPOSE 3001
CMD ["next", "start", "-H", "0.0.0.0", "-p", "3001"]
