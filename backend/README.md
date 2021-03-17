# BrightByte backend
This is the BrightByte backend project.

 #### Optional

 Since version v0.6.0 it is available a new optional feature that allows the user to use a integration with their favorites systems for version control, to automate the use of the webapp. Right now the providers available are Bitbucket and Github, Gitlab will also be implemented.
 
 To enjoy this new feature you have to use a custom set of varibles.
 To set Bitbucket as a provider you should set the variables `BITBUCKET_KEY` and `BITBUCKET_SECRET` in `src/backend.config.ts` to adapt to your preferences.
 For more information about how to get your own keys and secret you can check our explanation [here](https://tech.tribalyte.eu/blog-brightbyte-v0-6)

The first step to configure GitHub as a provider is to register a new [OAuth App](https://docs.github.com/en/developers/apps/creating-an-oauth-app ), and specify the permissions to use with the Github API (the required one is read). The Oauth process to authenticate users is also configured via the Oauth App. Once finished, a Client ID and a Client Secret will be generated and these need to be passed to the corresponding variables. To set GitHub as a provider, set the variables `GITHUB_KEY` and `GITHUB_SECRET` in `src/backend.config.ts` to your configuration.

Since version v0.3.0-cloud you can enable secure communications with the API via HTTPS.
Set `SECRET_PRIVATE_KEY` and `SECRET_CERTIFICATE_CRT` in `src/backend.config.ts` to adapt to your preferences. These variables will indicate where to find your secure files.

 #### Run the backend

- Install the dependencies by running yarn install.
- Add the bright smart contract ABI to the path: `src/assets/build/Bright.json`.
- Set `src/backend.config.custom.ts` variable to your node IP.
- Set `WEBAPP_URL` and `BRIGHTBYTE_DB_PORT` variables in `src/backend.config.ts` to adapt to your preferences.
- Run `yarn start` to start the backend.

 #### Run the backend with docker image from docker hub

- Set the node websocket url by running `WEBSOCKET_URL=ws://localhost:7545`
- Set backend allow-origins direction if needed `ORIGIN_URL=http://localhost:8100`
- Set backend port `BACKEND_PORT=3000`
- In order to keep avatars persistently, it's possible to use Docker volumes. The following variables are for this purpose: `BACKEND_STORAGE_PATH`, `CONTAINER_PERSISTENCE_PATH` and `HOST_DIRECTORY`
- Set backend persintance path for the avatars `BACKEND_STORAGE_PATH=/public/`
- Set the volume directories `HOST_DIRECTORY=/home/ubuntu/brightbyte-volume` and `CONTAINER_PERSISTENCE_PATH=$BACKEND_STORAGE_PATH`
- Create and run de container `docker run -e "NODE_WEBSOCKET_URL=${WEBSOCKET_URL}" -e "WEBAPP_URL=${ORIGIN_URL}"  -e "PORT=${BACKEND_PORT}" -e "IMAGE_STORAGE_PATH=${BACKEND_STORAGE_PATH}" -p ${BACKEND_PORT}:${BACKEND_PORT}/udp -p  ${BACKEND_PORT}:${BACKEND_PORT}/tcp -d -v ${HOST_DIRECTORY}:${CONTAINER_PERSISTENCE_PATH} brightbyte/backend:latest` ('latest' can be changed for the tag of any version available at https://cloud.docker.com/u/brightbyte/repository/docker/brightbyte/backend)
- To include the optional feature of the integration with Bitbucket add at the docker run instruction the necessary variables `-e "BITBUCKET_KEY=xxxxxx" -e "BITBUCKET_SECRET=XXXXXX"`
- To include the security feature it is mandatory to use Docker, the following variables are for this purposes `-e "BACKEND_PRIVATE_KEY_PATH=./private.key" -e "BACKEND_SECRET_CERTIFICATE_PATH=./certificate.crt"`
