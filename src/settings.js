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
  /** @type {Record<string, string>} */
  const byKey = {};
  for (const [k, v] of Object.entries(labels)) {
    // Localize if the system provided i18n keys
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

  // Fallback: use CONFIG.Actor.sheetClasses if API returns nothing or is undefined
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
  // 1) Try labels (localized) case-insensitively
  const entries = Object.entries(typeLabelMap); // [keyOriginal, LocalizedLabel]
  for (const needle of preferred) {
    const n = needle.toLowerCase();
    const hit = entries.find(([, L]) => String(L).toLowerCase().includes(n));
    if (hit) return hit[0]; // return original-case key
  }
  // 2) Try exact key by case-insensitive compare, return original-case key
  for (const needle of preferred) {
    const hit = actorTypes.find(k => k.toLowerCase() === needle.toLowerCase());
    if (hit) return hit;
  }
  // 3) No match
  return null;
}

/** Remove internal/utility types you generally don't want to target by default. */
function filterCandidateTypes(actorTypes) {
  return actorTypes.filter(k => {
    const low = k.toLowerCase();
    return low !== "base" && low !== "light";
  });
}

/* ------------------------- Advanced Type Mapping ------------------------- */
/**
 * Advanced settings: let users explicitly choose the actor type per category.
 * Defaults to "auto" which uses smart heuristics.
 */
const TYPE_KEYS = {
  actor:   "typeMapping.actor",
  npc:     "typeMapping.npc",
  monster: "typeMapping.monster"
};

function getExplicitTypeFor(category) {
  const key = TYPE_KEYS[category];
  if (!key) return null;
  const v = game.settings.get(MODULE_ID, key);
  if (v && v !== "auto") return v; // return original-case system key
  return null;
}

/**
 * Choose the Actor sub-type used by a category ("actor" | "npc" | "monster").
 * Returns the system's actual key (original case).
 * - Honors the user's advanced type mapping when set.
 * - Otherwise uses heuristics based on labels and common synonyms.
 */
function resolveCategoryToActorType(category, actorTypes) {
  if (!actorTypes?.length) return null;

  // Honor explicit mapping first
  const explicit = getExplicitTypeFor(category);
  if (explicit) return explicit;

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

/* Keys for our three sheet dropdowns (kept local). */
const SHEET_KEYS = {
  actor:   "defaultSheet.actor",
  npc:     "defaultSheet.npc",
  monster: "defaultSheet.monster"
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
  /* ---- Existing settings ---- */
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

  /* ---- Advanced: Type Mapping (init with minimal choices; expand later) ---- */
  const ensureTypeMapping = (key, nameKey) => {
    const full = `${MODULE_ID}.${key}`;
    if (game.settings.settings.has(full)) return;
    game.settings.register(MODULE_ID, key, {
      name: game.i18n.localize(nameKey),
      hint: game.i18n.localize("lazy-gm-prep.settings.actorType.hint"),
      scope: "world",
      config: true,
      type: String,
      choices: { auto: game.i18n.localize("lazy-gm-prep.settings.auto") },
      default: "auto",
      onChange: () => refreshSheetDropdowns() // refresh the sheet choices when mapping changes
    });
  };

  ensureTypeMapping(TYPE_KEYS.actor,   "lazy-gm-prep.settings.actorType.actor.label");
  ensureTypeMapping(TYPE_KEYS.npc,     "lazy-gm-prep.settings.actorType.npc.label");
  ensureTypeMapping(TYPE_KEYS.monster, "lazy-gm-prep.settings.actorType.monster.label");

  /* ---- Sheet Dropdowns: place-holders at INIT so UI shows them ---- */
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
  Hooks.once("setup", async () => { await refreshTypeMappingChoices(); await refreshSheetDropdowns(); });
  Hooks.once("ready", async () => {
    // Retry if still placeholders
    const needsRetry = ["actor","npc","monster"].some(cat => {
      const reg = game.settings.settings.get(`${MODULE_ID}.${SHEET_KEYS[cat]}`);
      const c = reg?.choices ?? {};
      return Object.keys(c).length <= 1 && c[""] === "(loading…)";
    });
    if (needsRetry) {
      await refreshTypeMappingChoices();
      await refreshSheetDropdowns();
    }
  });
}

/**
 * Populate the choices for the three type-mapping settings (Auto + actor types).
 */
async function refreshTypeMappingChoices() {
  const types = getActorTypes();            // original-case keys
  const labelMap = getTypeLabelMap();       // key -> localized label
  const choices = { auto: game.i18n.localize("lazy-gm-prep.settings.auto") };

  for (const k of types) choices[k] = labelMap[k] ?? k;

  for (const cat of ["actor", "npc", "monster"]) {
    const key = TYPE_KEYS[cat];
    const full = `${MODULE_ID}.${key}`;
    const reg = game.settings.settings.get(full);
    if (!reg) continue;
    reg.choices = choices;

    // Migrate value if it was an unknown key
    const current = game.settings.get(MODULE_ID, key);
    if (current && !choices[current]) {
      await game.settings.set(MODULE_ID, key, "auto");
    }
  }
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
