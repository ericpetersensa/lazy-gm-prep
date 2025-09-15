// src/journal/generator.js
import { MODULE_ID } from "../util.js";
import { resolveTypesFromSettings } from "./resolve-types.js";
import { extractActorSummary, renderActorListItem } from "./extract.js";

/* ------------------ settings helpers ------------------ */

function includeSection(cat) {
  // Include toggles only affect auto-pull, not page existence
  const key = {
    actor: "import.actor.enabled",
    npc: "import.npc.enabled",
    monster: "import.monster.enabled"
  }[cat];
  return game.settings.get(MODULE_ID, key) ?? true;
}

function getSetting(key, fallback) {
  try { return game.settings.get(MODULE_ID, key); } catch { return fallback; }
}

/* ------------------ i18n helpers ------------------ */

function stepTitleKey(step) {
  return ({
    "review-characters": "lazy-gm-prep.steps.review-characters.title",
    "strong-start":      "lazy-gm-prep.steps.strong-start.title",
    "outline-scenes":    "lazy-gm-prep.steps.outline-scenes.title",
    "secrets-clues":     "lazy-gm-prep.steps.secrets-clues.title",
    "fantastic-locations":"lazy-gm-prep.steps.fantastic-locations.title",
    "important-npcs":    "lazy-gm-prep.steps.important-npcs.title",
    "choose-monsters":   "lazy-gm-prep.steps.choose-monsters.title",
    "magic-item-rewards":"lazy-gm-prep.steps.magic-item-rewards.title",
    "other-notes":       "lazy-gm-prep.steps.other-notes.title"
  })[step];
}

function stepDescKey(step) {
  return ({
    "review-characters": "lazy-gm-prep.steps.review-characters.description",
    "strong-start":      "lazy-gm-prep.steps.strong-start.description",
    "outline-scenes":    "lazy-gm-prep.steps.outline-scenes.description",
    "secrets-clues":     "lazy-gm-prep.steps.secrets-clues.description",
    "fantastic-locations":"lazy-gm-prep.steps.fantastic-locations.description",
    "important-npcs":    "lazy-gm-prep.steps.important-npcs.description",
    "choose-monsters":   "lazy-gm-prep.steps.choose-monsters.description",
    "magic-item-rewards":"lazy-gm-prep.steps.magic-item-rewards.description",
    "other-notes":       "lazy-gm-prep.steps.other-notes.description"
  })[step];
}

function localizedTypeLabel(typeKey) {
  const raw = CONFIG.Actor?.typeLabels?.[typeKey] ?? typeKey;
  return game.i18n.localize(String(raw));
}

/* ------------------ HTML builders ------------------ */

function headerWithDesc(stepKey, typeKey /* optional */) {
  const title = game.i18n.localize(stepTitleKey(stepKey));
  const desc  = game.i18n.localize(stepDescKey(stepKey));
  const typeSuffix = typeKey ? ` <small style="opacity:.7">[${localizedTypeLabel(typeKey)}]</small>` : "";
  const refreshBtn = (stepKey === "review-characters" || stepKey === "important-npcs" || stepKey === "choose-monsters")
    ? `<button type="button" class="lgmp-refresh" data-lgmp-refresh>⟲ ${game.i18n.localize("Refresh") || "Refresh"}</button>`
    : "";

  return `
  <div class="lgmp-header">
    <h2 style="margin:0">${title}${typeSuffix}</h2>
    ${refreshBtn}
  </div>
  <p class="lgmp-step-desc">${desc}</p>`;
}

/** Build an actor list section (honors include toggles for auto-pull). */
function buildActorListSection(cat, typeKey) {
  const shouldPull = includeSection(cat);
  const actors = shouldPull ? (game.actors?.filter(a => a.type === typeKey) ?? []) : [];
  const listItems = actors
    .map(a => extractActorSummary(a))
    .map(sum => renderActorListItem(sum, cat))
    .join("\n");

  const empty = shouldPull
    ? `<li class="lgmp-empty"><em>(none found for type ${typeKey})</em></li>`
    : `<li class="lgmp-empty"><em>(auto‑pull disabled in settings)</em></li>`;

  return `
  <section class="lgmp-section lgmp-${cat}">
    <ul class="lgmp-actor-list">
      ${listItems || empty}
    </ul>
  </section>`;
}

