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

  // Optional stats (best-effort multi-path probes)
  const level = firstOf(
    actor,
    ["system","details","level","value"],
    ["system","details","level"],
    ["system","level","value"],
    ["system","level"],
    ["system","attributes","level","value"],
    ["system","rank"],
    ["system","class","level"]
  );

  const hpCurrent = firstOf(
    actor,
    ["system","attributes","hp","value"],
    ["system","hp","value"],
    ["system","hp","current"],
    ["system","resources","hp","value"]
  );
  const hpMax = firstOf(
    actor,
    ["system","attributes","hp","max"],
    ["system","hp","max"],
    ["system","hp","maximum"],
    ["system","resources","hp","max"]
  );

  const ac = firstOf(
    actor,
    ["system","attributes","ac","value"],
    ["system","ac","value"],
    ["system","defense","ac"],
    ["system","armorClass","value"],
    ["system","armor_class","value"]
  );

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

/**
 * Render one list item with:
 *  - thumbnail
 *  - clickable name that opens with the Preferred Sheet for this category
 *  - localized type label
 *  - inline stats (if found)
 */
export function renderActorListItem(actorSummary, category /* "actor" | "npc" | "monster" */) {
  const { id, name, img, typeLabel, stats } = actorSummary;

  const meta = [];
  if (stats?.level !== null && stats?.level !== undefined) meta.push(`Lv ${stats.level}`);
  if (stats?.hp) {
    const { value, max } = stats.hp;
    if (value !== null || max !== null) meta.push(`HP ${value ?? "?"}/${max ?? "?"}`);
  }
  if (stats?.ac !== null && stats?.ac !== undefined) meta.push(`AC ${stats.ac}`);
  const inline = meta.length ? `<span class="lgmp-inline-stats">(${meta.join(" • ")})</span>` : "";

  const tl = game.i18n.localize(String(typeLabel));

  return `
  <li class="lgmp-actor-item">
    ${esc(img)}
    <div>
      #${esc(name)}</a>
      <small class="lgmp-type">[${esc(tl)}]</small> ${inline}
    </div>
  </li>`;
}

function esc(s) {
  return String(s ?? "").replace(/[&<>"']/g, (m) => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"
  }[m]));
}
