# syntax=docker/dockerfile:1

FROM node:22-alpine AS dependencies
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci

FROM dependencies AS prisma-generator
COPY prisma ./prisma
# Prisma validates the URL format during generation but does not connect to it.
ENV DATABASE_URL="mysql://placeholder:placeholder@localhost:3306/placeholder"
RUN npx prisma generate

FROM node:22-alpine AS runtime
WORKDIR /app
ENV NODE_ENV=production \
    PORT=5000

# Prisma's Alpine engine needs OpenSSL at runtime.
RUN apk add --no-cache openssl \
    && addgroup -S -g 1001 cloudcart \
    && adduser -S -u 1001 -G cloudcart cloudcart

COPY package.json package-lock.json ./
RUN npm ci --omit=dev && npm cache clean --force

# The generated client and its musl query engine come from the build stage.
# Prisma CLI is a production management dependency so migrations can be run
# explicitly inside this container; startup never runs them automatically.
COPY --from=prisma-generator /app/node_modules/.prisma ./node_modules/.prisma
COPY --chown=cloudcart:cloudcart src ./src
COPY --chown=cloudcart:cloudcart prisma ./prisma
RUN mkdir uploads && chown cloudcart:cloudcart uploads
COPY --chown=cloudcart:cloudcart uploads/.gitkeep ./uploads/.gitkeep

USER cloudcart
EXPOSE 5000
CMD ["node", "src/wait-for-db.js"]
