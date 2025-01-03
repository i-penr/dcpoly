FROM imbios/bun-node

WORKDIR /app

COPY ./ ./

RUN bun install --frozen-lockfile

CMD ["bun", "start"]