// src/settings.js
import { MODULE_ID, SETTINGS, DEFAULTS } from "./constants.js";

/* ------------------------- Utilities ------------------------- */

/** Return the system's actor type keys in their original case (case-sensitive). */
function getActorTypes() {
  const labels = CONFIG.Actor?.typeLabels ?? {};
  return Object.keys(labels);
}

/** Map of typeKey -> localized label (preserve original case on keys). */
function getTypeLabelMap() {
  const labels = CONFIG.Actor?.typeLabels ?? {};
  const byKey = {};
  for (const [k, v] of Object.entries(labels)) {
    byKey[k] = game.i18n.localize(String(v ?? k));
  }
  return byKey;
}

/**
 * v13 helper: marshal sheet classes for a given Actor sub-type.
 * Returns { sheetClasses: Record<id,label>, defaultClass: string }
 * Includes a fallback to CONFIG.Actor.sheetClasses if the API returns nothing.
 */
function getSheetInfoForType(actorType) {
  const { DocumentSheetConfig } = foundry.applications.apps;
  let sheetClasses = {};
  let defaultClass = "";

  if (DocumentSheetConfig?.getSheetClassesForSubType && actorType) {
    const info = DocumentSheetConfig.getSheetClassesForSubType("Actor", actorType);
    sheetClasses = info?.sheetClasses ?? {};
    defaultClass = info?.defaultClass ?? "";
  }

  // Fallback: raw registry
  if (!sheetClasses || Object.keys(sheetClasses).length === 0) {
    const raw = CONFIG.Actor?.sheetClasses?.[actorType] ?? {};
    const normalized = {};
    for (const [id, meta] of Object.entries(raw)) {
      const label = meta?.label ? game.i18n.localize(meta.label) : id;
      normalized[id] = label;
    }
    sheetClasses = normalized;
    if (!defaultClass) defaultClass = Object.keys(normalized)[0] ?? "";
  }

  return { sheetClasses, defaultClass };
}

/**
 * Pick a type by preferred labels/keys, **returning the actual system key (original case)**.
 * @param {string[]} preferred Needles like ["npc","adversary","creature"]
 * @param {string[]} actorTypes System keys, original case (e.g., ["NPC","Player","Light"])
 * @param {Record<string,string>} typeLabelMap key->Label
 */
function pickByLabelOrKey(preferred, actorTypes, typeLabelMap) {
  const entries = Object.entries(typeLabelMap); // [keyOriginal, LocalizedLabel]
  // 1) Try labels case-insensitively
  for (const needle of preferred) {
    const n = needle.toLowerCase();
    const hit = entries.find(([, L]) => String(L).toLowerCase().includes(n));
    if (hit) return hit[0];
  }
  // 2) Try keys by case-insensitive compare
  for (const needle of preferred) {
    const hit = actorTypes.find(k => k.toLowerCase() === needle.toLowerCase());
    if (hit) return hit;
  }
  return null;
}

/** Remove internal/utility types you generally don't want to target by default. */
function filterCandidateTypes(actorTypes) {
  return actorTypes.filter(k => {
    const low = k.toLowerCase();
    return low !== "base" && low !== "light";
  });
}

/**
 * Auto-resolve the Actor sub-type used by a category ("actor" | "npc" | "monster").
 * Returns the system's actual key (original case).
 * Honors the global PCs text field; avoids extra per-category mapping UI.
 */
function resolveCategoryToActorType(category, actorTypes) {
  if (!actorTypes?.length) return null;
  const typeLabelMap = getTypeLabelMap();
  const candidates = filterCandidateTypes(actorTypes);

  // user-configured PC-like types (comma-separated)
  const pcsSetting = (game.settings.get(MODULE_ID, SETTINGS.pcActorTypes) ?? "")
    .split(",").map(s => s.trim()).filter(Boolean);

  if (category === "actor") {
    const prefer = pcsSetting.length ? pcsSetting : ["character", "pc", "player", "companion"];
    const k = pickByLabelOrKey(prefer, candidates, typeLabelMap);
    return k ?? candidates[0] ?? actorTypes[0];
  }

  if (category === "npc") {
    const k = pickByLabelOrKey(
      ["npc", "adversary", "foe", "opponent", "creature", "non-player", "environment"],
      candidates, typeLabelMap
    );
    return k ?? pickByLabelOrKey(["character", "pc", "player"], candidates, typeLabelMap) ?? candidates[0] ?? actorTypes[0];
  }

  if (category === "monster") {
    const k = pickByLabelOrKey(
      ["monster", "adversary", "creature", "beast", "npc"],
      candidates, typeLabelMap
    );
    return k ?? pickByLabelOrKey(["npc", "character", "player"], candidates, typeLabelMap) ?? candidates[0] ?? actorTypes[0];
  }

  return candidates[0] ?? actorTypes[0];
}

/* ------------------------- Settings keys ------------------------- */

/** Preferred sheet selectors (dropdowns) */
const SHEET_KEYS = {
  actor:   "defaultSheet.actor",
  npc:     "defaultSheet.npc",
  monster: "defaultSheet.monster"
};

