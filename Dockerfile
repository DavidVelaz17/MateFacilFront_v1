FROM node:20-alpine

WORKDIR /app

COPY package*.json ./

RUN npm install

COPY . .

# NEXT_PUBLIC_* debe estar disponible en build time para que Next.js lo
# incruste en el bundle del cliente (docker-compose.yml lo pasa como build arg).
ARG NEXT_PUBLIC_API_URL
ENV NEXT_PUBLIC_API_URL=${NEXT_PUBLIC_API_URL}

RUN npm run build

# Next.js suele usar el 3000, pero como el back ya usa el 3000,
# lo mapearemos diferente en el compose, o Next usará el 3000 interno.
EXPOSE 3000

CMD ["npm", "start"]