// src/main.js
import { registerSettings } from "./settings.js";
import { createPrepJournal } from "./journal/generator.js";

const MODULE_ID = "lazy-gm-prep";

/* ---------------------------------
   Boot
----------------------------------- */
Hooks.once("init", () => {
  console.log(`${MODULE_ID} | init`);
  registerSettings();
});

Hooks.once("ready", () => {
  console.log(`${MODULE_ID} | ready`);
});

/* ---------------------------------
   Journal Directory button (API hook)
   - Preferred, clean integration
----------------------------------- */
Hooks.on("getJournalDirectoryHeaderButtons", (app, buttons) => {
  if (!game.user.isGM) return;

  // Prevent duplicate injection if some theme re-renders or other hooks run
  if (buttons.some(b => b?.class === "lazy-gm-prep-btn")) return;

  buttons.unshift({
    label: "New Prep",
    class: "lazy-gm-prep-btn",
    icon: "fas fa-clipboard-list",
    onclick: () => createPrepJournal()
  });
});

/* ---------------------------------
   Journal Directory button (DOM fallback)
   - Rock-solid if the API hook is skipped by a theme or timing
----------------------------------- */
Hooks.on("renderJournalDirectory", (app, element) => {
  if (!game.user.isGM) return;

  const html = element instanceof jQuery ? element : $(element);

  // If a button with our class already exists (from either hook), bail
  if (html.find(".lazy-gm-prep-btn").length) return;

  const button = $(`
    <button type="button" class="lazy-gm-prep-btn">
      <i class="fas fa-clipboard-list"></i> New Prep
    </button>
  `);

  button.on("click", () => createPrepJournal());

  const header = html.find(".directory-header .action-buttons");
  if (header.length) {
    header.append(button);
  } else {
    console.warn(`${MODULE_ID} | Could not find Journal Directory header container`);
  }
});

/* ---------------------------------
   Chat command: /prep
----------------------------------- */
Hooks.on("chatMessage", (chatLog, messageText) => {
  if (!game.user.isGM) return;
  if (messageText.trim().toLowerCase() === "/prep") {
    createPrepJournal();
    return false; // prevent echoing the command to chat
  }
});