/** Include/Exclude toggles for journal pulls (checkboxes) */
const IMPORT_KEYS = {
  actor:   "import.actor.enabled",
  npc:     "import.npc.enabled",
  monster: "import.monster.enabled"
};

/** Format the display name with the resolved actor type, e.g., “Preferred Sheet: NPC — [Shadowdark NPC]”. */
function formatSettingName(baseKey, actorTypeKey) {
  const base = game.i18n.localize(baseKey);
  if (!actorTypeKey) return base;
  const raw = CONFIG.Actor?.typeLabels?.[actorTypeKey] ?? actorTypeKey;
  const label = game.i18n.localize(String(raw));
  return `${base} — [${label}]`;
}

/* ------------------------- Registration ------------------------- */

export function registerSettings() {
  /* ---- Existing global settings ---- */
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

  // Keep this to steer PC-like detection in many systems
  game.settings.register(MODULE_ID, SETTINGS.pcActorTypes, {
    name: game.i18n.localize("lazy-gm-prep.settings.pcActorTypes.name"),
    hint: game.i18n.localize("lazy-gm-prep.settings.pcActorTypes.hint"),
    scope: "world",
    config: true,
    default: DEFAULTS.pcActorTypes,
    type: String
  });

  /* ---- New: Include/Exclude toggles per Lazy DM section ---- */
  const ensureImportToggle = (key, nameKey, hintKey, defaultVal) => {
    const full = `${MODULE_ID}.${key}`;
    if (game.settings.settings.has(full)) return;
    game.settings.register(MODULE_ID, key, {
      name: game.i18n.localize(nameKey),
      hint: game.i18n.localize(hintKey),
      scope: "world",
      config: true,
      type: Boolean,
      default: defaultVal
    });
  };

  ensureImportToggle(IMPORT_KEYS.actor,
    "lazy-gm-prep.settings.import.actor.label",
    "lazy-gm-prep.settings.import.actor.hint",
    true);

  ensureImportToggle(IMPORT_KEYS.npc,
    "lazy-gm-prep.settings.import.npc.label",
    "lazy-gm-prep.settings.import.npc.hint",
    true);

  ensureImportToggle(IMPORT_KEYS.monster,
    "lazy-gm-prep.settings.import.monster.label",
    "lazy-gm-prep.settings.import.monster.hint",
    true);

  /* ---- Preferred Sheet dropdowns (placeholders at INIT so they appear) ---- */
  const actorTypes = getActorTypes();
  const nameActor   = formatSettingName("lazy-gm-prep.settings.actor.label",   resolveCategoryToActorType("actor", actorTypes));
  const nameNPC     = formatSettingName("lazy-gm-prep.settings.npc.label",     resolveCategoryToActorType("npc", actorTypes));
  const nameMonster = formatSettingName("lazy-gm-prep.settings.monster.label", resolveCategoryToActorType("monster", actorTypes));

  const placeholderChoices = { "": "(loading…)" };

  const ensurePlaceholder = (key, computedName) => {
    const full = `${MODULE_ID}.${key}`;
    if (game.settings.settings.has(full)) return;
    game.settings.register(MODULE_ID, key, {
      name: computedName,
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

  /* ---- Populate/repair after system is ready ---- */
  Hooks.once("setup", async () => { await refreshSheetDropdowns(); });
  Hooks.once("ready", async () => {
    // Retry if still placeholders
    const needsRetry = ["actor","npc","monster"].some(cat => {
      const reg = game.settings.settings.get(`${MODULE_ID}.${SHEET_KEYS[cat]}`);
      const c = reg?.choices ?? {};
      return Object.keys(c).length <= 1 && c[""] === "(loading…)";
    });
    if (needsRetry) await refreshSheetDropdowns();
  });
}

/**
 * Compute real choices/defaults per resolved actor type and update the three sheet settings.
 * Also migrate blank/invalid values to the system default.
 */
async function refreshSheetDropdowns() {
  const types = getActorTypes();

  const update = async (category, baseKey) => {
    const typeKey = resolveCategoryToActorType(category, types); // ORIGINAL CASE key
    const { sheetClasses, defaultClass } = getSheetInfoForType(typeKey);
    const settingKey = SHEET_KEYS[category];
    const full = `${MODULE_ID}.${settingKey}`;
    const reg = game.settings.settings.get(full);
    const computedName = formatSettingName(baseKey, typeKey);

    if (!reg) {
      // Register fresh if missing
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

    // Migrate invalid/blank values to valid default
    const current = game.settings.get(MODULE_ID, settingKey);
    if ((!current || !sheetClasses[current]) && defaultClass) {
      await game.settings.set(MODULE_ID, settingKey, defaultClass);
    }
  };

  await update("actor",   "lazy-gm-prep.settings.actor.label");
  await update("npc",     "lazy-gm-prep.settings.npc.label");
  await update("monster", "lazy-gm-prep.settings.monster.label");
}
