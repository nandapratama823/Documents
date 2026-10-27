FROM node:22-alpine
WORKDIR /app
COPY package.json pnpm-lock.yaml* ./
RUN corepack enable && pnpm install --prod --frozen-lockfile=false
COPY . .
ENV PORT=8765
EXPOSE 8765
CMD ["node", "server/index.mjs"]
