import * as map from "./map.js";

export let offers_ids = [];
export let offers = [];

export let fetch_offer_ids = async () => {
    let resp = await fetch("/api/all", {
        cache: "no-cache"
    });

    if (resp.ok) {
        offers_ids = await resp.json();
    } else{
        console.warn("/api/all call failed. can't fetch new offers ids")
    }
    return offers_ids;
}

export let fetch_offer = async (id) => {
    let resp = await fetch("/api/get", {
        cache: "no-cache",
        method: "POST",
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            id: id
        })
    });

    if (resp.ok) {
        let offer = await resp.json();
        // do some parsing

        if (
            offer["otype"].hasOwnProperty("OfferTransport")
        ) {
            offer.to = offer["otype"]["OfferTransport"]["from_to"]["to"];
        }

        if (
            offer["otype"].hasOwnProperty("NeedTransport")
        ) {
            offer.to = offer["otype"]["NeedTransport"]["to"];
        }


        return offer;
    } else {
        console.warn("/api/get call failed. can't fetch offer");
        throw new Error("/api/get call failed")
    }
}


export let fetch_all_offers = async () => {
    console.log(offers_ids);
    map.clear_markers();

    for (const offer_id of offers_ids) {
        await fetch_offer(offer_id)
            .then(offer => {
                offers.push(offer);
                map.render_marker(offer);

                console.log(offer);
            })
            .catch(e => {
                console.warn(e);
            })
    }
}

export let refresh_offers = async () => {
    offers = [];
    offers_ids = [];

    await fetch_offer_ids();
    await fetch_all_offers();

    console.log("fetched", offers.length, "offers");
    console.log(offers);
    document.title = "[" + offers.length + "] listings | uatranshelp"
}


export let create_offer = async (obj) => {
    let resp = await fetch("/api/new", {
        cache: "no-cache",
        method: "POST",
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(obj)
    });

    if (resp.ok) {
        return resp.json();
    } else {
        console.warn("/api/new call failed. can't create offer");
        throw new Error("/api/new call failed: " + await resp.text())
    }
}

