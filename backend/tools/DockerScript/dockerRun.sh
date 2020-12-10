#!/usr/bin/env bash

docker run -d --restart always --env-file dockerBrightByteEnvVar.list -p 3000:3000/udp -p 3000:3000/tcp -d -v /path/volume -v /path/secrets brightbyte/backend:latest-cloud

