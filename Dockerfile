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
COPY res_raw ./res_raw
COPY .git ./.git
COPY electron ./electron

WORKDIR /shapez.io/gulp
# Build the standalone-steam variant: sets G_IS_STANDALONE=true and G_IS_STEAM_DEMO=false,
# which makes isLimitedVersion() return false so the full game is available without Steam SSO.
RUN yarn gulp build.standalone-steam

# ---- Server stage ----
FROM nginx:alpine

COPY --from=builder /shapez.io/build /usr/share/nginx/html

EXPOSE 80
