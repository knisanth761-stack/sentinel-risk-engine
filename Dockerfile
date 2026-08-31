FROM node:22-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci --omit=dev

COPY backend ./backend
COPY ml ./ml
COPY db ./db

EXPOSE 3000

CMD ["node", "backend/server.js"]
