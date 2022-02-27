/// Interactive offer creation form
import "leaflet";
import anime from 'animejs/lib/anime.es.js';
import * as map from "./map.js";
import * as api from "./api.js";
import {set_coord_status} from "./map.js";

let exit = document.getElementById("exit");
exit.addEventListener("click", function() {
    ABORT();
})

let ABORT = () => {
    anime({
        targets: ".create-box",
        opacity: [1, 0],
        translateY: [0, 150],
        easing: "easeOutCirc",
        duration: 500,


    })
    anime({
        targets: ".create-popup",
        opacity: [1, 0],
        easing: "easeOutCirc",
        duration: 500,
        complete: (_) => {
            document.querySelector(".create-popup").style.display = "none";
        }
    })
};

// Usable data
export let DATA = {};

// Object built to later be sent to the API
export let OBJ = {};

document.getElementById("create").addEventListener("click", () => {
    document.querySelector(".create-popup").style.display = "";

    anime({
        targets: ".create-box",
        opacity: [0, 1],
        translateY: [-150, 0],
        easing: "easeOutCirc",
        duration: 500,
    });

    anime({
        targets: ".create-popup",
        opacity: [0, 1],
        easing: "easeOutCirc",
        duration: 500,
    });

    // begin stage 1
});

let radio_value = (elem, selector) => {
    for (let e of elem.querySelectorAll(selector)) {
        if (e.checked) {
            return e.id;
        }
    }

    return null;
}

let open_location_box = () => {
    map.set_coord_status(true);

    document.getElementById("location-sel-box").hidden = false;
    map.borrow(document.getElementById("temp-map-box"));
    map.open_map();
}

// stage 0
document.querySelector("#begin-create").addEventListener("click", () => {
    document.getElementById("infobox").hidden = true;
    document.getElementById("stage1").hidden = false;
});

let choice_to_type = (choice) => {
    return choice.split("-").map(e => {
        return e.charAt(0).toUpperCase() + e.slice(1);
    }).join("");
};

// stage 1
document.querySelectorAll("#stage1-box .interactive").forEach(div => {
    div.addEventListener("click", () => {
        let choice = div.querySelector("span").id;
        DATA["offer_type"] = choice;

        document.getElementById("stage1").hidden = true;

        if(choice == "offer-transport") {
            document.getElementById("stage2-transport").hidden = false;
        } else if(choice == "need-transport") {
            document.getElementById("stage3-transport").hidden = false;
        } else if(choice == "offer-accommodation") {
            document.getElementById("stage2-accommodation").hidden = false;
        } else{
            document.getElementById("stage2").hidden = false;
        }
    });
})

// stage 2 accommodation
document.getElementsByName("accommodation-type").forEach(elem => {
    elem.addEventListener("click", () => {
        document.getElementById("accommodation-stage2-nextbtn").disabled = false;
    });
})

document.getElementById("accommodation-stage2-nextbtn").addEventListener("click", () => {
    DATA.housing_type = radio_value(document.getElementById("stage2-accommodation"), "input[name='accommodation-type']");
    DATA.allows_pets = document.getElementById("petsval").checked;
    DATA.provides_necessities = document.getElementById("necessitiesval").checked;
    DATA.offers_transport = document.getElementById("transportval").checked;

    document.getElementById("stage2-accommodation").hidden = true;

    open_location_box();
});
// stage 2 vehicle
document.querySelectorAll("#stage2-transport .interactive").forEach(elem => {
    elem.addEventListener("click", () => {
        DATA.vehicle_type = elem.id;

        document.getElementById("stage2-transport").hidden = true;
        document.getElementById("stage3-transport").hidden = false;
    });
});

// stage 2 other
document.querySelector("#stage2-nextbtn").addEventListener("click", () => {
    document.getElementById("stage2").hidden = true;

    open_location_box();
});


