import anime from 'animejs/lib/anime.es.js';

window.onload = () => {
    anime({
        targets: ".info-warning",
        opacity: [0, 1],
        translateY: [-70, 0],
        duration: 700,
        easing: "easeOutQuad",
        delay: anime.stagger(400)
    });

    /*
    anime({
        targets: "a, span, p, button, h1, h2, img, div",
        opacity: [0, 1],
        duration: 80,
        easing: "easeOutQuad",
    });
     */
}
