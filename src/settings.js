// src/settings.js
import { MODULE_ID, SETTINGS, DEFAULTS } from "./constants.js";

/** Nine sections: the eight Lazy DM steps + Other Notes (numbered in i18n) */
export const PAGE_ORDER = [
  { key: "review-characters",      titleKey: "lazy-gm-prep.steps.review-characters.title",      descKey: "lazy-gm-prep.steps.review-characters.description" },
  { key: "strong-start",           titleKey: "lazy-gm-prep.steps.strong-start.title",           descKey: "lazy-gm-prep.steps.strong-start.description" },
  { key: "outline-scenes",         titleKey: "lazy-gm-prep.steps.outline-scenes.title",         descKey: "lazy-gm-prep.steps.outline-scenes.description" },
  { key: "secrets-clues",          titleKey: "lazy-gm-prep.steps.secrets-clues.title",          descKey: "lazy-gm-prep.steps.secrets-clues.description" },
  { key: "fantastic-locations",    titleKey: "lazy-gm-prep.steps.fantastic-locations.title",    descKey: "lazy-gm-prep.steps.fantastic-locations.description" },
  { key: "important-npcs",         titleKey: "lazy-gm-prep.steps.important-npcs.title",         descKey: "lazy-gm-prep.steps.important-npcs.description" },
  { key: "choose-monsters",        titleKey: "lazy-gm-prep.steps.choose-monsters.title",        descKey: "lazy-gm-prep.steps.choose-monsters.description" },
  { key: "magic-item-rewards",     titleKey: "lazy-gm-prep.steps.magic-item-rewards.title",     descKey: "lazy-gm-prep.steps.magic-item-rewards.description" },
  { key: "other-notes",            titleKey: "lazy-gm-prep.steps.other-notes.title",            descKey: "lazy-gm-prep.steps.other-notes.description" }
];

export function registerSettings() {
  game.settings.register(MODULE_ID, SETTINGS.separatePages, {
    name: game.i18n.localize("lazy-gm-prep.settings.separatePages.name"),
    hint: game.i18n.localize("lazy-gm-prep.settings.separatePages.hint"),
    scope: "world",
    config: true,
    default: DEFAULTS.separatePages,
    type: Boolean
  });

  game.settings.register(MODULE_ID, SETTINGS.folderName, {
    name: game.i18n.localize("lazy-gm-prep.settings.folderName.name"),
    hint: game.i18n.localize("lazy-gm-prep.settings.folderName.hint"),
    scope: "world",
    config: true,
    default: DEFAULTS.folderName,
    type: String
  });

  game.settings.register(MODULE_ID, SETTINGS.journalPrefix, {
    name: game.i18n.localize("lazy-gm-prep.settings.journalPrefix.name"),
    hint: game.i18n.localize("lazy-gm-prep.settings.journalPrefix.hint"),
    scope: "world",
    config: true,
    default: DEFAULTS.journalPrefix,
    type: String
  });

  game.settings.register(MODULE_ID, "includeDateInName", {
    name: game.i18n.localize("lazy-gm-prep.settings.includeDateInName.name"),
    hint: game.i18n.localize("lazy-gm-prep.settings.includeDateInName.hint"),
    scope: "world",
    config: true,
    type: Boolean,
    default: true // keep enabled by default for consistency
  });

  // Table defaults
  game.settings.register(MODULE_ID, SETTINGS.initialCharacterRows, {
    name: game.i18n.localize("lazy-gm-prep.settings.initialCharacterRows.name"),
    hint: game.i18n.localize("lazy-gm-prep.settings.initialCharacterRows.hint"),
    scope: "world",
    config: true,
    type: Number,
    default: DEFAULTS.initialCharacterRows
  });

  game.settings.register(MODULE_ID, SETTINGS.initialNpcRows, {
    name: game.i18n.localize("lazy-gm-prep.settings.initialNpcRows.name"),
    hint: game.i18n.localize("lazy-gm-prep.settings.initialNpcRows.hint"),
    scope: "world",
    config: true,
    type: Number,
    default: DEFAULTS.initialNpcRows
  });

  // Per-page copy toggles — now ALL default ON (including Monsters)
  for (const s of PAGE_ORDER) {
    const key = `copy.${s.key}`;
    game.settings.register(MODULE_ID, key, {
      name: game.i18n.localize(`lazy-gm-prep.settings.copy.${s.key}.name`),
      hint: game.i18n.localize(`lazy-gm-prep.settings.copy.${s.key}.hint`),
      scope: "world",
      config: true,
      type: Boolean,
      default: true
    });
  }
}

export function getSetting(key, fallback) {
  try { return game.settings.get(MODULE_ID, key); } catch { return fallback; }
}
