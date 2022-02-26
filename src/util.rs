//! util.rs - other helpful definitions & types

use serde::{Deserialize, Serialize};

#[derive(Serialize, Deserialize, Debug, Clone, PartialEq)]
pub struct LocationPoint {
    /// longitude
    pub lon: f64,

    /// latitude
    pub lat: f64,
}

/// keeping it simple
#[derive(Serialize, Deserialize, Debug, Clone, PartialEq)]
pub enum Country {
    Ukraine,
    Poland,
    Romania,
    Europe,
    Other,
}

#[derive(Serialize, Deserialize, Debug, Clone, PartialEq)]
pub struct Location {
    pub geo: LocationPoint,
    pub country: Country,
    /// Full city name INCLUDING ZIP CODE
    pub city: String,
    /// Full street name including apartment number, etc.
    pub street_address: String,
    /// Additional information (eg. Next to 'IKEA')
    pub additional_info: String,
}

#[derive(Serialize, Deserialize, Debug, Clone, PartialEq)]
pub struct LocationPath {
    pub from: Location,
    pub to: Location,
}
