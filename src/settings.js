// src/settings.js
import { MODULE_ID, SETTINGS, DEFAULTS } from "./constants.js";

/** Safely get the system's actor types. */
function getActorTypes() {
  const labels = CONFIG.Actor?.typeLabels ?? {};
  return Object.keys(labels);
}

/**
 * Use v13's DocumentSheetConfig to marshal available sheet classes
 * for a given Actor type (subtype).
 */
function getSheetInfoForType(actorType) {
  const { DocumentSheetConfig } = foundry.applications.apps;
  if (!DocumentSheetConfig || !actorType) {
    return { sheetClasses: {}, defaultClass: "" };
  }
  const info = DocumentSheetConfig.getSheetClassesForSubType("Actor", actorType);
  return {
    sheetClasses: info?.sheetClasses ?? {},
    defaultClass: info?.defaultClass ?? ""
  };
}

/** Category → best-fit actor type with fallbacks for systems lacking npc/monster. */
function resolveCategoryToActorType(category, actorTypes) {
  const has = (k) => actorTypes.includes(k);
  switch (category) {
    case "actor":
      return has("character") ? "character" : actorTypes[0] ?? null;
    case "npc":
      return has("npc") ? "npc" : (has("creature") ? "creature" : (has("character") ? "character" : actorTypes[0] ?? null));
    case "monster":
      return has("monster") ? "monster" : (has("npc") ? "npc" : (has("creature") ? "creature" : (has("character") ? "character" : actorTypes[0] ?? null)));
    default:
      return actorTypes[0] ?? null;
  }
}

/** Local keys for the new dropdown settings (avoid dependency on constants.js changes). */
const SHEET_KEYS = {
  actor: "defaultSheet.actor",
  npc: "defaultSheet.npc",
  monster: "defaultSheet.monster"
};

export function registerSettings() {
  // ——— Existing settings you already use ———
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

  game.settings.register(MODULE_ID, SETTINGS.pcActorTypes, {
    name: game.i18n.localize("lazy-gm-prep.settings.pcActorTypes.name"),
    hint: game.i18n.localize("lazy-gm-prep.settings.pcActorTypes.hint"),
    scope: "world",
    config: true,
    default: DEFAULTS.pcActorTypes,
    type: String
  });

  // ——— New: dynamic sheet selection dropdowns ———
  const types = getActorTypes(); // system-agnostic (e.g., ["character","npc",...])

  /**
   * Helper to register one dropdown for a category (actor|npc|monster)
   * using the discovered sheet classes for its resolved actor type.
   */
  const registerSheetDropdown = (category, labelKey) => {
    const actorType = resolveCategoryToActorType(category, types);
    const { sheetClasses, defaultClass } = getSheetInfoForType(actorType);
    game.settings.register(MODULE_ID, SHEET_KEYS[category], {
      name: game.i18n.localize(labelKey),
      hint: game.i18n.localize("lazy-gm-prep.settings.sheet.hint"),
      scope: "world",
      config: true,
      type: String,
      choices: sheetClasses,   // { sheetId: "Label", ... }
      default: defaultClass,   // system default for that type
      onChange: () => ui.notifications?.info(game.i18n.localize("lazy-gm-prep.settings.sheet.changed"))
    });
  };

  registerSheetDropdown("actor",   "lazy-gm-prep.settings.actor.label");
  registerSheetDropdown("npc",     "lazy-gm-prep.settings.npc.label");
  registerSheetDropdown("monster", "lazy-gm-prep.settings.monster.label");
}
