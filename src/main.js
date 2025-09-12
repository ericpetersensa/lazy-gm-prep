// src/main.js

import { registerSettings } from "./settings.js";
import { MODULE_ID } from "./constants.js";
import { createPrepJournal } from "./journal/generator.js";

Hooks.once("init", () => {
  console.log(`${MODULE_ID} | init`);
  registerSettings();

  // Register keybinding: Alt+P (GM only) to create a prep journal
  game.keybindings.register(MODULE_ID, "create-prep", {
    name: "lazy-gm-prep.keybindings.createPrep.name",
    hint: "lazy-gm-prep.keybindings.createPrep.hint",
    editable: [{ key: "KeyP", modifiers: ["Alt"] }],
    onDown: () => {
      if (!game.user.isGM) return false;
      createPrepJournal();
      return true;
    },
    restricted: true // GM-only
    // precedence: CONST.KEYBINDING_PRECEDENCE.NORMAL  // (optional)
  });
});

Hooks.once("ready", () => {
  console.log(`${MODULE_ID} | ready`);

  if (game.user.isGM) {
    import("./sidebar/register-prep-tab.js")
      .then(() => {
        console.log(`${MODULE_ID} | v13-native integration loaded`);
        // In case the directory rendered before our hooks registered
        ui.journal?.render(true);
      })
      .catch(err => console.error(`${MODULE_ID} | Failed to load v13 integration:`, err));
  }
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
