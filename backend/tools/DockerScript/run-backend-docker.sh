#!/usr/bin/env bash
docker run --name brightbyte-backend -d --restart always --env-file dockerBrightByteEnvVar.list \
    -p 3000:3000/tcp \
    -v /my/public/path:/public \
    -v /my/cert/path:/path/secrets/certificate.crt \
    -v /my/certkey/path:/path/secrets/private.key \
    -v /my/db:/path/db \
    brightbyte/backend:0.8.8-cloud
