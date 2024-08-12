import "./video";
import "~/css/index.css";

const topNavigation = document.getElementById("top-navigation");
const navigation = document.getElementById("navigation");

window.addEventListener("scroll", () => {
  const documentTop = document.documentElement.scrollTop;
  const navigationEl = document.getElementById("navigation");
  const navigationTop = navigationEl.offsetTop - 50;
  if (documentTop > navigationTop) {
    topNavigation.classList.remove("opacity-0", "scale-90");
    topNavigation.classList.add("opacity-100", "scale-100");

    navigation.classList.add("opacity-0");
    navigation.classList.remove("opacity-100");
  } else {
    topNavigation.classList.add("opacity-0", "scale-90");
    topNavigation.classList.remove("opacity-100", "scale-100");

    navigation.classList.add("opacity-100");
    navigation.classList.remove("opacity-0");
  }
});
