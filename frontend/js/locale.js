/// Locale manager

export let locales = {
    "en": "./locales/english.json",
    "pl": "./locales/polish.json",
    "ua": "./locales/ukrainian.json"
}
export let current = "en";
export let current_data = {};

let update_with_data = (data) => {
    document.querySelectorAll(".tr").forEach(elem => {
        if (data[elem.id] != undefined) {
            elem.innerHTML = data[elem.id];
        }
    });
};

document.querySelectorAll(".lang-select img").forEach(elem => {
    elem.addEventListener("click", () => {
        // update(elem.id);
        document.querySelector(".lang-select .active").classList.remove("active");
        elem.classList.add("active");

        update(elem.id);
    });
})

export let update = (locale) => {
    fetch(locales[locale]).then(async r => {
        if (!r.ok) {
            throw new Error("Can't download locale " + locale);
        }
        current = locale;
        current_data = await r.json();

        return current_data;
    }).then(data => {
        update_with_data(data);
    })
}

export let tr = (elem) => {
    // special cases
    if (elem.id == "")
    elem.innerHTML = current_data[elem.id];
}

// todo - update based on browser configured language ?
update("en");
