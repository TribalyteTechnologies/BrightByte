FROM node:10
WORKDIR /brightbyte
COPY package*.json ./
RUN npm install
COPY . .
EXPOSE ${PORT}/tcp ${PORT}/udp
CMD [ "node" , "main.js"]