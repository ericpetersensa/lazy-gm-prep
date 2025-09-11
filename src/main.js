// src/main.js

import { registerSettings } from "./settings.js";
import { MODULE_ID } from "./constants.js";

Hooks.once("init", () => {
  console.log(`${MODULE_ID} | init`);
  registerSettings();
});

Hooks.once("ready", () => {
  console.log(`${MODULE_ID} | ready`);

  if (game.user.isGM) {
    import("./sidebar/register-prep-tab.js")
      .then(() => {
        console.log(`${MODULE_ID} | v13-native integration loaded`);

        // Force a re-render so header controls rebuild and your button appears
        // (Directory may have rendered before our hooks were registered.)
        ui.journal?.render(true);
      })
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
