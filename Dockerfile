FROM node:slim AS development

WORKDIR /usr/src/app

COPY --chown=node:node package*.json ./

RUN yarn install --frozen-lockfile

COPY --chown=node:node . .

USER node

FROM node:slim AS builder

WORKDIR /usr/src/app

COPY --chown=node:node package*.json ./
COPY --chown=node:node --from=development /usr/src/app/node_modules ./node_modules
COPY --chown=node:node . .

RUN yarn build

ENV NODE_ENV production

RUN yarn install --frozen-lockfile --production && yarn cache clean --force

USER node

FROM node:slim

COPY --chown=node:node --from=builder /usr/src/app/node_modules ./node_modules
COPY --chown=node:node --from=builder /usr/src/app/dist ./dist

CMD [ "node", "dist/main.js" ]
