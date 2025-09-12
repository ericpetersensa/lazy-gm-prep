// src/openers.js
import { MODULE_ID } from "./util.js";
import { getActorTypes } from "./discovery.js";

function getSettingKeyForCategory(category) {
  return `defaultSheet.${category}`;
}

function findActorSheetClassById(sheetId) {
  if (!sheetId) return null;
  const types = Object.keys(CONFIG.Actor?.typeLabels ?? {});
  for (const t of types) {
    const map = foundry.applications.apps.DocumentSheetConfig.getSheetClassesForSubType("Actor", t);
    const raw = CONFIG.Actor?.sheetClasses?.[t]?.[sheetId];
    if (raw?.cls) return raw.cls;
  }
  return null;
}

export async function openWithPreferredSheet(actor, category) {
  const key = getSettingKeyForCategory(category);
  const sheetId = game.settings.get(MODULE_ID, key);
  const SheetCls = findActorSheetClassById(sheetId);

  if (!SheetCls) return actor?.sheet?.render(true);

  const app = new SheetCls(actor, { editable: actor.isOwner });
  return app.render(true);
}