/** Build a static, editable section for textual steps (no auto-pull). */
function buildStaticNotesSection(stepKey) {
  return `
  <section class="lgmp-section lgmp-${stepKey}">
    <p><em>${game.i18n.localize("Add your notes here.") || "Add your notes here."}</em></p>
  </section>`;
}

/* ------------------ folder helper ------------------ */

async function ensureFolder(folderName) {
  if (!folderName) return null;
  const existing = game.folders?.find(f => f.type === "JournalEntry" && f.name === folderName);
  if (existing) return existing.id;
  const f = await Folder.create({ name: folderName, type: "JournalEntry" });
  return f?.id ?? null;
}

/* ------------------ main: create journal ------------------ */

/**
 * Public API: create the Prep Journal with the full Lazy DM flow:
 * - Always creates 9 sections (8 steps + Other Notes).
 * - Actor/NPC/Monster pages include auto-pulled lists when enabled.
 * - Each of those three pages has a Refresh button and flags {category, typeKey}.
 * - If "Separate Pages" is off, produces a single combined page with all nine sections.
 */
export async function createPrepJournal() {
  const { actorType, npcType, monsterType } = resolveTypesFromSettings();

  const folderName   = getSetting("folderName", "GM Prep");
  const separate     = !!getSetting("separatePages", true); // ON => 9 pages; OFF => 1 combined page
  const namePrefix   = getSetting("journalPrefix", "Session");
  const seq = nextSequenceNumber();
  const entryName = `${namePrefix} ${seq}: ${new Date().toLocaleDateString()}`;

  const folderId = await ensureFolder(folderName);

  // Order of steps per Lazy DM (+ Other Notes)
  const STEPS = [
    { key: "review-characters", cat: "actor",   typeKey: actorType },
    { key: "strong-start" },
    { key: "outline-scenes" },
    { key: "secrets-clues" },
    { key: "fantastic-locations" },
    { key: "important-npcs",     cat: "npc",     typeKey: npcType },
    { key: "choose-monsters",    cat: "monster", typeKey: monsterType },
    { key: "magic-item-rewards" },
    { key: "other-notes" }
  ];

  if (separate) {
    const pages = [];
    for (const step of STEPS) {
      let content;
      // Header (+ desc) always
      if (step.cat) {
        content = headerWithDesc(step.key, step.typeKey) + buildActorListSection(step.cat, step.typeKey);
      } else {
        content = headerWithDesc(step.key) + buildStaticNotesSection(step.key);
      }
      const page = {
        name: game.i18n.localize(stepTitleKey(step.key)),
        type: "text",
        text: { format: 1, content }
      };
      // Only the Actor/NPC/Monster pages get refresh flags
      if (step.cat) page.flags = { "lazy-gm-prep": { category: step.cat, typeKey: step.typeKey } };
      pages.push(page);
    }

    const entry = await JournalEntry.create({ name: entryName, folder: folderId, pages });
    ui.notifications?.info(game.i18n.format("lazy-gm-prep.notifications.created", { name: entry.name }));
    return entry;
  }

  // Combined single-page mode
  let combined = "";
  for (const step of STEPS) {
    if (step.cat) {
      combined += headerWithDesc(step.key, step.typeKey) + buildActorListSection(step.cat, step.typeKey);
    } else {
      combined += headerWithDesc(step.key) + buildStaticNotesSection(step.key);
    }
  }
  const entry = await JournalEntry.create({
    name: entryName,
    folder: folderId,
    pages: [{ name: namePrefix, type: "text", text: { format: 1, content: combined } }]
  });
  ui.notifications?.info(game.i18n.format("lazy-gm-prep.notifications.created", { name: entry.name }));
  return entry;
}

/* ------------------ helpers ------------------ */

function nextSequenceNumber() {
  const prefix = getSetting("journalPrefix", "Session");
  const existing = game.journal?.filter(j => j.name?.startsWith(prefix)) ?? [];
  const nums = existing
    .map(j => (j.name.match(/\b(\d+)\b/)?.[1]) || null)
    .map(n => (n ? parseInt(n, 10) : 0));
  const max = nums.length ? Math.max(...nums) : 0;
  return max + 1;
}
