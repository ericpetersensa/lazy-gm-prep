// src/main.js
// Enable the PoC sidebar tab (non-destructive)
import "./sidebar/register-prep-tab.js";
import { registerSettings }   from "./settings.js";
import { MODULE_ID }          from "./constants.js";
import { createPrepJournal, getActorRowsHTML } from "./journal/generator.js";

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

  const label  = game.i18n.localize("lazy-gm-prep.header.button");
  const button = $(`
    <button type="button" class="lazy-gm-prep-btn">
      <i class="fas fa-clipboard-list"></i> ${label}
    </button>
  `);
  button.on("click", () => createPrepJournal());

  const container = html.find(".directory-header .action-buttons");
  if (container.length) container.append(button);
  else console.warn(`${MODULE_ID} | Could not find action-buttons container`);
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
   Wire up actor‐date inputs and inject actor rows
----------------------------------- */
Hooks.on("renderJournalSheet", (app, html) => {
  const jq = $(html);

  // 1) Inject actor rows into every placeholder
  jq.find(".lazy-gm-actors").each((_, el) => {
    $(el).html(getActorRowsHTML());
  });

  // 2) Open the actor sheet
  jq.on("click", ".lazy-gm-open-sheet", ev => {
    ev.preventDefault();
    const actor = game.actors.get(ev.currentTarget.dataset.actorId);
    if (actor) actor.sheet.render(true);
  });

  // 3) “Today” buttons
  jq.on("click", ".lazy-gm-today", ev => {
    const btn     = ev.currentTarget;
    const field   = btn.dataset.field;
    const actorId = btn.dataset.actorId;
    const today   = new Date().toISOString().split("T")[0];

    const container = $(btn).closest(".lazy-gm-actor-row");
    const input = container.find(`.lazy-gm-date[data-field="${field}"]`);

    if (input.length) {
      input.val(today).trigger("change");
    } else {
      console.warn(`${MODULE_ID} | Missing input for ${field} on actor ${actorId}`);
    }
  });

  // 4) Persist date changes to actor flags
  jq.on("change", ".lazy-gm-date", async ev => {
    const input = ev.currentTarget;
    const actor = game.actors.get(input.dataset.actorId);
    const field = input.dataset.field;
    const value = input.value;
    const validFields = ["lastSeen", "lastSpotlight"];
    if (actor && game.user.isGM && validFields.includes(field)) {
      await actor.setFlag(MODULE_ID, field, value);
    }
  });
});
