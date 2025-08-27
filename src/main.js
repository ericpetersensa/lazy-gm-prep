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

  const html = $(htmlOrFragment);
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
    return false;
  }
});

/* ---------------------------------
   Wire up actor‐date inputs and links in the journal
----------------------------------- */
Hooks.on("renderJournalSheet", (app, html) => {
  const jq = $(html);

  jq.on("click", ".lazy-gm-open-sheet", ev => {
    ev.preventDefault();
    const actor = game.actors.get(ev.currentTarget.dataset.actorId);
    if (actor) actor.sheet.render(true);
  });

  jq.on("click", ".lazy-gm-today", ev => {
    const btn = ev.currentTarget;
    const field = btn.dataset.field;
    const actorId = btn.dataset.actorId;
    const today = new Date().toISOString().split("T")[0];

    const container = $(btn).closest(".lazy-gm-actor-row");
    const input = container.find(`.lazy-gm-date[data-field="${field}"]`);

    if (input.length) {
      input.val(today).trigger("change");
    } else {
      console.warn(`${MODULE_ID} | Could not find input for ${field} on actor ${actorId}`);
    }
  });

  jq.on("change", ".lazy-gm-date", async ev => {
    const input = ev.currentTarget;
    const actor = game.actors.get(input.dataset.actorId);
    const field = input.dataset.field;
    const value = input.value;
    if (actor && game.user.isGM) {
      await actor.setFlag(MODULE_ID, field, value);
    }
  });
});
