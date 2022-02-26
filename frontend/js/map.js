import "leaflet";
import anime from "animejs";

let zoom = 5;
let lat = 50;
let lon = 20;

let map = L.map('map', {
    minZoom: 1,
    maxZoom: 20
}).setView([lat, lon], zoom);

L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
}).addTo(map);

let carIconOffer = L.icon({
    iconUrl: "assets/icons8-car-90.png",
    iconSize: [25, 25],
    iconAnchor: [12, 12],
    className: "marker-green"
});
let busIconOffer = L.icon({
    iconUrl: "assets/icons8-bus-90.png",
    iconSize: [25, 25],
    iconAnchor: [12, 12],
    className: "marker-green"
});
let peopleIconOffer = L.icon({
    iconUrl: "assets/icons8-users-90.png",
    iconSize: [25, 25],
    iconAnchor: [12, 12],
    className: "marker-green"
});
let otherIconOffer  = L.icon({
    iconUrl: "assets/icons8-question-mark-96.png",
    iconSize: [25, 25],
    iconAnchor: [12, 12],
    className: "marker-green"
});

let carIconNeed = L.icon({
    iconUrl: "assets/icons8-car-90.png",
    iconSize: [25, 25],
    iconAnchor: [12, 12],
    className: "marker-orange"
});
let peopleIconNeed  = L.icon({
    iconUrl: "assets/icons8-users-90.png",
    iconSize: [25, 25],
    iconAnchor: [12, 12],
    className: "marker-orange"
});
let otherIconNeed  = L.icon({
    iconUrl: "assets/icons8-question-mark-96.png",
    iconSize: [25, 25],
    iconAnchor: [12, 12],
    className: "marker-orange"
});

let typeIcons = (otype) => {
    if (otype.hasOwnProperty("OfferTransport")) {
        let vehicle = otype["OfferTransport"]["vehicle"];
        return vehicle == "Bus" ? busIconOffer : carIconOffer;
    } else if (otype.hasOwnProperty("OfferAccommodation")) {
        return peopleIconOffer;
    } else if (otype.hasOwnProperty("OfferOther")) {
        return otherIconOffer;
    } else if (otype.hasOwnProperty("NeedTransport")) {
        return carIconNeed;
    } else if (otype.hasOwnProperty("NeedAccommodation")) {
        return peopleIconNeed;
    }

    return otherIconNeed;
}

let open = false;
function open_map() {
    open = true;
    anime({
        targets: "#map-box",
        opacity: [0, 1],
        maxHeight: [0, 980],
        scale: [0, 1],
        duration: 1000,
        easing: "easeOutQuad",
        begin: (anim) => {
            anim.animatables[0].target.style.display = "";
        }
    });
}

export let render_marker = (offer) => {
    if (!open) {
        open_map();
    }

    let icon = typeIcons(offer.otype);
    L.marker([offer.location.geo.lat, offer.location.geo.lon], {icon: icon}).addTo(map).on("mouseover", () => {
        // todo display details next to map
    });
}

export let focus = (offer) => {
    map.flyTo([offer.location.geo.lat, offer.location.geo.lon], 8, {
        duration: 5
    });
}

/*
L.marker([lat, lon], {icon: peopleIconNeed}).addTo(map).on("mouseover", () => {

})
 */