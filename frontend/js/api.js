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
        return resp.json();
    } else {
        console.warn("/api/get call failed. can't fetch offer");
        throw new Error("/api/get call failed")
    }
}


export let fetch_all_offers = async () => {
    console.log(offers_ids);

    for (const offer_id of offers_ids) {
        await fetch_offer(offer_id)
            .then(offer => {
                offers.push(offer);
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

