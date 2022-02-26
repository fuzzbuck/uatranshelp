#![feature(in_band_lifetimes)]
#![feature(async_closure)]

mod api;
mod dbconn;
mod offer;
mod util;

use figment::{
    providers::{Env, Format, Toml},
    Figment,
};
use rocket::{
    catchers,
    fs::{relative, FileServer, Options},
    get,
    http::{ContentType, Status},
    launch,
    post,
    request::{FromRequest, Outcome},
    response,
    response::Responder,
    routes,
    serde::json::Json,
    Build,
    Request,
    Response,
    Rocket,
};
use serde::{Deserialize, Serialize};
use serde_json;

#[macro_use]
extern crate lazy_static;

#[derive(Serialize)]
struct Index {
    message: String,
}

#[derive(Serialize, Deserialize)]
pub struct Config {
    pub redis_uri: String,
    pub redis_pool_size: usize,
}

lazy_static! {
    pub static ref CONFIG: Config = {
        Figment::new()
            .merge(Toml::file("./config.toml").nested())
            .merge(Env::prefixed("CONFIG_"))
            .select(if cfg!(debug_assertions) { "debug" } else { "default" })
            .extract()
            .expect("can't read config.toml")
    };
}

#[launch]
async fn launch() -> Rocket<Build> {
    let mut builder = rocket::build()
        .mount("/api", routes![api::new, api::get, api::all])
        .register(
            "/",
            catchers![api::not_found, api::internal_error, api::unprocessable, api::bad_request],
        );

    if cfg!(debug_assertions) {
        builder = builder.mount("/", FileServer::new("./frontend/dist", Options::NormalizeDirs));
    }

    builder
}
