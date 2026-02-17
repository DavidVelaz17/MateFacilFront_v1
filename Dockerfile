FROM node:18-alpine

WORKDIR /app

COPY package*.json ./

RUN npm install

COPY . .

RUN npm run build

# Next.js suele usar el 3000, pero como el back ya usa el 3000,
# lo mapearemos diferente en el compose, o Next usará el 3000 interno.
EXPOSE 3000

CMD ["npm", "start"]