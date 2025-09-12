// src/lib/actors.js

import { MODULE_ID, SETTINGS, DEFAULTS } from "../constants.js";

/**
 * Return the configured actor types that count as PCs, as a Set (lowercased).
 * e.g. "character, pc" -> Set(["character", "pc"])
 */
export function getPCActorTypes() {
  const raw = game.settings.get(MODULE_ID, SETTINGS.pcActorTypes) ?? DEFAULTS.pcActorTypes;
  const list = String(raw)
    .split(",")
    .map(s => s.trim().toLowerCase())
    .filter(Boolean);
  // If user left it empty, fall back to default
  return new Set(list.length ? list : (DEFAULTS.pcActorTypes.split(",").map(s => s.trim().toLowerCase())));
}

/**
 * Return all actors whose type is in the configured PC actor types.
 * Does NOT filter by ownership—callers can apply `a.isOwner` if desired.
 */
export function getPCActors({ requireOwner = false } = {}) {
  const types = getPCActorTypes();
  const actors = game.actors?.contents ?? [];
  return actors.filter(a => {
    if (!a) return false;
    if (!types.has(String(a.type).toLowerCase())) return false;
    if (requireOwner && !a.isOwner) return false;
    return true;
  });
}
