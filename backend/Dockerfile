FROM oven/bun:1

WORKDIR /app

COPY backend/package.json ./
RUN bun install

COPY backend .

EXPOSE 3000

CMD ["bun", "run", "src/index.ts"]
