// src/sidebar/register-prep-tab.js

import { MODULE_ID } from "../constants.js";
import { createPrepJournal, getActorRowsHTML } from "../journal/generator.js";

/**
 * Add a "New Prep" header control to the Journal Directory (GM only) the AppV2 way.
 * v13+ provides a generic header-control hook for all ApplicationV2 subclasses.
 * See: hookEvents -> getHeaderControlsApplicationV2
 */
Hooks.on("getHeaderControlsApplicationV2", (app, controls) => {
  if (!game.user.isGM) return;
  // Only for Journal Directory windows
  if (app?.constructor?.name !== "JournalDirectory") return;

  controls.unshift({
    icon: "fa-solid fa-clipboard-list",
    label: game.i18n.localize("lazy-gm-prep.header.button"),
    tooltip: game.i18n.localize("lazy-gm-prep.header.button"),
    class: "lazy-gm-prep-btn",
    action: () => createPrepJournal()
  });
});

/**
 * Wire up journal/page sheets via the generic renderApplicationV2 hook.
 * This covers JournalSheetV2 and page-level sheets like JournalTextPageSheetV2.
 */
Hooks.on("renderApplicationV2", (app, element) => {
  const cls = app?.constructor?.name;
  const isJournal = cls === "JournalSheetV2" || cls === "JournalPageSheetV2" || cls === "JournalTextPageSheetV2";
  if (!isJournal) return;

  // 1) Inject actor rows into any placeholder element(s).
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
