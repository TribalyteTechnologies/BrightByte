# BrightByte webapp
This is the BrightByte backend project.

 #### Run the backend

- Install the dependencies by running npm install.
- Add the bright smart contract ABI to the path: `src/assets/build/Bright.json`.
- Set `src/backend.config.custom.ts` variable to your node IP.
- Set `FRONT_ORIGIN_HEADER` and `BRIGHTBYTE_DB_PORT` variables in `src/backend.config.ts` to adapt to your preferences.
- Run `npm start` to start the backend.

 #### Run the backend with docker image from docker hub

- Run `docker pull brightbyte/backend:latest` (latest can be changed for the tag of any version available at https://cloud.docker.com/u/brightbyte/repository/docker/brightbyte/backend)
- Set the node websocket url by running `WEBSOCKET_URL=ws://localhost:7545`
- Set backend allow-origins direction if needed `ORIGIN_URL=http://localhost:8100`
- Set backend port `BACKEND_PORT=3000`
- Create and run de container `docker run -e "NODE_WEBSOCKET_URL=${WEBSOCKET_URL}" -e "WEBAPP_URL=${ORIGIN_URL}"  -e "PORT=${BACKEND_PORT}"  -p ${BACKEND_PORT}:${BACKEND_PORT}/udp -p  ${BACKEND_PORT}:${BACKEND_PORT}/tcp -d brightbyte/backend:latest`
