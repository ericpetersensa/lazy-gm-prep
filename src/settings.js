// src/settings.js
import { MODULE_ID, SETTINGS, DEFAULTS } from "./constants.js";

/* ------------------------- Utilities ------------------------- */

function getActorTypes() {
  const labels = CONFIG.Actor?.typeLabels ?? {};
  return Object.keys(labels);
}

function getTypeLabelMap() {
  /** @type {Record<string,string>} key->label (lowercase keys) */
  const labels = CONFIG.Actor?.typeLabels ?? {};
  const byKey = {};
  for (const [k, v] of Object.entries(labels)) byKey[k.toLowerCase()] = String(v ?? k);
  return byKey;
}

/**
 * v13 helper: marshal sheet classes for a given Actor sub-type.
 * Returns { sheetClasses: Record<id,label>, defaultClass: string }
 */
function getSheetInfoForType(actorType) {
  const { DocumentSheetConfig } = foundry.applications.apps;
  if (!DocumentSheetConfig || !actorType) return { sheetClasses: {}, defaultClass: "" };
  const info = DocumentSheetConfig.getSheetClassesForSubType("Actor", actorType);
  return {
    sheetClasses: info?.sheetClasses ?? {},
    defaultClass: info?.defaultClass ?? ""
  };
}

/**
 * Fuzzy mapping: try to find the most appropriate actor type by *label* first,
 * then by key, using common synonyms across systems.
 */
function pickByLabelOrKey(preferredLabels, actorTypes, typeLabelMap) {
  // 1) Try labels (values), case-insensitive contains
  const labelEntries = Object.entries(typeLabelMap); // [keyLower, Label]
  for (const needle of preferredLabels) {
    const n = needle.toLowerCase();
    const hit = labelEntries.find(([, L]) => String(L).toLowerCase().includes(n));
    if (hit) return hit[0]; // return keyLower
  }
  // 2) Try keys
  for (const needle of preferredLabels) {
    const k = actorTypes.find(t => t.toLowerCase() === needle.toLowerCase());
    if (k) return k.toLowerCase();
  }
  // 3) Give up
  return null;
}

/**
 * Choose the Actor sub-type used by a category ("actor" | "npc" | "monster").
 * - "actor": prefer the user's PC actor types setting; else Character/PC/Companion
 * - "npc"  : prefer NPC/Adversary/Creature/Environment
 * - "monster": prefer Monster/Adversary/Creature/Beast/NPC
 */
function resolveCategoryToActorType(category, actorTypes) {
  if (!actorTypes?.length) return null;
  const typeLabelMap = getTypeLabelMap();

  const pcsSetting = (game.settings.get(MODULE_ID, SETTINGS.pcActorTypes) ?? "")
    .split(",")
    .map(s => s.trim())
    .filter(Boolean);

  if (category === "actor") {
    const actorPref = pcsSetting.length ? pcsSetting : ["character", "pc", "player", "companion"];
    const k = pickByLabelOrKey(actorPref, actorTypes, typeLabelMap);
    return k ?? actorTypes[0];
  }

  if (category === "npc") {
    const k = pickByLabelOrKey(
      ["npc", "adversary", "foe", "opponent", "creature", "non-player", "environment"],
      actorTypes, typeLabelMap
    );
    return k ?? pickByLabelOrKey(["character", "pc"], actorTypes, typeLabelMap) ?? actorTypes[0];
  }

  if (category === "monster") {
    const k = pickByLabelOrKey(
      ["monster", "adversary", "creature", "beast", "npc"],
      actorTypes, typeLabelMap
    );
    return k ?? pickByLabelOrKey(["npc", "character"], actorTypes, typeLabelMap) ?? actorTypes[0];
  }

  return actorTypes[0];
}

/* Keys for our three dropdowns (kept local). */
const SHEET_KEYS = {
  actor:   "defaultSheet.actor",
  npc:     "defaultSheet.npc",
  monster: "defaultSheet.monster"
};

