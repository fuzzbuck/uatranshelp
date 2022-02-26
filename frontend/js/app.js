import "./locale.js"
import "./anim.js"
import "./map.js"
import * as api from "./api.js";
import * as offer from "./offer.js";


let refresh = document.getElementById("refresh");
refresh.addEventListener("click", function() {
    this.setAttribute("disabled", "true");

    setTimeout(() => {
        api.refresh_offers().then(() => {
            offer.render_current();
            this.removeAttribute("disabled");
        });
    });
});

refresh.click();

console.log("ok");