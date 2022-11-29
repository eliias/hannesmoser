FROM ruby:3.0.4 AS builder

WORKDIR /app

COPY Gemfile ./
COPY Gemfile.lock ./

RUN bundle install

COPY . ./

RUN bundle exec jekyll build

FROM nginx:1-alpine

RUN mkdir -p /app
COPY CHECKS /app/CHECKS

WORKDIR /usr/share/nginx/html
COPY --from=builder /app/_site .

EXPOSE 80
