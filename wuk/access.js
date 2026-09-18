(function () {
  "use strict";

  const roleKey = "lineLogicWizzPreviewRole";
  const validRoles = new Set(["user", "admin"]);

  const accessOverlay = document.getElementById("accessOverlay");
  const userAccessButton = document.getElementById("userAccessButton");

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
    window.dispatchEvent(new CustomEvent("lineLogicAccessGranted", { detail: { freshLogin: true } }));
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

  showAccessOverlay();
  if (currentRole) window.requestAnimationFrame(function () {
    window.dispatchEvent(new CustomEvent("lineLogicAccessGranted", { detail: { freshLogin: false } }));
  });
})();
