import "leaflet";
import anime from "animejs";

let zoom = 3;
let lat = 52;
let lon = 25;

const ORIG_PARENT = document.getElementById("map").parentNode;

export let map = L.map('map', {
    minZoom: 3,
    maxZoom: 15
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

export let coordIconOrange = L.icon({
    iconUrl: "assets/icons8-plus-64.png",
    iconSize: [32, 32],
    iconAnchor: [16, 16],
    className: "marker-orange"
});

export let coordIconGreen = L.icon({
    iconUrl: "assets/icons8-plus-64.png",
    iconSize: [32, 32],
    iconAnchor: [16, 16],
    className: "marker-green"
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
export function open_map() {
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
        },
    });

    map.locate({setView: true, maxZoom: 20});
}

export let OFFER_MARKERS = [];
export let render_marker = (offer) => {
    let icon = typeIcons(offer.otype);
    let marker = L.marker([offer.location.geo.lat, offer.location.geo.lon], {icon: icon}).addTo(map).on("mouseover", () => {
        // todo display details next to map
    });
    OFFER_MARKERS.push(marker);
}

export let clear_markers = () => {
    OFFER_MARKERS.forEach(marker => {
        map.removeLayer(marker);
    });
    OFFER_MARKERS = [];
}

export let coord_on = false;
export let CHECKPOINT_MARKER = null;
export let LINE = null;
let coord_marker = L.marker([0.0, 0.0], {icon: coordIconOrange}).addTo(map);

export let set_coord_status = (val) => {
    coord_on = val;
}

map.on("moveend", () => {
    let pos = map.getCenter();

    document.getElementById("lat").innerHTML = pos.lat.toFixed(6);
    document.getElementById("lon").innerHTML = pos.lng.toFixed(6);;

    console.log(coord_on);
    if (coord_on) {
        coord_marker.setLatLng(pos);

        if (CHECKPOINT_MARKER != null) {
            if (LINE != null) {
                map.removeLayer(LINE);
            }
            LINE = L.polyline([pos, CHECKPOINT_MARKER.getLatLng()], {color: "red"}).addTo(map);
        }
    } else {
        if (LINE != null) {
            map.removeLayer(LINE);
            LINE = null;
        }
    }
})



export let focus = (offer) => {
    map.flyTo([offer.location.geo.lat, offer.location.geo.lon], 8, {
        duration: 5
    });
}

export let borrow = (elem) => {
    elem.appendChild(document.getElementById("map"));
}

export let unborrow = () => {
    ORIG_PARENT.appendChild(document.getElementById("map"));
}

export let checkpoint = () => {
    CHECKPOINT_MARKER = L.marker(map.getCenter(), {icon: coordIconOrange}).addTo(map);
}

/*
L.marker([lat, lon], {icon: peopleIconNeed}).addTo(map).on("mouseover", () => {

})
 */