/* Format the visible name as: "Preferred Sheet: NPC — [Adversary]" */
function formatSettingName(baseKey, actorTypeKeyLower) {
  const base = game.i18n.localize(baseKey);
  if (!actorTypeKeyLower) return base;
  const label = CONFIG.Actor?.typeLabels?.[actorTypeKeyLower] ?? actorTypeKeyLower;
  return `${base} — [${label}]`;
}

/* ------------------------- Registration ------------------------- */

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

  /* ---- Placeholders at INIT so UI shows the three dropdowns ---- */
  const actorTypes = getActorTypes();
  const nameActor   = formatSettingName("lazy-gm-prep.settings.actor.label",   resolveCategoryToActorType("actor", actorTypes));
  const nameNPC     = formatSettingName("lazy-gm-prep.settings.npc.label",     resolveCategoryToActorType("npc", actorTypes));
  const nameMonster = formatSettingName("lazy-gm-prep.settings.monster.label", resolveCategoryToActorType("monster", actorTypes));

  const placeholderChoices = { "": "(loading…)" };

  const ensurePlaceholder = (key, nameKeyOrComputedName) => {
    const full = `${MODULE_ID}.${key}`;
    if (game.settings.settings.has(full)) return;
    game.settings.register(MODULE_ID, key, {
      name: typeof nameKeyOrComputedName === "string"
        ? nameKeyOrComputedName
        : game.i18n.localize(nameKeyOrComputedName),
      hint: game.i18n.localize("lazy-gm-prep.settings.sheet.hint"),
      scope: "world",
      config: true,
      type: String,
      choices: placeholderChoices,
      default: ""
    });
  };

  ensurePlaceholder(SHEET_KEYS.actor,   nameActor);
  ensurePlaceholder(SHEET_KEYS.npc,     nameNPC);
  ensurePlaceholder(SHEET_KEYS.monster, nameMonster);

  /* ---- Populate/repair after the system is ready ---- */
  Hooks.once("setup", async () => { await refreshSheetDropdowns(); });
  Hooks.once("ready", async () => {
    // Retry only if still placeholders
    const needsRetry = ["actor","npc","monster"].some(cat => {
      const reg = game.settings.settings.get(`${MODULE_ID}.${SHEET_KEYS[cat]}`);
      const c = reg?.choices ?? {};
      return Object.keys(c).length <= 1 && c[""] === "(loading…)";
    });
    if (needsRetry) await refreshSheetDropdowns();
  });
}

/**
 * Compute real choices/defaults per resolved actor type and update the three settings.
 * Also migrate blank/invalid values to the system default.
 */
async function refreshSheetDropdowns() {
  const types = getActorTypes();

  const update = async (category, baseKey) => {
    const typeKeyLower = resolveCategoryToActorType(category, types);
    const { sheetClasses, defaultClass } = getSheetInfoForType(typeKeyLower);
    const settingKey = SHEET_KEYS[category];
    const full = `${MODULE_ID}.${settingKey}`;
    const reg = game.settings.settings.get(full);

    const computedName = formatSettingName(baseKey, typeKeyLower);

    if (!reg) {
      // If somehow missing, register fresh.
      game.settings.register(MODULE_ID, settingKey, {
        name: computedName,
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

    // Update label, choices, and default in place
    reg.name = computedName;
    reg.choices = sheetClasses || {};
    if (defaultClass) reg.default = defaultClass;

    // Migrate value if blank/invalid to defaultClass
    const current = game.settings.get(MODULE_ID, settingKey);
    if ((!current || !sheetClasses[current]) && defaultClass) {
      await game.settings.set(MODULE_ID, settingKey, defaultClass);
    }
  };

  await update("actor",   "lazy-gm-prep.settings.actor.label");
  await update("npc",     "lazy-gm-prep.settings.npc.label");
  await update("monster", "lazy-gm-prep.settings.monster.label");
}
