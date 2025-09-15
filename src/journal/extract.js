// src/journal/extract.js

/** Safe getter with a path array */
function get(obj, path) {
  return path.reduce((o, k) => (o && k in o ? o[k] : undefined), obj);
}

/** Try several paths; return the first defined value */
function firstOf(actor, ...paths) {
  for (const p of paths) {
    const v = get(actor, p);
    if (v !== undefined && v !== null && v !== "") return v;
  }
  return undefined;
}

/** Heuristic extraction of common RPG stats; render only if found. */
export function extractActorSummary(actor) {
  const typeKey = actor.type;
  const typeLabel = CONFIG.Actor?.typeLabels?.[typeKey] ?? typeKey;
  const img = actor.img ?? "icons/svg/mystery-man.svg";

  // Common cross-system paths (feel free to add more as you encounter systems)
  const level = firstOf(
    actor,
    ["system", "details", "level", "value"],
    ["system", "details", "level"],
    ["system", "level", "value"],
    ["system", "level"],
    ["system", "attributes", "level", "value"],
    ["system", "rank"],
    ["system", "class", "level"],
  );

  const hpCurrent = firstOf(
    actor,
    ["system", "attributes", "hp", "value"],   // 5e
    ["system", "hp", "value"],                 // PF2e sometimes
    ["system", "hp", "current"],               // some systems
    ["system", "resources", "hp", "value"],
  );
  const hpMax = firstOf(
    actor,
    ["system", "attributes", "hp", "max"],
    ["system", "hp", "max"],
    ["system", "hp", "maximum"],
    ["system", "resources", "hp", "max"],
  );

  const ac = firstOf(
    actor,
    ["system", "attributes", "ac", "value"],   // 5e-like
    ["system", "ac", "value"],
    ["system", "defense", "ac"],
    ["system", "armorClass", "value"],
    ["system", "armor_class", "value"],
  );

  // You can add more optional probes (class, ancestry, alignment) as needed.

  return {
    id: actor.id,
    uuid: actor.uuid,
    name: actor.name,
    typeKey,
    typeLabel,
    img,
    playerOwned: !!actor.hasPlayerOwner,
    stats: {
      level: level ?? null,
      hp: (hpCurrent !== undefined || hpMax !== undefined)
        ? { value: hpCurrent ?? null, max: hpMax ?? null }
        : null,
      ac: ac ?? null
    }
  };
}

/** Build a small HTML card for an actor line item, with a preferred-sheet link. */
export function renderActorListItem(actorSummary, category /* "actor" | "npc" | "monster" */) {
  const { id, name, img, typeLabel, stats } = actorSummary;

  const parts = [];
  if (stats?.level !== null && stats?.level !== undefined) parts.push(`Lv ${stats.level}`);
  if (stats?.hp) {
    const { value, max } = stats.hp;
    if (value !== null || max !== null) parts.push(`HP ${value ?? "?"}/${max ?? "?"}`);
  }
  if (stats?.ac !== null && stats?.ac !== undefined) parts.push(`AC ${stats.ac}`);
  const inline = parts.length ? `<span class="lgmp-inline-stats">(${parts.join(" • ")})</span>` : "";

  // Preferred-sheet opener via data attribute; see links.js hook
  return `
  <li class="lgmp-actor-item">
    ${img}
    #${escapeHTML(name)}</a>
    <small class="lgmp-type">[${escapeHTML(typeLabel)}]</small> ${inline}
  </li>`;
}

function escapeHTML(s) {
  return String(s ?? "").replace(/[&<>"']/g, (m) => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"
  }[m]));
}
