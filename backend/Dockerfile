FROM node:12
WORKDIR /brightbyte
COPY package*.json *.lock ./
RUN yarn install --prod
COPY dist ./
CMD [ "node" , "main.js"]
