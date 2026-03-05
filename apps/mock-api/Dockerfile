FROM node:22-alpine
WORKDIR /app
COPY apps/mock-api/package.json ./
RUN npm install
COPY apps/mock-api/tsconfig.json ./
COPY apps/mock-api/src ./src
CMD ["npm", "start"]
