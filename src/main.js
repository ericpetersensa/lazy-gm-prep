// src/main.js
import { registerSettings } from "./settings.js"; // still useful if you have other settings
const MODULE_ID = "lazy-gm-prep";

/* ---------------------------------
   Settings for persistent date storage
----------------------------------- */
Hooks.once("init", () => {
  console.log(`${MODULE_ID} | init`);
  registerSettings?.();

  game.settings.register(MODULE_ID, "lastSeenDate", {
    scope: "world",
    config: false,
    type: String,
    default: ""
  });
  game.settings.register(MODULE_ID, "lastSpotlightDate", {
    scope: "world",
    config: false,
    type: String,
    default: ""
  });
});

Hooks.once("ready", () => {
  console.log(`${MODULE_ID} | ready`);
});

/* ---------------------------------
   Utility: Actor list HTML
----------------------------------- */
function getActorListHTML() {
  const actors = game.actors?.contents.filter(a => a.isOwner) ?? [];
  if (!actors.length) return `<p><em>No actors available</em></p>`;

  return actors.map(actor => `
    <div class="lazy-gm-actor" style="display:flex;align-items:center;gap:0.5em;margin:0.25em 0;">
      <img src="${actor.img}" title="${actor.name}" width="36" height="36" style="border:1px solid var(--color-border-light-primary);border-radius:4px;">
      <a href="#" class="lazy-gm-open-sheet" data-actor-id="${actor.id}">${actor.name}</a>
    </div>
  `).join("");
}

/* ---------------------------------
   Utility: Date field HTML
----------------------------------- */
function getDateFieldHTML(fieldId, label, value) {
  return `
    <div class="form-group" style="align-items:center;margin:0.25em 0;">
      <label for="${fieldId}" style="flex:0 0 auto;margin-right:0.5em;">${label}:</label>
      <input type="date" id="${fieldId}" class="lazy-gm-date" value="${value || ""}" style="flex:0 0 auto;" />
      <button type="button" class="lazy-gm-today" data-target="${fieldId}" style="margin-left:0.5em;">Today</button>
    </div>
  `;
}

/* ---------------------------------
   Create the prep journal
----------------------------------- */
export async function createPrepJournal() {
  const lastSeen = game.settings.get(MODULE_ID, "lastSeenDate");
  const lastSpot = game.settings.get(MODULE_ID, "lastSpotlightDate");

  const content = `
    <h2>Session Prep</h2>
    <section>
      <h3>Party</h3>
      ${getActorListHTML()}
    </section>
    <section style="margin-top:1em;">
      <h3>Dates</h3>
      ${getDateFieldHTML("lazy-date-lastseen", "Last Seen", lastSeen)}
      ${getDateFieldHTML("lazy-date-lastspot", "Last Spotlight", lastSpot)}
    </section>
    <section style="margin-top:1em;">
      <h3>Notes</h3>
      <p><em>Enter your prep notes here...</em></p>
    </section>
  `;

  const journal = await JournalEntry.create({
    name: `Prep - ${new Date().toLocaleDateString()}`,
    content,
    folder: null
  });

  journal.sheet.render(true);
}

/* ---------------------------------
   Header button
----------------------------------- */
Hooks.on("renderJournalDirectory", (app, element) => {
  if (!game.user.isGM) return;
  const html = element instanceof jQuery ? element : $(element);
  if (html.find(".lazy-gm-prep-btn").length) return;

  const button = $(`
    <button type="button" class="lazy-gm-prep-btn">
      <i class="fas fa-clipboard-list"></i> New Prep
    </button>
  `);
  button.on("click", () => createPrepJournal());

  const header = html.find(".directory-header .action-buttons");
  if (header.length) header.append(button);
});

/* ---------------------------------
   Click + date handling inside journals
----------------------------------- */
Hooks.on("renderJournalSheet", (app, html) => {
  // Actor sheet opens
  html.find(".lazy-gm-open-sheet").on("click", ev => {
    ev.preventDefault();
    const actorId = ev.currentTarget.dataset.actorId;
    const actor = game.actors.get(actorId);
    if (actor) actor.sheet.render(true);
  });

  // "Today" buttons
  html.find(".lazy-gm-today").on("click", ev => {
    const targetId = ev.currentTarget.dataset.target;
    const input = html.find(`#${targetId}`);
    if (input.length) {
      const today = new Date().toISOString().split("T")[0];
      input.val(today).trigger("change");
    }
  });

  // Persist dates on change
  html.find("#lazy-date-lastseen").on("change", ev => {
    game.settings.set(MODULE_ID, "lastSeenDate", ev.target.value);
  });
  html.find("#lazy-date-lastspot").on("change", ev => {
    game.settings.set(MODULE_ID, "lastSpotlightDate", ev.target.value);
  });
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
