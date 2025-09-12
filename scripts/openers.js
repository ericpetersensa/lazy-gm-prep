// scripts/openers.js
import { MODULE_ID } from "./util.js";
import { getActorTypes } from "./discovery.js";

function getSettingKeyForCategory(category) {
  return `defaultSheet.${category}`;
}

/**
 * Find the class (constructor) for a given sheetId across all Actor types.
 * Returns null if not found.
 */
function findActorSheetClassById(sheetId) {
  if (!sheetId) return null;

  // Traverse registered sheet classes per actor type
  // This follows the structures used by DocumentSheetConfig internally
  // and remains safe as we only read class references.
  const types = Object.keys(CONFIG.Actor?.typeLabels ?? {});
  for (const t of types) {
    const map = foundry.applications.apps.DocumentSheetConfig.getSheetClassesForSubType("Actor", t);
    const entries = map?.sheetClasses ?? {};
    // map.sheetClasses gives labels; we need the constructor.
    // To resolve the class, fall back to CONFIG.Actor.sheetClasses[t][id]?.cls if exposed.
    const raw = CONFIG.Actor?.sheetClasses?.[t]?.[sheetId];
    if (raw?.cls) return raw.cls;
  }
  return null;
}

/**
 * Open the provided Actor with the module's preferred sheet for a given category.
 * category: "actor" | "npc" | "monster"
 */
export async function openWithPreferredSheet(actor, category) {
  const key = getSettingKeyForCategory(category);
  const sheetId = game.settings.get(MODULE_ID, key);
  const SheetCls = findActorSheetClassById(sheetId);

  // If we couldn't resolve a class, fall back to the actor's default sheet
  if (!SheetCls) return actor?.sheet?.render(true);

  // Render the chosen sheet explicitly
  const app = new SheetCls(actor, { editable: actor.isOwner });
  return app.render(true);
}
