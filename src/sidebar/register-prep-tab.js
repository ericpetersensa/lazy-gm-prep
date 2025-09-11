// src/sidebar/register-prep-tab.js

import { MODULE_ID } from "../constants.js";
import { createPrepJournal, getActorRowsHTML } from "../journal/generator.js";

const ACTION_ID = "lazy-gm-prep__new-prep";

/** Add our header control, guarding against duplicates and non-GMs. */
function addNewPrepControl(controls) {
  if (!game.user.isGM) return;
  if (Array.isArray(controls) && controls.some(c => c?.action === ACTION_ID)) return;

  controls.unshift({
    action: ACTION_ID,                                   // v13 requires a string id
    icon: "fa-solid fa-clipboard-list",
    label: game.i18n.localize("lazy-gm-prep.header.button"),
    onClick: () => createPrepJournal()                   // click handler
  });

  // Optional debug
  console.debug?.(`${MODULE_ID} | Added header control: ${ACTION_ID}`);
}

/**
 * Some v13 builds fire class-specific header-control hooks for the sidebar directory.
 * Register across the likely chain + the generic fallback.
 * Docs: getHeaderControlsApplicationV2 (class-specific substitution). 
 */
[
  "getHeaderControlsJournalDirectory",       // most specific for the Journal sidebar tab
  "getHeaderControlsDocumentDirectory",      // parent class in the chain
  "getHeaderControlsAbstractSidebarTab",     // higher in the chain
  "getHeaderControlsApplicationV2"           // generic fallback
].forEach(hookName => {
  Hooks.on(hookName, (app, controls) => {
    try {
      // If we hit the generic hook, gate it to relevant classes
      if (hookName === "getHeaderControlsApplicationV2") {
        const name = app?.constructor?.name;
        if (!["JournalDirectory", "DocumentDirectory", "AbstractSidebarTab"].includes(name)) return;
      }
      addNewPrepControl(controls);
    } catch (err) {
      console.error(`${MODULE_ID} | Failed to add header control via ${hookName}:`, err);
    }
  });
});

/**
 * Journal/Page injection & handlers via the generic AppV2 render hook.
 * Covers JournalSheetV2 and page-level sheets (e.g., JournalTextPageSheetV2).
 */
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
