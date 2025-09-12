// src/sidebar/register-prep-tab.js

import { MODULE_ID } from "../constants.js";
import { createPrepJournal, getActorRowsHTML } from "../journal/generator.js";

const ACTION_ID = "lazy-gm-prep__new-prep";

/* ---------------------------------
 * 1) Header-menu control (AppV2)
 *    Keep the kebab-menu entry for consistency with v13 controls.
 *    Ref: getHeaderControls{ClassName} and generic getHeaderControlsApplicationV2
 * --------------------------------- */
function addNewPrepMenuControl(controls) {
  if (!game.user.isGM) return;
  if (Array.isArray(controls) && controls.some(c => c?.action === ACTION_ID)) return;

  controls.unshift({
    action: ACTION_ID,                                   // v13 requires a string identifier
    icon: "fa-solid fa-clipboard-list",
    label: game.i18n.localize("lazy-gm-prep.header.button"),
    onClick: () => createPrepJournal()
  });
}

[
  "getHeaderControlsJournalDirectory",       // class-specific
  "getHeaderControlsDocumentDirectory",      // parent in chain
  "getHeaderControlsAbstractSidebarTab",     // higher in chain
  "getHeaderControlsApplicationV2"           // generic fallback
].forEach(hookName => {
  Hooks.on(hookName, (app, controls) => {
    try {
      // If we hit the generic hook, gate by class
      if (hookName === "getHeaderControlsApplicationV2") {
        const name = app?.constructor?.name;
        if (!["JournalDirectory", "DocumentDirectory", "AbstractSidebarTab"].includes(name)) return;
      }
      addNewPrepMenuControl(controls);
    } catch (err) {
      console.error(`${MODULE_ID} | Failed to add header control via ${hookName}:`, err);
    }
  });
});

/* ---------------------------------
 * 2) Visible inline button in the Journal Directory header
 *    We add a real <button> next to the directory’s built-in header buttons.
 *    Uses native DOM; runs on every render to survive re-renders.
 * --------------------------------- */
function ensureInlineHeaderButton(dirEl) {
  if (!game.user.isGM) return;

  // Directory header element (v13 JournalDirectory)
  // Your console log shows the app container as: section#journal.tab.sidebar-tab.directory...
  // The header is a child element.
  const header = dirEl.querySelector(".directory-header");
  if (!header) return;

  // Common containers across versions/themes
  const container =
    header.querySelector(".action-buttons") ||
    header.querySelector(".header-actions") ||
    header.querySelector(".header-controls") ||
    header;

  // Deduplicate
  if (container.querySelector('[data-action="lazy-gm-prep-inline"]')) return;

  const btn = document.createElement("button");
  btn.type = "button";
  btn.dataset.action = "lazy-gm-prep-inline";
  btn.classList.add("lazy-gm-prep-btn", "header-control", "create-entry");
  
  // FA6 icon + localized label
  btn.innerHTML = `<i class="fa-solid fa-clipboard-list"></i> ${game.i18n.localize("lazy-gm-prep.header.button")}`;

  btn.addEventListener("click", () => createPrepJournal());

  container.appendChild(btn);
}

// We know from your logs that renderJournalDirectory fires. Use it.
Hooks.on("renderJournalDirectory", (app, element /*, data, options */) => {
  // element is the native DOM root for the app; inject in-place
  ensureInlineHeaderButton(element);
});

/* ---------------------------------
 * 3) Journal/Page wiring (unchanged): inject actor rows and handlers
 *    Use the generic AppV2 render hook so it covers JournalSheetV2 and page sheets.
 * --------------------------------- */
Hooks.on("renderApplicationV2", (app, element) => {
  const cls = app?.constructor?.name;
  const isJournal = cls === "JournalSheetV2" || cls === "JournalPageSheetV2" || cls === "JournalTextPageSheetV2";
  if (!isJournal) return;

  // 1) Inject actor rows into placeholders
  for (const el of element.querySelectorAll(".lazy-gm-actors")) {
    el.innerHTML = getActorRowsHTML();
  }

  // 2) Open actor sheet
  element.addEventListener("click", (ev) => {
    const btn = ev.target?.closest?.(".lazy-gm-open-sheet");
    if (!btn) return;
    ev.preventDefault();
    const actor = game.actors.get(btn.dataset.actorId);
    if (actor) actor.sheet.render(true);
  });

  // 3) “Today” buttons
  element.addEventListener("click", (ev) => {
    const btn = ev.target?.closest?.(".lazy-gm-today");
    if (!btn) return;

    const { field, actorId } = btn.dataset;
    const today = new Date().toISOString().split("T")[0];
    const row = btn.closest(".lazy-gm-actor-row");
    const input = row?.querySelector(`.lazy-gm-date[data-field="${field}"]`);

    if (input) {
      input.value = today;
      input.dispatchEvent(new Event("change", { bubbles: true }));
    } else {
      console.warn(`${MODULE_ID} | Missing input for ${field} on actor ${actorId}`);
    }
  });

  // 4) Persist date changes to actor flags
  element.addEventListener("change", async (ev) => {
    const input = ev.target?.closest?.(".lazy-gm-date");
    if (!input) return;

    const { actorId, field } = input.dataset;
    const validFields = ["lastSeen", "lastSpotlight"];
    const actor = game.actors.get(actorId);
    if (actor && game.user.isGM && validFields.includes(field)) {
      await actor.setFlag(MODULE_ID, field, input.value);
    }
  });
});
