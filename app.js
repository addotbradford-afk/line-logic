(function () {
  "use strict";

  const scenarios = Array.isArray(window.LINE_LOGIC_SCENARIOS) ? window.LINE_LOGIC_SCENARIOS : [];
  const searchInput = document.querySelector("#scenario-search");
  const focusFilter = document.querySelector("#focus-filter");
  const competencyOptions = document.querySelector("#competency-options");
  const competencySummary = document.querySelector("#competency-summary");
  const clearButton = document.querySelector("#clear-filters");
  const grid = document.querySelector("#scenario-grid");
  const resultCount = document.querySelector("#result-count");
  const emptyState = document.querySelector("#empty-state");
  const modal = document.querySelector("#scenario-modal");
  const modalPanel = modal.querySelector(".modal-panel");
  const modalContent = document.querySelector("#modal-content");
  let lastFocusedElement = null;

  const escapeHtml = (value) => String(value).replace(/[&<>'"]/g, (character) => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", "'": "&#039;", '"': "&quot;"
  })[character]);

  const normalise = (value) => String(value || "").toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
  const uniqueSorted = (items) => [...new Set(items)].sort((a, b) => a.localeCompare(b));

  function complexityDots(level) {
    const safeLevel = Math.max(0, Math.min(3, Number(level) || 0));
    return `<span class="complexity-dots" aria-label="Complexity ${safeLevel} out of 3">${[1, 2, 3]
      .map((dot) => `<span class="dot${dot <= safeLevel ? " active" : ""}" aria-hidden="true"></span>`).join("")}</span>`;
  }

  function populateFilters() {
    const focuses = uniqueSorted(scenarios.flatMap((scenario) => scenario.focus || []));
    const competencies = uniqueSorted(scenarios.flatMap((scenario) => scenario.competencies || []));
    focuses.forEach((focus) => focusFilter.insertAdjacentHTML("beforeend", `<option value="${escapeHtml(focus)}">${escapeHtml(focus)}</option>`));
    competencyOptions.innerHTML = competencies.map((competency) => `
      <label><input type="checkbox" value="${escapeHtml(competency)}"> <span>${escapeHtml(competency)}</span></label>
    `).join("");
  }

  function selectedCompetencies() {
    return [...competencyOptions.querySelectorAll("input:checked")].map((input) => input.value);
  }

  function searchableText(scenario) {
    return normalise([
      scenario.ref, scenario.title, scenario.overview, scenario.safetyData,
      ...(scenario.focus || []), ...(scenario.competencies || []), ...(scenario.keywords || [])
    ].join(" "));
  }

  function filteredScenarios() {
    const terms = normalise(searchInput.value).split(" ").filter(Boolean);
    const focus = focusFilter.value;
    const competencies = selectedCompetencies();
    return scenarios.filter((scenario) => {
      const haystack = searchableText(scenario);
      const matchesSearch = terms.every((term) => haystack.includes(term));
      const matchesFocus = !focus || (scenario.focus || []).includes(focus);
      const matchesCompetencies = competencies.every((competency) => (scenario.competencies || []).includes(competency));
      return matchesSearch && matchesFocus && matchesCompetencies;
    });
  }

  function renderCard(scenario) {
    return `
      <article class="scenario-card" tabindex="0" role="button" data-ref="${escapeHtml(scenario.ref)}" aria-label="Preview ${escapeHtml(scenario.ref)}: ${escapeHtml(scenario.title)}">
        <div class="card-topline">
          <span class="reference">${escapeHtml(scenario.ref)}</span>
          <span class="complexity-label">Complexity ${complexityDots(scenario.complexity)}</span>
        </div>
        <h2>${escapeHtml(scenario.title)}</h2>
        <p>${escapeHtml(scenario.overview)}</p>
        <div class="tag-list">${(scenario.focus || []).slice(0, 3).map((tag) => `<span>${escapeHtml(tag)}</span>`).join("")}</div>
        <div class="card-footer">
          <span>${(scenario.competencies || []).map(escapeHtml).join(" · ")}</span>
          <span class="preview-link">Preview <span aria-hidden="true">→</span></span>
        </div>
      </article>`;
  }

  function render() {
    const results = filteredScenarios();
    resultCount.textContent = `${results.length} ${results.length === 1 ? "scenario" : "scenarios"} found`;
    grid.innerHTML = results.map(renderCard).join("");
    emptyState.hidden = results.length !== 0;
    clearButton.classList.toggle("is-visible", Boolean(searchInput.value || focusFilter.value || selectedCompetencies().length));
    const selected = selectedCompetencies();
    competencySummary.textContent = selected.length ? selected.join(", ") : "All competencies";
  }

  function openModal(ref) {
    const scenario = scenarios.find((item) => item.ref === ref);
    if (!scenario) return;
    lastFocusedElement = document.activeElement;
    const hasUrl = typeof scenario.url === "string" && scenario.url.trim().length > 0;
    const explore = hasUrl
      ? `<a class="explore-button" href="${escapeHtml(scenario.url)}" target="_top">Explore Scenario <span aria-hidden="true">→</span></a>`
      : `<button class="explore-button" type="button" disabled>Explore Scenario <span class="coming-soon">Link coming soon</span></button>`;
    modalContent.innerHTML = `
      <div class="modal-topline">
        <span class="reference">${escapeHtml(scenario.ref)}</span>
        <span class="complexity-label">Complexity ${complexityDots(scenario.complexity)}</span>
      </div>
      <h2 id="modal-title">${escapeHtml(scenario.title)}</h2>
      <p id="modal-overview" class="modal-overview">${escapeHtml(scenario.overview)}</p>
      <div class="detail-block"><h3>Operational focus</h3><div class="tag-list">${(scenario.focus || []).map((tag) => `<span>${escapeHtml(tag)}</span>`).join("")}</div></div>
      <div class="detail-grid">
        <div class="detail-block"><h3>Pilot competencies</h3><p>${(scenario.competencies || []).map(escapeHtml).join(" · ") || "Not specified"}</p></div>
        <div class="detail-block"><h3>Safety data</h3><p>${escapeHtml(scenario.safetyData || "Not specified")}</p></div>
      </div>
      ${explore}`;
    modal.hidden = false;
    document.body.classList.add("modal-open");
    modalPanel.focus();
  }

  function closeModal() {
    if (modal.hidden) return;
    modal.hidden = true;
    document.body.classList.remove("modal-open");
    if (lastFocusedElement) lastFocusedElement.focus();
  }

  function clearFilters() {
    searchInput.value = "";
    focusFilter.value = "";
    competencyOptions.querySelectorAll("input").forEach((input) => { input.checked = false; });
    render();
    searchInput.focus();
  }

  populateFilters();
  render();
  searchInput.addEventListener("input", render);
  focusFilter.addEventListener("change", render);
  competencyOptions.addEventListener("change", render);
  clearButton.addEventListener("click", clearFilters);
  grid.addEventListener("click", (event) => {
    const card = event.target.closest(".scenario-card");
    if (card) openModal(card.dataset.ref);
  });
  grid.addEventListener("keydown", (event) => {
    const card = event.target.closest(".scenario-card");
    if (card && (event.key === "Enter" || event.key === " ")) {
      event.preventDefault();
      openModal(card.dataset.ref);
    }
  });
  modal.addEventListener("click", (event) => {
    if (event.target.closest("[data-close-modal]")) closeModal();
  });
  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape") closeModal();
    if (event.key === "Tab" && !modal.hidden) {
      const focusable = [...modalPanel.querySelectorAll('button:not([disabled]), a[href], [tabindex]:not([tabindex="-1"])')];
      if (!focusable.length) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
      else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
    }
  });
})();