// stage 3 submit
document.querySelector("#stage3").addEventListener("submit", e => {
    window.scrollTo(0, 0);

    e.preventDefault();

    document.getElementById("stage3").hidden = true;
    document.getElementById("stage4").hidden = false;

    DATA.name = document.getElementById("namevalin").value;
    DATA.contact = document.getElementById("contactvalin").value;
    DATA.spaces = document.getElementById("spacesvalin").value;
    DATA.password = document.getElementById("passwordvalin").value;

    DATA.title = document.getElementById("titleval").value;
    DATA.description = document.getElementById("descriptionval").value;

    return false;
});


let TRANSPORT_STEP = 0;

// stage 3 vehicle
document.querySelector("#transport-stage3-nextbtn").addEventListener("click", () => {
    TRANSPORT_STEP = 1;

    document.getElementById("stage3-transport").hidden = true;
    open_location_box();
});

// stage 4 vehicle
document.querySelector("#transport-stage4-nextbtn").addEventListener("click", () => {
    TRANSPORT_STEP = 2;

    document.getElementById("stage4-transport").hidden = true;
    open_location_box();
});


// raw file image -> base64
function encodeBase64(elm, ok) {
    var file = elm.files[0];
    var imgReader = new FileReader();
    imgReader.onloadend = function() {
        ok(imgReader.result);
    }
    imgReader.readAsDataURL(file);
}

// stage 4 skipped
document.querySelector("#stage4-skipbtn").addEventListener("click", e => {
    e.preventDefault();
    e.stopPropagation();
    e.stopImmediatePropagation();

    document.getElementById("stage4").reset();
    document.getElementById("stage4").hidden = true;
    document.getElementById("stage5").hidden = false;

    DATA.personal = null;
});

// stage 4 other
document.querySelector("#stage4").addEventListener("submit", e => {
    e.preventDefault();

    document.getElementById("stage4").hidden = true;
    document.getElementById("stage5").hidden = false;

    try {
        encodeBase64(document.getElementById("pic"), photo => {

            DATA.personal = {
                first_name: document.getElementById("firstnamevalin").value,
                last_name: document.getElementById("lastnamevalin").value,
                age: parseInt(document.getElementById("agevalin").value),
                gender: document.getElementById("gendervalin").value,
                photo_b64_img: photo
            }

        });

    } catch (e) {
        DATA.personal = null;
        alert("error, uploaded corrupted file? " + e.toString());
    }
});


// stage 5 vehicle over
document.querySelector("#location-verify-yes").addEventListener("click", () => {
    document.getElementById("stage5-transport").hidden = true;
    map.unborrow();

    document.getElementById("stage3").hidden = false;
});


document.querySelector("#location-sel-box").addEventListener("submit", e => {
    /*
    possible scenarios:
        - doing transport 1st step
        - doing transport 2nd step

        - doing any other offer last step
     */
    e.preventDefault();

    let country = radio_value(document.getElementById("country-radios"), "input[name='country']");
    let city = document.getElementById("cityval").value;
    let street = document.getElementById("streetval").value;
    let additional = document.getElementById("additionalval").value;
    let geo = map.map.getCenter();

    map.set_coord_status(false);
    map.unborrow();
    document.getElementById("location-sel-box").hidden = true;

    window.scrollTo(0, 0);

    if (TRANSPORT_STEP == 1) {
        // save first marker
        map.checkpoint();

        DATA.from = {
            geo: geo,
            country: country,
            city: city,
            street: street,
            additional: additional
        };

        document.getElementById("stage4-transport").hidden = false;
    } else if (TRANSPORT_STEP == 2) {
        TRANSPORT_STEP = 3;

        let c2 = L.marker(map.map.getCenter(), {icon: map.coordIconGreen}).addTo(map.map);
        L.polyline([map.CHECKPOINT_MARKER.getLatLng(), c2.getLatLng()], {color: "black"}).addTo(map.map);


        DATA.to = {
            geo: geo,
            country: country,
            city: city,
            street: street,
            additional: additional
        };

        let stage5 = document.getElementById("stage5-transport");
        stage5.querySelector("#location-verify-from").innerHTML = `${DATA.from.country}, ${DATA.from.city}, ${DATA.from.street}, ${DATA.from.additional}`;
        stage5.querySelector("#location-verify-to").innerHTML = `${DATA.to.country}, ${DATA.to.city}, ${DATA.to.street}, ${DATA.to.additional}`;
        stage5.hidden = false;

        map.borrow(document.getElementById("temp-map-box-2"));
    } else{
        // other offer types
        DATA.from = {
            geo: geo,
            country: country,
            city: city,
            street: street,
            additional: additional
        };

        document.getElementById("stage3").hidden = false;
    }

    return false;
});


