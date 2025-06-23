FROM node:22-alpine
WORKDIR /app
RUN apk add --no-cache python3 make g++

COPY package*.json ./
RUN npm install

COPY vendor-mocks/ .

CMD ["node", "index.js"]
