FROM rust:alpine3.15

WORKDIR /usr/uatransapi

COPY ./src .
COPY ./Cargo.toml .
COPY ./config.toml .
COPY ./Rocket.toml .
COPY ./Rocket.toml .

RUN apk add musl-dev

ENTRYPOINT cargo run --release