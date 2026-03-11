FROM node:20-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci --only=production

COPY src/ ./src/
RUN mkdir -p /app/src/uploads

EXPOSE 5002

CMD ["node", "src/index.js"]
