FROM node:10
COPY package*.json ./
RUN npm install
COPY . .
EXPOSE 3000
CMD [ "node" , "dist/main.js"]