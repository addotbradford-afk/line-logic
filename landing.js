(function () {
  "use strict";

  const landing = document.getElementById("landing");
  const enter = document.getElementById("landing-enter");

  if (!landing || !enter) return;

  const query = new URLSearchParams(window.location.search);

  if (query.get("home") === "1") {
    landing.remove();
    window.history.replaceState({}, "", window.location.pathname);
    return;
  }

  let hasEntered = false;
  let removeFallback;

  function showHome() {
    if (hasEntered) return;
    hasEntered = true;

    window.clearTimeout(autoEnter);
    landing.classList.add("is-leaving");

    const removeLanding = function () {
      window.clearTimeout(removeFallback);
      landing.remove();
    };

    landing.addEventListener("transitionend", removeLanding, { once: true });
    removeFallback = window.setTimeout(removeLanding, 600);
  }

  enter.addEventListener("click", showHome);
  const autoEnter = window.setTimeout(showHome, 2000);
})();
