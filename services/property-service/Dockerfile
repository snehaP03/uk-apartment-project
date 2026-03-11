FROM node:20-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci --omit=dev

COPY src/ ./src/
RUN mkdir -p /app/src/uploads

EXPOSE 10000

CMD ["node", "src/index.js"]
