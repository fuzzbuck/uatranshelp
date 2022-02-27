//! api.rs - main api

use std::{
    error::Error,
    time::{SystemTime, UNIX_EPOCH},
};
use std::net::IpAddr;
use std::str::FromStr;
use async_trait::async_trait;
use redis::acl::Rule::Off;
use regex::Regex;
use rocket::{
    catch,
    get,
    http::{ContentType, Status},
    post,
    response,
    response::Responder,
    serde::json::Json,
    Request,
    Response,
};
use recaptcha;
use rocket::request::{FromRequest, Outcome};
use serde::{Deserialize, Serialize};
use serde_json::json;

use crate::{CONFIG, offer, offer::{rnd_id, Offer, OfferType, PersonalData}, util};

#[derive(Serialize, Deserialize, Debug)]
pub struct WrappedResponse {
    #[serde(skip)]
    http_status: Status,

    data: serde_json::Value,
}

impl<'r> Responder<'r, 'r> for WrappedResponse {
    fn respond_to(self, req: &Request) -> response::Result<'r> {
        Response::build_from(self.data.respond_to(&req).unwrap())
            .status(self.http_status)
            .header(ContentType::JSON)
            .ok()
    }
}

/// Wrapped Forbidden response shorthand.
pub(crate) fn forbidden(message: &str) -> WrappedResponse {
    WrappedResponse {
        http_status: Status::Forbidden,
        data: json!({
            "message": message,
        }),
    }
}

#[catch(404)]
pub(crate) fn not_found(_req: &Request) -> Json<WrappedResponse> {
    Json(WrappedResponse {
        http_status: Status::NotFound,
        data: json!({
            "message": "404 The requested path/resource does not exist."
        }),
    })
}

#[catch(500)]
pub(crate) fn internal_error(_req: &Request) -> WrappedResponse {
    WrappedResponse {
        http_status: Status::InternalServerError,
        data: json!({
            "message": "Internal server error."
        }),
    }
}

#[catch(422)]
pub(crate) fn unprocessable(_req: &Request) -> WrappedResponse {
    forbidden("Unprocessable")
}

#[catch(400)]
pub(crate) fn bad_request(_req: &Request) -> WrappedResponse {
    forbidden("Bad Request")
}

#[derive(Serialize, Deserialize, Debug)]
pub struct NewOfferRequest {
    offer: offer::Offer,
}

#[derive(Serialize, Deserialize, Debug)]
pub struct OfferRequest {
    pub otype: OfferType,
    pub name: String,
    pub personal: Option<PersonalData>,
    pub contact: String,
    pub location: util::Location,
    pub title: String,
    pub description: String,
    pub available_spaces: u8,
    pub translated: bool,
    pub accepted_terms: bool,
    pub password: String,
    pub captcha: String
}

