FROM node:10
WORKDIR /brightbyte
COPY package*.json ./
RUN npm install
COPY . .
EXPOSE 3000/tcp 3000/udp
CMD [ "node" , "main.js"]