FROM node:20-alpine AS build

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .

ARG VITE_AUTH_URL
ARG VITE_PROPERTY_URL
ARG VITE_RESIDENCY_URL

RUN npm run build

FROM nginx:alpine

COPY --from=build /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/templates/default.conf.template

EXPOSE 10000

ENV PORT=10000

CMD ["nginx", "-g", "daemon off;"]
