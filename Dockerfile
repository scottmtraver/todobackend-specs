FROM node:10.12.0-alpine

COPY . /app

WORKDIR /app

RUN npm install -g mocha && \
    npm install

ENTRYPOINT [ "mocha" ]