// captcha ok
window.captcha_ok = (token) => {
    DATA.captcha_token = token;

    // compile DATA into workable form for the API
    let obj = {
        name: DATA.name,
        personal: DATA.personal,
        contact: DATA.contact,
        title: DATA.title,
        location: {
            geo: {
                lat: DATA.from.geo.lat,
                lon: DATA.from.geo.lng
            },
            country: DATA.from.country,
            city: DATA.from.city,
            street_address: DATA.from.street,
            additional_info: DATA.from.additional
        },
        description: DATA.description,
        available_spaces: parseInt(DATA.spaces),
        translated: true,
        accepted_terms: true,
        password: DATA.password,
        captcha: DATA.captcha_token
    }

    Object.defineProperty(obj, "otype", {value:
            DATA.offer_type == "offer-transport" ?
                {"OfferTransport": {
                        from_to: {
                            from: {
                                geo: {
                                    lat: DATA.from.geo.lat,
                                    lon: DATA.from.geo.lng
                                },
                                country: DATA.from.country,
                                city: DATA.from.city,
                                street_address: DATA.from.street,
                                additional_info: DATA.from.additional
                            },
                            to: {
                                geo: {
                                    lat: DATA.to.geo.lat,
                                    lon: DATA.to.geo.lng
                                },
                                country: DATA.to.country,
                                city: DATA.to.city,
                                street_address: DATA.to.street,
                                additional_info: DATA.to.additional
                            }
                        },
                        vehicle: DATA.vehicle_type
                    }} : (DATA.offer_type == "offer-accommodation") ? {"OfferAccommodation":{
                        housing_type: DATA.housing_type,
                        offers_transport: DATA.offers_transport,
                        allows_pets: DATA.allows_pets,
                        provides_necessities: DATA.provides_necessities
                    }} : (DATA.offer_type == "need-transport") ? {"NeedTransport":{
                        from: {
                            geo: {
                                lat: DATA.from.geo.lat,
                                lon: DATA.from.geo.lng
                            },
                            country: DATA.from.country,
                            city: DATA.from.city,
                            street_address: DATA.from.street,
                            additional_info: DATA.from.additional
                        },
                        to: {
                            geo: {
                                lat: DATA.to.geo.lat,
                                lon: DATA.to.geo.lng
                            },
                            country: DATA.to.country,
                            city: DATA.to.city,
                            street_address: DATA.to.street,
                            additional_info: DATA.to.additional
                        }
                    }} : choice_to_type(DATA.offer_type),
        enumerable: true}
    );

    console.log(obj);
    console.log(JSON.stringify(obj));

    api.create_offer(obj).then(data => {
        document.getElementById("stage5").hidden = true;
        document.getElementById("stage6").hidden = false;

        document.getElementById("success").hidden = false;
        document.getElementById("finish-good").hidden = false;

        document.getElementById("offer-id-val").textContent = "offer id: " + data.id;
    }).catch(err => {
        document.getElementById("stage5").hidden = true;
        document.getElementById("stage6").hidden = false;

        document.getElementById("failure").hidden = false;
        document.getElementById("finish-bad").hidden = false;

        alert(err);
    });
}

