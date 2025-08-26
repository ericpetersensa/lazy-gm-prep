import { registerSettings } from "./settings.js";
import { createPrepJournal } from "./journal/generator.js";

Hooks.once("init", () => {
  registerSettings();
});

// Add Journal Directory button
Hooks.on("getJournalDirectoryHeaderButtons", (dir, buttons) => {
  if (game.user.isGM) {
    buttons.unshift({
      label: "New Prep",
      class: "lazy-gm-prep-btn",
      icon: "fas fa-clipboard-list",
      onclick: () => createPrepJournal()
    });
  }
});

// Simple chat command: /prep
Hooks.on("chatMessage", (chatLog, messageText, chatData) => {
  if (!game.user.isGM) return;
  if (messageText.trim().toLowerCase() === "/prep") {
    createPrepJournal();
    return false; // block chat output
  }
});
