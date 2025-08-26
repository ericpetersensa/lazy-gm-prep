// src/main.js

import { registerSettings }  from "./settings.js";
import { MODULE_ID }         from "./constants.js";
import { createPrepJournal } from "./journal/generator.js";

Hooks.once("init", () => {
  console.log(`${MODULE_ID} | init`);
  registerSettings();
});

Hooks.once("ready", () => {
  console.log(`${MODULE_ID} | ready`);
});

/* ---------------------------------
   Add “New Prep” button to the Journals directory (GM only)
----------------------------------- */
Hooks.on("renderJournalDirectory", (app, htmlOrFragment) => {
  if (!game.user.isGM) return;

  // Wrap the raw HTMLElement or DocumentFragment in jQuery
  const html = $(htmlOrFragment);

  // Don’t add the button twice
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
Hooks.on("chatMessage", (chatLog, messageText) => {
  if (!game.user.isGM) return;
  if (messageText.trim().toLowerCase() === "/prep") {
    createPrepJournal();
    return false;  // Prevent the message from posting
  }
});

/* ---------------------------------
   Wire up actor‐date inputs and links in the journal
----------------------------------- */
Hooks.on("renderJournalSheet", (app, html) => {
  const jq = $(html);

  // Open the actor sheet
  jq.on("click", ".lazy-gm-open-sheet", ev => {
    ev.preventDefault();
    const actor = game.actors.get(ev.currentTarget.dataset.actorId);
    if (actor) actor.sheet.render(true);
  });

  // “Today” buttons
  jq.on("click", ".lazy-gm-today", ev => {
    const btn     = ev.currentTarget;
    const field   = btn.dataset.field;
    const actorId = btn.dataset.actorId;
    const today   = new Date().toISOString().split("T")[0];
    const input   = jq.find(
      `.lazy-gm-date[data-actor-id="${actorId}"][data-field="${field}"]`
    );
    input.val(today).trigger("change");
  });

  // Persist date changes to actor flags
  jq.on("change", ".lazy-gm-date", async ev => {
    const input   = ev.currentTarget;
    const actor   = game.actors.get(input.dataset.actorId);
    const field   = input.dataset.field;
    const value   = input.value;
    if (actor && game.user.isGM) {
      await actor.setFlag(MODULE_ID, field, value);
    }
  });
});
