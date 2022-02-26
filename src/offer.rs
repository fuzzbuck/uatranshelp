//! offer.rs - structure of an 'offer' object
//! along with type & enum definitions

use std::{error::Error, time::Duration};

use deadpool_redis::redis::transaction;
use itertools::Itertools;
use rand::{distributions::Alphanumeric, Rng};
use redis::{AsyncCommands, Connection};
use rocket::http::ext::IntoCollection;
use serde::{Deserialize, Serialize};

use crate::{dbconn, util, util::LocationPath};

pub fn rnd_id(len: usize) -> String {
    rand::thread_rng().sample_iter(&Alphanumeric).map(char::from).take(len).collect()
}

/// The Time To Live of an offer in hours, after this duration, if the offer has not
/// been edited, it will be automatically deleted.
const OFFER_TTL_HOURS: u64 = 48;

#[derive(Serialize, Deserialize, Debug, Clone, PartialEq)]
pub enum TransportVehicle {
    /// Most common cars, like SUVs, sedans, taxis, etc.
    PersonalMax5Seats,
    /// Road vehicles intended for mass transport
    Bus,
    /// Other
    Other,
}

#[derive(Serialize, Deserialize, Debug, Clone, PartialEq)]
pub struct TransportData {
    pub from_to: util::LocationPath,
    pub vehicle: TransportVehicle,
}

#[derive(Serialize, Deserialize, Debug, Clone, PartialEq)]
pub enum HousingType {
    /// Mass accommodation (e. organized infrastructure, temporary living 'containers')
    Mass,
    /// Offering your own room/apartment/property for accommodation
    Shared,
    /// Hotels, motels, guesthouses, etc.
    Hotel,
}

#[derive(Serialize, Deserialize, Debug, Clone, PartialEq)]
pub struct AccommodationData {
    pub housing_type: HousingType,
    /// Whether this offer also offers transport to the location of accommodation
    pub offers_transport: Option<TransportData>,

    /// Whether this accommodation allows pets
    pub allows_pets: bool,

    /// Whether this accommodation provides living necessities (food, water, working toilet, ...)
    pub provides_necessities: bool,
}

#[derive(Serialize, Deserialize, Debug, Clone, PartialEq)]
pub enum OfferType {
    /// The offer creator is offering to transport people (not goods/ products!, that goes in the
    /// Other category)
    OfferTransport(TransportData),

    /// The offer creator is offering to accommodate people
    OfferAccommodation(AccommodationData),

    /// The offer creator is offering other means of help (including transport of goods/ products/
    /// other logistics)
    OfferOther,

    /// The offer creator needs help with transporting people
    NeedTransport(util::LocationPath),

    /// The offer creator needs help with accommodation
    NeedAccommodation,

    /// The offer creator needs other means of help
    NeedOther,

    /// The offer creator needs help immediately (e. health concern, major intervention)
    NeedEmergency,
}

/// Personal data of a person
#[derive(Serialize, Deserialize, Debug, Clone, PartialEq)]
pub struct PersonalData {
    pub first_name: String,
    pub last_name: String,
    pub age: u8,
    pub gender: String,        // has to be String since we live in 2022
    pub photo_b64_img: String, // b64 image of a photo of the person
}

#[derive(Serialize, Deserialize, Debug, Clone, PartialEq)]
pub struct Offer {
    pub otype: OfferType,

    /// The offer creator's name
    pub name: String,

    /// The offer creator's personal data (optional)
    pub personal: Option<PersonalData>,

    /// The offer creator's phone number, email, or anything else used to contact them
    pub contact: String,

    /// The offer's title. This is what's displayed without users having to check the description
    pub title: String,

    /// The offer's location (used for accommodation, otherwise where the offer is based in)
    pub location: util::Location,

    /// The offer's description
    pub description: String,

    /// How many spaces are available for this offer
    pub available_spaces: u8,

    /// Whether the offer has to be machine translated (if false, assumes the offer creator did
    /// that already)
    pub translated: bool,

    /// Unique ID assigned to this offer (randomly generated)
    pub id: String,

    /// The password assigned to this offer, with it the offer can be accessed & edited, or
    /// deleted.
    pub password: String,

    /// Whether this offer is 'approved' for being shown publicly (by a moderator)
    pub approved: bool,

    /// When this offer was created
    pub creation_epoch: u64,

    /// When this offer was last edited
    pub update_epoch: u64,
}

impl Offer {
    /// Upload the offer to the redis database
    pub async fn upload(&self) -> Result<(), Box<dyn Error>> {
        let raw = serde_json::to_string(&self)?;

        let mut conn = dbconn::POOL.get().await?;

        let key = format!("{}_{}", &self.update_epoch, &self.id);

        let _ = conn.set::<_, _, _>(&key, raw).await?;
        let _ = conn
            .expire::<_, _>(&key, Duration::from_secs(60 * 60 * OFFER_TTL_HOURS).as_secs() as usize)
            .await?;

        Ok(())
    }

