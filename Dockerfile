FROM rust:alpine3.15

WORKDIR /usr/uatransapi

COPY . .

RUN apk add musl-dev

ENTRYPOINT cargo run --release