// src/main.js

import { registerSettings } from "./settings.js";
import { MODULE_ID } from "./constants.js";

Hooks.once("init", () => {
  console.log(`${MODULE_ID} | init`);
  registerSettings();
});

Hooks.once("ready", () => {
  console.log(`${MODULE_ID} | ready`);

  // GM-only load of v13-native integration (header controls + journal page wiring)
  if (game.user.isGM) {
    import("./sidebar/register-prep-tab.js")
      .then(() => console.log(`${MODULE_ID} | v13-native integration loaded`))
      .catch(err => console.error(`${MODULE_ID} | Failed to load v13 integration:`, err));
  }
});

/* ---------------------------------
   Chat command: /prep
----------------------------------- */
import { createPrepJournal } from "./journal/generator.js";

Hooks.on("chatMessage", (chatLog, messageText) => {
  if (!game.user.isGM) return;
  if (messageText.trim().toLowerCase() === "/prep") {
    createPrepJournal();
    return false;
  }
});
