/// Copies new words from the english.json locale into all the other locales for translation.

import * as fs from "fs";

/// The list of locales that are supported by the site. IF you are looking to contribute by translating, MAKE SURE your language is on this list.
/// Do NOT make PR's that create new locales that are not on this list.
/// I am slowly & steadily looking to add more locales the more traction this project gets, so please be patient.
const SUPPORTED_LOCALES = [
    "polish",
    "ukrainian",
];

/// Whether to delete 'old' fields from locale files,
/// if they are not found in the base (english) locale
const PURGE_OLD = true;

let english_data = JSON.parse(
    fs.readFileSync("./locales/english.json", "utf8")
);

SUPPORTED_LOCALES.forEach(locale => {
    let data = JSON.parse(
        fs.readFileSync(`./locales/${locale}.json`, "utf8")
    );
    Object.keys(english_data).forEach(key => {
        if (!data[key]) {
            data[key] = english_data[key];
        }
    });
    Object.keys(data).forEach(key => {
        if (PURGE_OLD && !english_data[key]) {
            delete data[key];
        }
    });

    fs.writeFileSync(`./locales/${locale}.json`, JSON.stringify(data, null, 4));
});

