FROM node:12
WORKDIR /brightbyte
COPY package*.json ./
RUN yarn install
COPY dist ./
EXPOSE 3000/tcp 3000/udp
CMD [ "node" , "main.js"]