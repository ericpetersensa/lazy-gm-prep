// scripts/discovery.js
const { DocumentSheetConfig } = foundry.applications.apps;

/**
 * Return a map of actor types and their available sheet classes.
 * Format:
 * {
 *   character: { sheetClasses: { "<id>": "<label>", ... }, defaultClass: "<id>" },
 *   npc:       { sheetClasses: { ... }, defaultClass: "<id>" },
 *   ...
 * }
 */
export function discoverActorSheets() {
  const types = getActorTypes(); // e.g., ["character", "npc", "vehicle"] (system-dependent)
  /** @type {Record<string, {sheetClasses: Record<string,string>, defaultClass: string}>} */
  const result = {};
  for (const t of types) {
    // Returns { defaultClass, defaultClasses, sheetClasses }
    // sheetClasses: Record<sheetId, label>
    const info = DocumentSheetConfig.getSheetClassesForSubType("Actor", t);
    result[t] = {
      sheetClasses: info.sheetClasses ?? {},
      defaultClass: info.defaultClass ?? ""
    };
  }
  return result;
}

/** System-agnostic list of actor types using CONFIG. */
export function getActorTypes() {
  // CONFIG.Actor.typeLabels is a stable way to see type keys/labels in v13.
  // Keys are the actor "type" strings; values are localized labels.
  // Example: { character: "Character", npc: "NPC", vehicle: "Vehicle", ... }
  const labels = CONFIG.Actor?.typeLabels ?? {};
  return Object.keys(labels);
}