    /// Download an offer by ID from the redis database
    pub async fn Download(id: &str) -> Result<Self, Box<dyn Error>> {
        let mut conn = dbconn::POOL.get().await?;

        let ret: String = conn.get(id).await?;

        Ok(serde_json::from_str(&ret)?)
    }

    pub async fn LatestN(amount: usize) -> Result<Vec<String>, Box<dyn Error>> {
        let keys = dbconn::POOL.get().await?.keys::<_, Vec<String>>("*").await?;

        // key format is "<epoch>_<id>", therefore splitting by _ gives (epoch, id)
        // which can be sorted by date for newest offers
        let mut sorted = keys
            .iter()
            .map(|key| {
                let kv = key.split_once("_").unwrap_or(("0", "fail"));
                (kv.0.parse::<u64>().unwrap_or(u64::MAX), kv.1.to_string())
            })
            .collect::<Vec<(u64, String)>>();
        sorted.sort_by_key(|k| k.0);
        sorted.reverse();

        dbg!(&sorted);

        Ok(sorted
            .iter()
            .take(amount)
            .map(|kv| format!("{}_{}", kv.0, kv.1))
            .collect::<Vec<String>>())
    }
}

#[cfg(test)]
mod tests {
    use std::time::{SystemTime, UNIX_EPOCH};

    use redis::cmd;
    use tokio;

    use super::*;

    // test serialization, deserialization, upload & download from redis

    #[tokio::test]
    async fn clear_db() {
        let mut conn = dbconn::POOL.get().await.unwrap();

        let _: () = cmd("flushdb").query_async(&mut conn).await.unwrap();
    }

    #[tokio::test]
    pub async fn up_down() {
        let id = rnd_id(8);

        let now = SystemTime::now().duration_since(UNIX_EPOCH).unwrap().as_secs();
        let offer = Offer{
            otype: OfferType::OfferAccommodation(AccommodationData{
                housing_type: HousingType::Shared,
                offers_transport: Some(TransportData{
                    from_to: LocationPath { from: util::Location {
                        geo: util::LocationPoint {
                            lon: 50.0,
                            lat: 20.0
                        },
                        country: util::Country::Ukraine,
                        city: "Test City".to_string(),
                        street_address: "Test Street. 45th".to_string(),
                        additional_info: "Near GLaDOS testing chambers".to_string()
                    }, to: util::Location {
                        geo: util::LocationPoint {
                            lon: 60.0,
                            lat: 15.0
                        },
                        country: util::Country::Ukraine,
                        city: "Big City".to_string(),
                        street_address: "Big Street".to_string(),
                        additional_info: "Near small city".to_string()
                    } },
                    vehicle: TransportVehicle::PersonalMax5Seats
                }),
                allows_pets: false,
                provides_necessities: true
            }),
            personal: Some(PersonalData{
                first_name: "Test".to_string(),
                last_name: "Guy".to_string(),
                age: 22,
                gender: "M".to_string(),
                photo_b64_img: include_str!("../b64img.txt").to_string()
            }),
            name: "Joe Doe".to_string(),
            contact: "joedoe@gmail.com  + 48 000 000 000".to_string(),
            location: util::Location {
                geo: util::LocationPoint { lon: 50.69254, lat: 23.23001 },
                country: util::Country::Poland,
                city: "Zamość".to_string(),
                street_address: "Jastrzębskiego 4".to_string(),
                additional_info: "Near blue apartment building.".to_string()
            },
            title: "Kijów -> Granica | Kyiv -> Border | Київ до кордону".to_string(),
            description: "This is a test offer. It is intended for testing. testing testing testing. please do not think that this offer is meant for anything else other than testing. The only purpose of this offer is in fact, to test. Testing is good. Testing is life. Thank you for participating in the test :)".to_string(),
            available_spaces: 4,
            translated: true,
            id: id.clone(),
            password: "safepassword123".to_string(),
            creation_epoch: now,
            approved: true,
            update_epoch: now
        };

        let _ = offer.upload().await.unwrap();
        let downloaded =
            Offer::Download(&format!("{}_{}", offer.creation_epoch, &id)).await.unwrap();

        dbg!(&downloaded);
        dbg!(serde_json::to_string(&downloaded).unwrap());

        assert_eq!(offer, downloaded);
    }

    #[tokio::test]
    pub async fn get_latest() {
        let latest = Offer::LatestN(10).await.unwrap();

        dbg!(&latest);
    }
}
