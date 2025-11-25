FROM node:20-alpine

WORKDIR /app

RUN npm install -g typescript @nestjs/cli

COPY package*.json ./
COPY tsconfig*.json ./

RUN npm ci || npm install

COPY . .

RUN echo "--- LISTANDO ARQUIVOS COPIADOS ---" && ls -la && ls -la src

RUN npm run build

RUN echo "--- LISTANDO PASTA DIST ---" && ls -la dist

EXPOSE 3001

CMD ["node", "dist/src/main"]