// src/settings.js
import { MODULE_ID, SETTINGS, DEFAULTS } from "./constants.js";

/** Safely get the system's actor types. */
function getActorTypes() {
  const labels = CONFIG.Actor?.typeLabels ?? {};
  return Object.keys(labels);
}

/**
 * Use v13's DocumentSheetConfig to gather available sheet classes
 * for a given Actor subtype (e.g., "character", "npc", etc.).
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

/** Local keys for the new dropdown settings (avoid touching constants.js). */
const SHEET_KEYS = {
  actor: "defaultSheet.actor",
  npc: "defaultSheet.npc",
  monster: "defaultSheet.monster"
};

/** Register (or repair) one dropdown setting for the given category. */
async function registerOrRefreshSheetDropdown(category, labelKey, actorTypes) {
  const actorType = resolveCategoryToActorType(category, actorTypes);
  const { sheetClasses, defaultClass } = getSheetInfoForType(actorType);

  const key = SHEET_KEYS[category];
  const fullKey = `${MODULE_ID}.${key}`;
  const already = game.settings.settings.has(fullKey);

  if (!already) {
    // Fresh registration with proper choices (setup time).
    game.settings.register(MODULE_ID, key, {
      name: game.i18n.localize(labelKey),
      hint: game.i18n.localize("lazy-gm-prep.settings.sheet.hint"),
      scope: "world",
      config: true,
      type: String,
      choices: sheetClasses,  // { sheetId: "Label", ... }
      default: defaultClass,  // System default sheet for that actor type
      onChange: () => ui.notifications?.info(game.i18n.localize("lazy-gm-prep.settings.sheet.changed"))
    });
  } else {
    // Repair: the setting exists (likely created at init with empty choices). Update choices/default in-place.
    const registry = game.settings.settings.get(fullKey);
    if (registry) {
      registry.choices = sheetClasses || {};
      if (defaultClass) registry.default = defaultClass;
    }
    // Optional migration: if value is blank or not one of the available choices, set to defaultClass.
    const current = game.settings.get(MODULE_ID, key);
    if ((!current || !sheetClasses[current]) && defaultClass) {
      await game.settings.set(MODULE_ID, key, defaultClass);
    }
  }
}

export function registerSettings() {
  // ---------------- Existing settings you already use (register at init) ----------------
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

  // ---------------- NEW: Register/repair the three sheet dropdowns at SETUP ----------------
  Hooks.once("setup", async () => {
    const types = getActorTypes(); // e.g., ["character","npc",...]  (system-dependent)
    await registerOrRefreshSheetDropdown("actor",   "lazy-gm-prep.settings.actor.label",   types);
    await registerOrRefreshSheetDropdown("npc",     "lazy-gm-prep.settings.npc.label",     types);
    await registerOrRefreshSheetDropdown("monster", "lazy-gm-prep.settings.monster.label", types);
  });
}
