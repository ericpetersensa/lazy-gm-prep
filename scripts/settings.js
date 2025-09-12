// scripts/settings.js
import { discoverActorSheets, getActorTypes } from "./discovery.js";
import { MODULE_ID, i18n } from "./util.js";

/** Build category → actorType mapping with robust fallbacks per system. */
function resolveCategoryToActorType(category, actorTypes) {
  const has = (k) => actorTypes.includes(k);
  switch (category) {
    case "actor":   // "PC-like"
      return has("character") ? "character" : actorTypes[0] ?? null;
    case "npc":
      return has("npc") ? "npc" : (has("creature") ? "creature" : (has("character") ? "character" : actorTypes[0] ?? null));
    case "monster":
      // Most systems don't separate "monster", so prefer npc/creature; final fallback to character.
      return has("monster") ? "monster" : (has("npc") ? "npc" : (has("creature") ? "creature" : (has("character") ? "character" : actorTypes[0] ?? null)));
    default:
      return actorTypes[0] ?? null;
  }
}

/** Register dropdown settings whose choices come from discovered sheet classes. */
export function registerLazyGMSheetSettings() {
  const sheetsByType = discoverActorSheets();
  const types = getActorTypes();

  const categories = [
    { key: "actor",   label: i18n("lazy-gm-prep.settings.actor.label") },
    { key: "npc",     label: i18n("lazy-gm-prep.settings.npc.label") },
    { key: "monster", label: i18n("lazy-gm-prep.settings.monster.label") }
  ];

  for (const { key, label } of categories) {
    const type = resolveCategoryToActorType(key, types);
    const info = type ? sheetsByType[type] : null;
    const choices = info?.sheetClasses ?? {};

    // Default to the system default sheet for that type (if any)
    const defaultVal = info?.defaultClass ?? "";

    game.settings.register(MODULE_ID, `defaultSheet.${key}`, {
      name: label,
      hint: i18n("lazy-gm-prep.settings.sheet.hint"),
      scope: "world",
      config: true,
      type: String,
      choices,           // <sheetId> -> <label>
      default: defaultVal,
      onChange: () => ui.notifications?.info(i18n("lazy-gm-prep.settings.sheet.changed"))
    });
  }
}
