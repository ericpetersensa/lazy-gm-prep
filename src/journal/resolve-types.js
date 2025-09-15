// src/journal/resolve-types.js
import { MODULE_ID } from "../util.js";

/* --------------------------- Safe settings access --------------------------- */

function hasSetting(key) {
  // Foundry stores settings in a registry keyed as "<module>.<key>"
  return game.settings?.settings?.has?.(`${MODULE_ID}.${key}`) ?? false;
}
function getSettingSafe(key) {
  return hasSetting(key) ? game.settings.get(MODULE_ID, key) : undefined;
}

/* --------------------------- Actor type utilities --------------------------- */

function getActorTypes() {
  // Preserve original case as systems like Shadowdark use "NPC" / "Player"
  const labels = CONFIG.Actor?.typeLabels ?? {};
  return Object.keys(labels);
}

function typeLabelMap() {
  // key (original case) -> localized label
  const labels = CONFIG.Actor?.typeLabels ?? {};
  const m = {};
  for (const [k, v] of Object.entries(labels)) m[k] = game.i18n.localize(String(v ?? k));
  return m;
}

function pickByLabelOrKey(preferred, actorTypes, labelMap) {
  const entries = Object.entries(labelMap);
  // 1) Label match (case-insensitive contains)
  for (const needle of preferred) {
    const n = String(needle).toLowerCase();
    const hit = entries.find(([, L]) => String(L).toLowerCase().includes(n));
    if (hit) return hit[0]; // original-case key
  }
  // 2) Key match (case-insensitive equality)
  for (const needle of preferred) {
    const hit = actorTypes.find(k => k.toLowerCase() === String(needle).toLowerCase());
    if (hit) return hit; // original-case key
  }
  return null;
}

function filterCandidates(actorTypes) {
  // Avoid internal/utility types by default
  return actorTypes.filter(k => {
    const low = k.toLowerCase();
    return low !== "base" && low !== "light";
  });
}

/* ----------------------- Public: resolve effective types -------------------- */

export function resolveTypesFromSettings() {
  const types = getActorTypes();
  const map = typeLabelMap();
  const candidates = filterCandidates(types);

  // Read the configured PC-like types safely.
  // Prefer the actual registered key "pcActorTypes" (camelCase).
  const pcsSettingRaw =
    getSettingSafe("pcActorTypes") ??
    getSettingSafe("pc-actor-types") ?? // only if someone previously registered it
    "";

  const pcsSetting = String(pcsSettingRaw)
    .split(",")
    .map(s => s.trim())
    .filter(Boolean);

  const actorType =
    pickByLabelOrKey(
      pcsSetting.length ? pcsSetting : ["character", "pc", "player", "companion"],
      candidates,
      map
    ) ?? candidates[0] ?? types[0];

  const npcType =
    pickByLabelOrKey(
      ["npc", "adversary", "creature", "foe", "opponent", "non-player", "environment"],
      candidates,
      map
    ) ?? candidates[0] ?? types[0];

  const monsterType =
    pickByLabelOrKey(
      ["monster", "adversary", "creature", "beast", "npc"],
      candidates,
      map
    ) ?? candidates[0] ?? types[0];

  return { actorType, npcType, monsterType };
}
