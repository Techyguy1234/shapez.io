# ---- Builder stage ----
FROM node:18 AS builder

WORKDIR /shapez.io

RUN apt-get update && apt-get install -y --no-install-recommends \
    ffmpeg default-jre \
    && apt-get clean \
    && rm -rf /var/lib/apt/lists/*

COPY package.json yarn.lock ./
RUN yarn

COPY gulp ./gulp
WORKDIR /shapez.io/gulp
RUN yarn

WORKDIR /shapez.io
COPY res ./res
COPY src/html ./src/html
COPY src/css ./src/css
COPY version ./version
COPY sync-translations.js ./
COPY translations ./translations
COPY src/js ./src/js
RUN cp src/js/core/config.local.template.js src/js/core/config.local.js
COPY res_raw ./res_raw
COPY .git ./.git
COPY electron ./electron
WORKDIR /shapez.io/gulp
# NODE_OPTIONS required for Node 18 + OpenSSL 3 compatibility with the bundled webpack 4
ENV NODE_OPTIONS=--openssl-legacy-provider
RUN yarn gulp build.web-shapezio

# ---- Server stage ----
FROM nginx:alpine

COPY --from=builder /shapez.io/build /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80
