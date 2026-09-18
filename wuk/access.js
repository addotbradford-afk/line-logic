(function () {
  "use strict";

  const roleKey = "lineLogicRole";
  const validRoles = new Set(["user", "admin"]);
  const adminPasswordHash = "d1fe1c13";

  const accessOverlay = document.getElementById("accessOverlay");
  const userAccessButton = document.getElementById("userAccessButton");
  const adminAccessToggle = document.getElementById("adminAccessToggle");
  const adminAccessForm = document.getElementById("adminAccessForm");
  const adminUsername = document.getElementById("adminUsername");
  const adminPassword = document.getElementById("adminPassword");
  const accessError = document.getElementById("accessError");

  function readRole() {
    try {
      const role = window.sessionStorage.getItem(roleKey);
      return validRoles.has(role) ? role : null;
    } catch (error) {
      return null;
    }
  }

  function writeRole(role) {
    try {
      window.sessionStorage.setItem(roleKey, role);
    } catch (error) {
      // The soft access layer remains usable without session storage.
    }
  }

  function clearRole() {
    try {
      window.sessionStorage.removeItem(roleKey);
    } catch (error) {
      // Reloading still returns the visitor to the access screen.
    }
  }

  function hashAccessCode(value) {
    let hash = 2166136261;

    for (let index = 0; index < value.length; index += 1) {
      hash ^= value.charCodeAt(index);
      hash = Math.imul(hash, 16777619);
    }

    return (hash >>> 0).toString(16).padStart(8, "0");
  }

  function mountSessionControl(role) {
    document.querySelector(".session-control")?.remove();

    const control = document.createElement("aside");
    control.className = "session-control";
    control.setAttribute("aria-label", "Current Line Logic access");

    const label = document.createElement("span");
    label.className = "session-role";
    label.textContent = role === "admin" ? "ADMIN · Admin" : "USER";

    const signOut = document.createElement("button");
    signOut.className = "session-sign-out";
    signOut.type = "button";
    signOut.textContent = "Sign out";

    signOut.addEventListener("click", function () {
      clearRole();
      window.location.replace("./?home=1&login=1");
    });

    control.append(label, signOut);
    (document.querySelector(".site-session-slot") || document.body).append(control);
  }

  function unlockSite(role) {
    document.documentElement.dataset.lineLogicRole = role;
    document.body.classList.remove("access-locked");

    if (accessOverlay) {
      accessOverlay.hidden = true;
    }

    mountSessionControl(role);
  }

  function completeAccess(role) {
    writeRole(role);
    unlockSite(role);
  }

  function showAccessOverlay() {
    const currentRole = readRole();

    if (currentRole) {
      unlockSite(currentRole);
      return;
    }

    if (!accessOverlay) return;

    accessOverlay.hidden = false;
    document.body.classList.add("access-locked");
    userAccessButton.focus();
  }

  window.LineLogicAccess = Object.freeze({
    getRole: readRole,
    isAdmin: function () {
      return readRole() === "admin";
    }
  });

  const currentRole = readRole();

  if (!accessOverlay) {
    if (!currentRole) {
      window.location.replace("./?home=1&login=1");
      return;
    }

    unlockSite(currentRole);
    return;
  }

  if (currentRole) {
    unlockSite(currentRole);
  }

  userAccessButton.addEventListener("click", function () {
    completeAccess("user");
  });

  adminAccessToggle.addEventListener("click", function () {
    const willOpen = adminAccessForm.hidden;
    adminAccessForm.hidden = !willOpen;
    adminAccessToggle.setAttribute("aria-expanded", String(willOpen));
    accessError.textContent = "";

    if (willOpen) adminUsername.focus();
  });

  adminAccessForm.addEventListener("submit", function (event) {
    event.preventDefault();

    const usernameMatches =
      adminUsername.value.trim().toLowerCase() === "admin";

    const passwordMatches =
      hashAccessCode(adminPassword.value) === adminPasswordHash;

    if (!usernameMatches || !passwordMatches) {
      accessError.textContent = "The administrator details do not match.";
      adminPassword.select();
      return;
    }

    accessError.textContent = "";
    adminAccessForm.reset();
    completeAccess("admin");
  });

  window.addEventListener("lineLogicLandingComplete", showAccessOverlay);

  if (document.documentElement.classList.contains("skip-landing")) {
    window.requestAnimationFrame(showAccessOverlay);
  }
})();

