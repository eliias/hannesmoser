FROM mhart/alpine-node:16 AS builder

WORKDIR /app

COPY package.json yarn.lock ./

RUN yarn

COPY . ./

RUN yarn build

FROM nginx:1-alpine

RUN mkdir -p /app
COPY CHECKS /app/CHECKS

WORKDIR /usr/share/nginx/html
COPY --from=builder /app/public .

EXPOSE 80
