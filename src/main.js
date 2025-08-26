// src/main.js
import { registerSettings } from "./settings.js";
import { createPrepJournal } from "./journal/generator.js";

const MODULE_ID = "lazy-gm-prep";

Hooks.once("init", () => {
  console.log(`${MODULE_ID} | init`);
  registerSettings();
});

Hooks.once("ready", () => {
  console.log(`${MODULE_ID} | ready`);
});

/* ---------------------------------
   Journal Directory button — v13+ stable
----------------------------------- */
Hooks.on("renderJournalDirectory", (app, element) => {
  if (!game.user.isGM) return;

  const html = element instanceof jQuery ? element : $(element);

  // Prevent duplicate injection
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
    return false; // block chat echo
  }
});
