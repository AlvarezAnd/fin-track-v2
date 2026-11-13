FROM node:22-alpine

WORKDIR /app

COPY package.json yarn.lock ./
RUN corepack enable && corepack prepare yarn@1.22.22 --activate && yarn install --frozen-lockfile

COPY . .

EXPOSE 3001

CMD ["yarn", "start:dev"]
