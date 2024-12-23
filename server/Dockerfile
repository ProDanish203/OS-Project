FROM node:22.2.0-alpine

WORKDIR /app

COPY package*.json ./

RUN npm install

COPY . .

COPY .env .env

EXPOSE 8000

CMD ["npm", "start"]
