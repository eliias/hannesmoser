FROM ruby:3.3.4 AS builder

WORKDIR /app

# Install Node.js and pnpm
RUN apt-get update && apt-get install -y curl gnupg \
  && curl -fsSL https://deb.nodesource.com/setup_18.x | bash - \
  && apt-get install -y nodejs \
  && npm install -g pnpm \
  && rm -rf /var/lib/apt/lists/*

COPY Gemfile ./
COPY Gemfile.lock ./

RUN bundle install

COPY package.json ./
COPY pnpm-lock.yaml ./

RUN pnpm install

COPY . ./

RUN bundle exec jekyll build

FROM nginx:1-alpine

RUN mkdir -p /app
COPY app.json /app/app.json

WORKDIR /usr/share/nginx/html
COPY --from=builder /app/_site .

EXPOSE 80
