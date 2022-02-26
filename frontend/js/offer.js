import * as api from "./api.js";
import * as map from "./map.js";
import anime from "animejs";
import {offers} from "./api.js";

let OFFER_TEMPLATE = document.getElementById("offer-template");

export let CURRENT_FILTER = "all";
export let DOM_OFFERS = [];

document.querySelectorAll(".filter").forEach(elem => {
    elem.addEventListener("click", () => {
        document.getElementById(CURRENT_FILTER).classList.remove("active");
        elem.classList.add("active");

        CURRENT_FILTER = elem.id;
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
            offers = offers.filter(offer => offer.otype.hasOwnProperty("OfferOther"));
            break;
        case "need-transport":
            offers = offers.filter(offer => offer.otype.hasOwnProperty("NeedTransport"));
            break;
        case "need-accommodation":
            offers = offers.filter(offer => offer.otype.hasOwnProperty("NeedAccommodation"));
            break;
        case "need-other":
            offers = offers.filter(offer => offer.otype.hasOwnProperty("NeedOther"));
            break;
        default:
            break;
    };

    document.getElementById("num-offers").innerHTML = "[" + offers.length + "]";

    offers.forEach(offer => {
        create_elem(offer);
    });
};

let create_elem = (offer) => {
    let div = OFFER_TEMPLATE.cloneNode(true);

    try {
        div.id = offer.id;
        div.querySelector("#description").innerHTML = offer.description;

        if (offer.personal != null) {
            div.querySelector("#ageval").innerHTML = offer.personal.age;
            div.querySelector("#firstnameval").innerHTML = offer.personal.first_name;
            div.querySelector("#lastnameval").innerHTML = offer.personal.last_name;
            div.querySelector("#genderval").innerHTML = offer.personal.gender;
            div.querySelector("#personal-img").src = "data:image/png;base64," + offer.personal.photo_b64_img;
        }

        function detail_transport(data) {
            let from = data["from_to"]["from"];
            let to = data["from_to"]["to"];

            div.querySelector("#transport-details").style.display = "";
            div.querySelector("#transport-details #fromval").innerHTML = from.street_address + ", " + from.city + ", " + from.country + ", " + from.additional_info;
            div.querySelector("#transport-details #toval").innerHTML = to.street_address + ", " + to.city + ", " + to.country + ", " + to.additional_info;
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

        if(offer.otype.hasOwnProperty("OfferAccommodation")) {
            let data = offer.otype["OfferAccommodation"];
            if(data["offers_transport"] != null) {
                detail_transport(data["offers_transport"]);
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


        div.querySelector("#space-amount").innerHTML = offer.available_spaces;

        let country_elem = div.querySelector("#country");
        switch(offer.location.country) {
            case "Ukraine":
                div.querySelector("#ukraine").style.display = "block";
                country_elem.innerHTML = "UA";
                break;
            case "Poland":
                div.querySelector("#poland").style.display = "block";
                country_elem.innerHTML = "PL";
                break;
            case "Romania":
                div.querySelector("#romania").style.display = "block";
                country_elem.innerHTML = "RO";
                break;
            case "Europe":
                div.querySelector("#eu").style.display = "block";
                country_elem.innerHTML = "EU";
                break;
            case "Other":
                div.querySelector("#other").style.display = "block";
                country_elem.innerHTML = "??";
                break;
        }

        div.querySelector("#offer-title").innerHTML = offer.title;

        div.querySelector("#creatorval").innerHTML = offer.name;
        div.querySelector("#locationval").innerHTML = offer.location.city + ", " + offer.location.street_address + ", " + offer.location.additional_info;
        div.querySelector("#contactval").innerHTML = offer.contact;

        div.querySelector("#details").addEventListener("click", () => {
            div.querySelector(".offer-popup").style.display = "block";
        });

        div.querySelector("#close-popup").addEventListener("click", () => {
            div.querySelector(".offer-popup").style.display = "none";
        });

        div.querySelector("#pinonmap").addEventListener("click", () => {
            window.scrollTo(0, 0);
            map.render_marker(offer);
            map.focus(offer);
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

