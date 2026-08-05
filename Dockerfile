# Next.js 16 requiere Node >=20.9
FROM node:20-alpine

WORKDIR /app

COPY package*.json ./

RUN npm ci

COPY . .

# NEXT_PUBLIC_* se incrusta en el bundle del cliente en build time, no en
# runtime -- por eso tiene que llegar como build ARG, no como env de compose.
# Debe ser una URL alcanzable desde el navegador (host/LAN), no el nombre
# interno del servicio de docker-compose.
ARG NEXT_PUBLIC_API_URL=http://localhost:3001
ENV NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL

RUN npm run build

EXPOSE 3000

CMD ["npm", "start"]
