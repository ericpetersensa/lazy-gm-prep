// src/settings.js
import { MODULE_ID, SETTINGS, DEFAULTS } from "./constants.js";

/* ------------------------- Utilities ------------------------- */

function getActorTypes() {
  const labels = CONFIG.Actor?.typeLabels ?? {};
  return Object.keys(labels);
}

/**
 * v13 helper: marshal available sheet classes for a given Actor subtype.
 * Returns { sheetClasses: Record<id,label>, defaultClass: string }
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
      return has("npc") ? "npc"
        : (has("creature") ? "creature"
        : (has("character") ? "character" : actorTypes[0] ?? null));
    case "monster":
      return has("monster") ? "monster"
        : (has("npc") ? "npc"
        : (has("creature") ? "creature"
        : (has("character") ? "character" : actorTypes[0] ?? null)));
    default:
      return actorTypes[0] ?? null;
  }
}

/* Keys for our three new dropdowns (kept local to avoid changing constants.js) */
const SHEET_KEYS = {
  actor:   "defaultSheet.actor",
  npc:     "defaultSheet.npc",
  monster: "defaultSheet.monster"
};

/* ------------------------- Registration ------------------------- */

/**
 * Register placeholder settings at INIT so they always show up in the UI,
 * then at SETUP we replace their choices/default with the real data.
 */
export function registerSettings() {
  /* ---- Your existing settings (unchanged) ---- */
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

  /* ---- NEW: Register three dropdowns at INIT with a visible placeholder ---- */
  const placeholderChoices = { "": "(loading…)" };

  const registerPlaceholder = (key, nameKey) => {
    // If already present (from a previous run), don't re-register.
    if (game.settings.settings.has(`${MODULE_ID}.${key}`)) return;

    game.settings.register(MODULE_ID, key, {
      name: game.i18n.localize(nameKey),
      hint: game.i18n.localize("lazy-gm-prep.settings.sheet.hint"),
      scope: "world",
      config: true,
      type: String,
      choices: placeholderChoices,
      default: ""
    });
  };

  registerPlaceholder(SHEET_KEYS.actor,   "lazy-gm-prep.settings.actor.label");
  registerPlaceholder(SHEET_KEYS.npc,     "lazy-gm-prep.settings.npc.label");
  registerPlaceholder(SHEET_KEYS.monster, "lazy-gm-prep.settings.monster.label");

  /* ---- Refresh the dropdowns at SETUP (system is ready) ---- */
  Hooks.once("setup", async () => {
    await refreshSheetDropdowns();
  });

  /* ---- Extra safety: if something still raced, try again at READY ---- */
  Hooks.once("ready", async () => {
    // Only retry if choices still look like placeholders
    const needRetry = ["actor", "npc", "monster"].some(cat => {
      const reg = game.settings.settings.get(`${MODULE_ID}.${SHEET_KEYS[cat]}`);
      const c   = reg?.choices ?? {};
      return Object.keys(c).length <= 1 && c[""] === "(loading…)";
    });
    if (needRetry) await refreshSheetDropdowns();
  });
}

/**
 * Compute real choices/defaults and update the three settings in place.
 * Also migrate blank/invalid values to the system default.
 */
async function refreshSheetDropdowns() {
  const types = getActorTypes();

  const updateOne = async (category, labelKey) => {
    const actorType = resolveCategoryToActorType(category, types);
    const { sheetClasses, defaultClass } = getSheetInfoForType(actorType);
    const key = SHEET_KEYS[category];
    const full = `${MODULE_ID}.${key}`;
    const reg = game.settings.settings.get(full);

    // If still missing (unusual), register it now with real choices.
    if (!reg) {
      game.settings.register(MODULE_ID, key, {
        name: game.i18n.localize(labelKey),
        hint: game.i18n.localize("lazy-gm-prep.settings.sheet.hint"),
        scope: "world",
        config: true,
        type: String,
        choices: sheetClasses,
        default: defaultClass,
        onChange: () => ui.notifications?.info(game.i18n.localize("lazy-gm-prep.settings.sheet.changed"))
      });
      return;
    }

    // Update choices/default in-place
    reg.choices = sheetClasses || {};
    if (defaultClass) reg.default = defaultClass;

    // Migrate value if blank/invalid → defaultClass
    const current = game.settings.get(MODULE_ID, key);
    if ((!current || !sheetClasses[current]) && defaultClass) {
      await game.settings.set(MODULE_ID, key, defaultClass);
    }
  };

  await updateOne("actor",   "lazy-gm-prep.settings.actor.label");
  await updateOne("npc",     "lazy-gm-prep.settings.npc.label");
  await updateOne("monster", "lazy-gm-prep.settings.monster.label");
}
