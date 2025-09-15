// src/journal/resolve-types.js
import { MODULE_ID } from "../util.js";

/** Return system actor type keys (original case). */
function getActorTypes() {
  const labels = CONFIG.Actor?.typeLabels ?? {};
  return Object.keys(labels);
}

/** key -> localized label (original-case keys) */
function typeLabelMap() {
  const labels = CONFIG.Actor?.typeLabels ?? {};
  const m = {};
  for (const [k,v] of Object.entries(labels)) m[k] = game.i18n.localize(String(v ?? k));
  return m;
}

function pickByLabelOrKey(preferred, actorTypes, labelMap) {
  const entries = Object.entries(labelMap);
  for (const needle of preferred) {
    const n = String(needle).toLowerCase();
    const hit = entries.find(([, L]) => String(L).toLowerCase().includes(n));
    if (hit) return hit[0];
  }
  for (const needle of preferred) {
    const hit = actorTypes.find(k => k.toLowerCase() === String(needle).toLowerCase());
    if (hit) return hit;
  }
  return null;
}

function filterCandidates(actorTypes) {
  return actorTypes.filter(k => {
    const low = k.toLowerCase();
    return low !== "base" && low !== "light"; // skip internal/utility
  });
}

/** Resolve concrete types (original-case keys) for Actor/NPC/Monster. */
export function resolveTypesFromSettings() {
  const types = getActorTypes();
  const map = typeLabelMap();
  const candidates = filterCandidates(types);

  const pcsSetting = (game.settings.get(MODULE_ID, "pc-actor-types") // alias if constants differ
    ?? game.settings.get(MODULE_ID, "pcActorTypes")
    ?? "")
    .split(",").map(s => s.trim()).filter(Boolean);

  const actorType = pickByLabelOrKey(
    pcsSetting.length ? pcsSetting : ["character", "pc", "player", "companion"],
    candidates, map
  ) ?? candidates[0] ?? types[0];

  const npcType = pickByLabelOrKey(
    ["npc", "adversary", "creature", "foe", "opponent", "non-player", "environment"],
    candidates, map
  ) ?? candidates[0] ?? types[0];

  const monsterType = pickByLabelOrKey(
    ["monster", "adversary", "creature", "beast", "npc"],
    candidates, map
  ) ?? candidates[0] ?? types[0];

  return { actorType, npcType, monsterType };
}