/// Creates a new offer
#[post("/new", format = "application/json", data = "<data>")]
pub(crate) async fn new(data: Json<OfferRequest>) -> WrappedResponse {
    // basic field validation
    let req = &data.0;

    // validate captcha first
    // todo write api, this is from 2012 and doesnt work with new tokio  anymore
    /*

    let res = recaptcha::verify(&CONFIG.recaptcha_v2_key, &data.captcha, None).await;

    if res.is_err() {
        return forbidden("Captcha challenge failed.");
    }

     */

    if req.name.len() < 2 || req.name.len() > 64 {
        return forbidden("Name must be between 2 and 64 characters.");
    }

    if req.personal.is_some() {
        let personal = req.personal.as_ref().unwrap();

        if personal.age < 18 {
            return forbidden("You must be above 18 years old.");
        }

        if personal.first_name.len() < 1
            || personal.first_name.len() > 64
            || personal.last_name.len() < 1
            || personal.last_name.len() > 64
        {
            return forbidden("First and Last name must be between 1 and 64 characters.");
        }

        if personal.gender.len() < 1 || personal.gender.len() > 32 {
            return forbidden("Gender should be between 1 and 16 characters.");
        }

        // ~ 1.3 MB limit (+33% because of base64)
        if personal.photo_b64_img.len() < 64 || personal.photo_b64_img.len() > 1000000 {
            return forbidden("Uploaded image is too big, reduce the size by compressing it (e. jpeg format) and try again.");
        }
    }

    if req.contact.len() > 128 {
        return forbidden(
            "Contact data can be up to 128 characters",
        );
    }

    if req.location.street_address.len() < 1 || req.location.street_address.len() > 128 {
        return forbidden("Street address must be between 1 and 128 characters.");
    }

    if req.location.city.len() < 1 || req.location.city.len() > 128 {
        return forbidden("City must be between 1 and 64 characters.");
    }

    if req.location.additional_info.len() < 1 || req.location.additional_info.len() > 256 {
        return forbidden("Additional location info must be between 1 and 128 characters.");
    }

    if req.title.len() < 8 || req.title.len() > 512 { // add 2x slack
        return forbidden("Title must be between 8 and 256 characters.");
    }

    if req.description.len() < 32 || req.description.len() > 2056 {
        return forbidden("Description must be between 32 and 1024 characters.");
    }

    if req.translated == false {
        return forbidden("Offer must be translated into all 3 primary languages (english, polish, ukrainian). Use google translate.");
    }

    if req.accepted_terms == false {
        return forbidden("You must accept the simplified terms & privacy policy.");
    }

    if req.password.len() < 4 || req.password.len() > 32 {
        return forbidden("Password must be between 4 and 32 characters.");
    }

    let now = SystemTime::now().duration_since(UNIX_EPOCH).unwrap().as_secs();

    let id = rnd_id(4);
    let offer = Offer {
        otype: data.otype.to_owned(),
        name: data.name.to_owned(),
        personal: data.personal.to_owned(),
        contact: data.contact.to_owned(),
        title: data.title.to_string(),
        location: data.location.to_owned(),
        description: data.description.to_owned(),
        available_spaces: data.available_spaces,
        translated: data.translated,
        id: id.to_owned(),
        password: data.password.to_owned(),
        creation_epoch: now,
        update_epoch: now,
        approved: true,
    };

    match offer.upload().await {
        Ok(r) => r,
        Err(e) => {
            return forbidden(&format!(
                "An error has occured while uploading your offer to the database.\n{:?}",
                e.to_string()
            ))
        }
    }

    return WrappedResponse { http_status: Status::Ok, data: json!({ "id": id }) };
}

#[derive(Serialize, Deserialize, Debug)]
pub struct GetRequest<'r> {
    id: &'r str,
}

#[post("/get", format = "application/json", data = "<data>")]
pub(crate) async fn get(data: Json<GetRequest<'r>>) -> WrappedResponse {
    if data.id.len() < 4 || data.id.len() > 32 {
        return forbidden("id length must be larger than 4 and smaller than 32");
    }

    match Offer::Download(data.id).await {
        Ok(offer) => {
            let mut sanitized = offer;
            sanitized.password = "****".to_string();

            WrappedResponse {
                http_status: Status::Ok,
                data: serde_json::to_value(&sanitized).expect("serde_json fatal"),
            }
        }
        Err(e) => WrappedResponse {
            http_status: Status::Gone,
            data: json!({
                "message": "Offer expired/deleted or does not exist.",
                "error": e.to_string()
            }),
        },
    }
}

#[get("/all")]
pub(crate) async fn all() -> WrappedResponse {
    match Offer::LatestN(1024).await {
        Ok(ids) => WrappedResponse {
            http_status: Status::Ok,
            data: serde_json::to_value(ids).expect("serde_json fatal"),
        },
        Err(e) => WrappedResponse {
            http_status: Status::InternalServerError,
            data: json!({
                "message": "Can't retrieve Offers, database broken ?",
                "error": e.to_string()
            }),
        },
    }
}
