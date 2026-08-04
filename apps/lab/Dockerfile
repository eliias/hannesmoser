FROM node:26-alpine AS builder

WORKDIR /app

RUN npm install -g pnpm@11

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./

RUN pnpm install --frozen-lockfile

COPY . ./

RUN pnpm build

FROM nginx:1-alpine

RUN mkdir -p /app
COPY app.json /app/app.json

WORKDIR /usr/share/nginx/html
COPY --from=builder /app/out .

EXPOSE 80
