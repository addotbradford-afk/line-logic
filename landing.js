(function () {
  "use strict";

  const landing = document.getElementById("landing");
  const enter = document.getElementById("landing-enter");

  if (!landing || !enter) return;

  let hasEntered = false;
  let removeFallback;

  function showDashboard() {
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

  enter.addEventListener("click", showDashboard);
  const autoEnter = window.setTimeout(showDashboard, 2000);
})();
