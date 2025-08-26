// src/main.js

import { registerSettings }    from "./settings.js";
import { MODULE_ID }           from "./constants.js";
import { createPrepJournal }   from "./journal/generator.js";

Hooks.once("init", () => {
  console.log(`${MODULE_ID} | init`);
  registerSettings();
});

Hooks.once("ready", () => {
  console.log(`${MODULE_ID} | ready`);
});

/* ---------------------------------
   Add “New Prep” button to Journals directory (GM only)
----------------------------------- */
Hooks.on("renderJournalDirectory", (app, htmlElement) => {
  if (!game.user.isGM) return;

  const html = $(htmlElement);       // wrap in jQuery
  if (html.find(".lazy-gm-prep-btn").length) return;

  const label = game.i18n.localize("lazy-gm-prep.header.button");
  const button = $(`
    <button type="button" class="lazy-gm-prep-btn">
      <i class="fas fa-clipboard-list"></i> ${label}
    </button>
  `);
  button.on("click", () => createPrepJournal());
  html.find(".directory-header .action-buttons").append(button);
});

/* ---------------------------------
   Chat command: /prep
----------------------------------- */
Hooks.on("chatMessage", (chatLog, messageText, chatData) => {
  if (!game.user.isGM) return;
  if (messageText.trim().toLowerCase() === "/prep") {
    createPrepJournal();
    return false;                   // prevent normal chat processing
  }
});

/* ---------------------------------
   Make date fields & actor links interactive
----------------------------------- */
Hooks.on("renderJournalSheet", (app, html) => {
  // Open actor sheet
  html.find(".lazy-gm-open-sheet").on("click", ev => {
    ev.preventDefault();
    const actor = game.actors.get(ev.currentTarget.dataset.actorId);
    if (!actor) return;
    actor.sheet.render(true);
  });

  // “Today” buttons
  html.find(".lazy-gm-today").on("click", ev => {
    const btn    = ev.currentTarget;
    const field  = btn.dataset.field;
    const actorId= btn.dataset.actorId;
    const today  = new Date().toISOString().split("T")[0];
    const input  = html.find(`.lazy-gm-date[data-actor-id="${actorId}"][data-field="${field}"]`);
    input.val(today).trigger("change");
  });

  // Persist date changes to actor flags
  html.find(".lazy-gm-date").on("change", async ev => {
    const input   = ev.currentTarget;
    const actorId = input.dataset.actorId;
    const field   = input.dataset.field;
    const value   = input.value;
    const actor   = game.actors.get(actorId);
    if (!actor || !game.user.isGM) return;
    await actor.setFlag(MODULE_ID, field, value);
  });
});
