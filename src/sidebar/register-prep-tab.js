// src/sidebar/register-prep-tab.js

import { MODULE_ID } from "../constants.js";
import { createPrepJournal, getActorRowsHTML } from "../journal/generator.js";

/**
 * Add a "New Prep" header control to the Journal Directory (GM only) the AppV2 way.
 * v13 hook: getHeaderControlsApplicationV2
 */
Hooks.on("getHeaderControlsApplicationV2", (app, controls) => {
  if (!game.user.isGM) return;

  // Journal Directory class name in v13 is "JournalDirectory"
  if (app?.constructor?.name !== "JournalDirectory") return; // ✔ confirmed class name [3](https://foundryvtt.com/api/v13/classes/foundry.applications.sidebar.tabs.JournalDirectory.html)

  controls.unshift({
    action: "lazy-gm-prep__new-prep", // MUST be a string id, not a function
    icon: "fa-solid fa-clipboard-list",
    label: game.i18n.localize("lazy-gm-prep.header.button"),
    onClick: () => createPrepJournal() // click handler
  });
});

/**
 * Wire up journal/page sheets via the generic renderApplicationV2 hook.
 * Covers JournalSheetV2 and page-level sheets like JournalTextPageSheetV2.
 */
Hooks.on("renderApplicationV2", (app, element) => {
  const cls = app?.constructor?.name;
  const isJournal = cls === "JournalSheetV2" || cls === "JournalPageSheetV2" || cls === "JournalTextPageSheetV2";
  if (!isJournal) return;

  // 1) Inject actor rows
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
