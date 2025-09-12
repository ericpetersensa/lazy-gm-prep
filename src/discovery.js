// src/discovery.js
const { DocumentSheetConfig } = foundry.applications.apps;

/**
 * Returns a map of actor types and their available sheet classes.
 */
export function discoverActorSheets() {
  const types = getActorTypes();
  const result = {};
  for (const t of types) {
    const info = DocumentSheetConfig.getSheetClassesForSubType("Actor", t);
    result[t] = {
      sheetClasses: info.sheetClasses ?? {},
      defaultClass: info.defaultClass ?? ""
    };
  }
  return result;
}

/** Returns system-agnostic list of actor types. */
export function getActorTypes() {
  const labels = CONFIG.Actor?.typeLabels ?? {};
  return Object.keys(labels);
}
