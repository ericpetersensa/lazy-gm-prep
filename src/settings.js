// src/settings.js

import { MODULE_ID, SETTINGS, DEFAULTS } from "./constants.js";

export function registerSettings() {
  // Split into multiple pages?
  game.settings.register(MODULE_ID, SETTINGS.separatePages, {
    name: game.i18n.localize("lazy-gm-prep.settings.separatePages.name"),
    hint: game.i18n.localize("lazy-gm-prep.settings.separatePages.hint"),
    scope: "world",
    config: true,
    default: DEFAULTS.separatePages,
    type: Boolean
  });

  // Folder name for generated journals
  game.settings.register(MODULE_ID, SETTINGS.folderName, {
    name: game.i18n.localize("lazy-gm-prep.settings.folderName.name"),
    hint: game.i18n.localize("lazy-gm-prep.settings.folderName.hint"),
    scope: "world",
    config: true,
    default: DEFAULTS.folderName,
    type: String
  });

  // Prefix for journal names (e.g. "Session")
  game.settings.register(MODULE_ID, SETTINGS.journalPrefix, {
    name: game.i18n.localize("lazy-gm-prep.settings.journalPrefix.name"),
    hint: game.i18n.localize("lazy-gm-prep.settings.journalPrefix.hint"),
    scope: "world",
    config: true,
    default: DEFAULTS.journalPrefix,
    type: String
  });

  // NEW: Actor types to treat as PCs
  game.settings.register(MODULE_ID, SETTINGS.pcActorTypes, {
    name: game.i18n.localize("lazy-gm-prep.settings.pcActorTypes.name"),
    hint: game.i18n.localize("lazy-gm-prep.settings.pcActorTypes.hint"),
    scope: "world",
    config: true,
    default: DEFAULTS.pcActorTypes,
    type: String
  });
}
