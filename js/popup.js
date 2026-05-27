const openPopup = document.getElementById("openPopup");
const popup = document.getElementById("popup");
const closeBtn = document.querySelector(".close");

/* Åbn popup */
openPopup.addEventListener("click", function(e) {
    e.preventDefault();
    e.stopPropagation();

    popup.style.display = "flex";
});

/* Luk popup via X */
closeBtn.addEventListener("click", function(e) {
    e.stopPropagation();

    popup.style.display = "none";
});

/* Luk popup ved klik udenfor boksen */
popup.addEventListener("click", function(e) {
    if (e.target === popup) {
        popup.style.display = "none";
    }
});