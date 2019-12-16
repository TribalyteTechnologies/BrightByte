# BrightByte webapp
This is the BrightByte backend project.

 #### Run the backend

- Install the dependencies by running npm install.
- Add the bright smart contract ABI to the path: `src/assets/build/Bright.json`.
- Set `src/backend.config.custom.ts` variable to your node IP.
- Set `WEBAPP_URL` and `BRIGHTBYTE_DB_PORT` variables in `src/backend.config.ts` to adapt to your preferences.
- Run `npm start` to start the backend.

 #### Run the backend with docker image from docker hub

- Set the node websocket url by running `WEBSOCKET_URL=ws://localhost:7545`
- Set backend allow-origins direction if needed `ORIGIN_URL=http://localhost:8100`
- Set backend port `BACKEND_PORT=3000`
- In order to keep avatar persistance we use volumes, using the following variables `BACKEND_STORAGE_PATH`, `CONTAINER_PERSISTENCE_PATH` and `HOST_DIRECTORY`
- Set backend persintance path for the avatars `BACKEND_STORAGE_PATH=./public/`
- Set the volume directories `HOST_DIRECTORY=/home/ubuntu/brightbyte-volume` and `CONTAINER_PERSISTENCE_PATH="/brightbyte/$BACKEND_STORAGE_PATH`
- Create and run de container `docker run -e "NODE_WEBSOCKET_URL=${WEBSOCKET_URL}" -e "WEBAPP_URL=${ORIGIN_URL}"  -e "PORT=${BACKEND_PORT}" -e "IMAGE_STORAGE_PATH=${BACKEND_STORAGE_PATH}" -p ${BACKEND_PORT}:${BACKEND_PORT}/udp -p  ${BACKEND_PORT}:${BACKEND_PORT}/tcp -d -v ${HOST_DIRECTORY}:${CONTAINER_PERSISTENCE_PATH} brightbyte/backend:latest` ('latest' can be changed for the tag of any version available at https://cloud.docker.com/u/brightbyte/repository/docker/brightbyte/backend)
