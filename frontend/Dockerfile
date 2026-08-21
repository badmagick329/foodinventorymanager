FROM node:20-alpine3.17 AS deploy

RUN apk update && apk add --no-cache libssl1.1

WORKDIR /app

COPY package.json package-lock.json ./
COPY next.config.js ./next.config.js
COPY tsconfig.json ./tsconfig.json
COPY .env ./.env
COPY .env.local ./.env.local
COPY tailwind.config.ts ./tailwind.config.ts
COPY postcss.config.js ./postcss.config.js
COPY .eslintrc.json ./.eslintrc.json
COPY ./prisma ./prisma
COPY ./public ./public
COPY ./src ./src

RUN npm ci

ENV HOSTNAME="0.0.0.0"

RUN npm run build

COPY ./entrypoint.sh .
RUN sed -i 's/\r$//' ./entrypoint.sh && chmod +x ./entrypoint.sh
RUN npx prisma generate

ENTRYPOINT ["/app/entrypoint.sh"]
CMD ["npx", "next", "start", "-p", "9004"]
