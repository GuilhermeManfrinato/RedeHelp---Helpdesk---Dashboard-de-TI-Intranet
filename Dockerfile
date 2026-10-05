FROM node:20-alpine

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .

ENV CI=false

RUN npm run build --if-present

EXPOSE 3000

CMD ["npm", "start"]
