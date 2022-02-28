import * as api from "./api.js";
import * as map from "./map.js";
import anime from "animejs";
import {offers} from "./api.js";

let OFFER_TEMPLATE = document.getElementById("offer-template");

export let CURRENT_FILTER = "all";
export let DOM_OFFERS = [];

document.querySelectorAll(".filter").forEach(elem => {
    elem.addEventListener("click", () => {
        document.querySelector(".filter-box #" + CURRENT_FILTER).classList.remove("active");

        CURRENT_FILTER = elem.id;
        elem.classList.add("active");

        render_current();
    });
})


// render offers according to the current filter
export let render_current = () => {
    DOM_OFFERS.forEach(elem => {
        elem.parentNode.removeChild(elem);
    });
    DOM_OFFERS = [];

    let offers = api.offers;
    switch (CURRENT_FILTER) {
        case "all":
            break;
        case "offer-transport":
            offers = offers.filter(offer => offer.otype.hasOwnProperty("OfferTransport"));
            break;
        case "offer-accommodation":
            offers = offers.filter(offer => offer.otype.hasOwnProperty("OfferAccommodation"));
            break;
        case "offer-other":
            offers = offers.filter(offer => offer.otype == "OfferOther");
            break;
        case "need-transport":
            offers = offers.filter(offer => offer.otype.hasOwnProperty("NeedTransport"));
            break;
        case "need-accommodation":
            offers = offers.filter(offer => offer.otype == "NeedAccommodation");
            break;
        case "need-other":
            offers = offers.filter(offer => offer.otype == "NeedOther");
            break;
        default:
            break;
    };

    document.getElementById("num-offers").textContent = "[" + offers.length + "]";

    offers.forEach(offer => {
        create_elem(offer);
    });
};

let create_elem = (offer) => {
    let div = OFFER_TEMPLATE.cloneNode(true);

    try {
        div.id = offer.id;
        div.querySelector("#description").textContent = offer.description;

        if (offer.personal != null) {
            div.querySelector("#personal-details").hidden = false;
            div.querySelector("#ageval").textContent = offer.personal.age;
            div.querySelector("#firstnameval").textContent = offer.personal.first_name;
            div.querySelector("#lastnameval").textContent = offer.personal.last_name;
            div.querySelector("#genderval").textContent = offer.personal.gender;

            div.querySelector("#personal-img").hidden = false;
            div.querySelector("#personal-img").src = offer.personal.photo_b64_img.replace("<", "").replace(">", "");
        }

        function detail_transport(data) {
            let from = data["from_to"]["from"];
            let to = data["from_to"]["to"];

            div.querySelector("#transport-details").style.display = "";
            div.querySelector("#transport-details #fromval").textContent = from.street_address + ", " + from.city + ", " + from.country + ", " + from.additional_info;
            div.querySelector("#transport-details #toval").textContent = to.street_address + ", " + to.city + ", " + to.country + ", " + to.additional_info;

            div.querySelector("#view-path").hidden = false;

        }

        if(offer.otype.hasOwnProperty("OfferTransport")) {
            if(offer.otype["OfferTransport"]["vehicle"] == "PersonalMax5Seats") {
                div.querySelector("#car-icon").style.display = "block";
            } else if(offer.otype["OfferTransport"]["vehicle"] == "Bus") {
                div.querySelector("#bus-icon").style.display = "block";
            } else{
                div.querySelector("#vehicle-icon").style.display = "block";
            }

           detail_transport(offer.otype["OfferTransport"]);
        }

        if(offer.otype.hasOwnProperty("NeedTransport")) {
            detail_transport(offer.otype["NeedTransport"]);
        }

        if(offer.otype.hasOwnProperty("OfferAccommodation")) {
            let data = offer.otype["OfferAccommodation"];
            div.querySelector("#accommodation-details").hidden = false;

            if(data["offers_transport"]) {
                let s = div.querySelector("#transport").style;
                s.opacity = 1;
                s.textDecoration = "none";
            }
            if(data["allows_pets"]) {
                let s = div.querySelector("#pets").style;
                s.opacity = 1;
                s.textDecoration = "none";
            }
            if(data["provides_necessities"]) {
                let s = div.querySelector("#necessities").style;
                s.opacity = 1;
                s.textDecoration = "none";
            }
        }

        div.querySelector("#space-amount").textContent = offer.available_spaces;

        let country_elem = div.querySelector("#country");
        switch(offer.location.country) {
            case "Ukraine":
                div.querySelector("#ukraine").style.display = "block";
                country_elem.textContent = "UA";
                break;
            case "Poland":
                div.querySelector("#poland").style.display = "block";
                country_elem.textContent = "PL";
                break;
            case "Romania":
                div.querySelector("#romania").style.display = "block";
                country_elem.textContent = "RO";
                break;
            case "Europe":
                div.querySelector("#eu").style.display = "block";
                country_elem.textContent = "EU";
                break;
            case "Other":
                div.querySelector("#other").style.display = "block";
                country_elem.textContent = "??";
                break;
        }

        div.querySelector("#offer-title").textContent = offer.title;

        div.querySelector("#creatorval").textContent = offer.name;
        div.querySelector("#locationval").textContent = offer.location.city + ", " + offer.location.street_address + ", " + offer.location.additional_info;
        div.querySelector("#contactval").textContent = offer.contact;

        // updated val
        let secs_ago = Date.now() / 1000 - offer.update_epoch;
        let mins_ago = secs_ago / 60;
        let hours_ago = mins_ago / 60;

        if (hours_ago > 2) {
            div.querySelectorAll(".timeago-num").forEach(elem => {
                elem.textContent = Math.floor(hours_ago).toString() + " ";
            });
            div.querySelector("#hours").hidden = false;
        } else if (mins_ago > 2) {
            div.querySelectorAll(".timeago-num").forEach(elem => {
                elem.textContent = Math.floor(mins_ago).toString() + " ";
            });
            div.querySelector("#minutes").hidden = false;
        } else {
            div.querySelectorAll(".timeago-num").forEach(elem => {
                elem.textContent = Math.floor(secs_ago).toString() + " ";
            });
            div.querySelector("#seconds").hidden = false;
        }

        div.querySelector("#details").addEventListener("click", () => {
            div.querySelector(".offer-popup").style.display = "block";
        });

        div.querySelector("#close-popup").addEventListener("click", () => {
            div.querySelector(".offer-popup").style.display = "none";
        });

        div.querySelector("#pinonmap").addEventListener("click", () => {
            window.scrollTo(0, 0);
            map.open_map();
            map.focus(offer);
        });

        div.querySelector("#view-path").addEventListener("click", () => {
            window.scrollTo(0, 0);
            map.open_map();

            L.marker([offer.location.geo.lat, offer.location.geo.lon], {icon: map.coordIconGreen}).addTo(map.map);
            L.marker([offer.to.geo.lat, offer.to.geo.lon], {icon: map.coordIconOrange}).addTo(map.map);

            L.polyline([
                [offer.location.geo.lat, offer.location.geo.lon],
                [offer.to.geo.lat, offer.to.geo.lon]
            ], {color: '#f3f865'}).addTo(map.map);
        });

        document.querySelector(".offerlist").appendChild(div);

        /*
        anime({
            targets: "#" + div.id + " a, span, p, button, h1, h2, img, div",
            opacity: [0, 1],
            duration: 500,
            easing: "easeOutQuad",
        });

         */

        div.style.display = "";

        DOM_OFFERS.push(div);

    }catch(e) {
        console.warn("error while rendering offer:", e);
        div.parentNode.removeChild(div);
    }
};

