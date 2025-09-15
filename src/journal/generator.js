// src/journal/generator.js
import { MODULE_ID } from "../util.js";
import { resolveTypesFromSettings } from "./resolve-types.js";
import { extractActorSummary, renderActorListItem } from "./extract.js";

/** Read configured toggles */
function includeSection(cat) {
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

function sectionTitle(cat, typeKey) {
  const typeLabel = CONFIG.Actor?.typeLabels?.[typeKey] ?? typeKey;
  const t = game.i18n.localize({
    actor:   "lazy-gm-prep.steps.review-characters.title",
    npc:     "lazy-gm-prep.steps.important-npcs.title",
    monster: "lazy-gm-prep.steps.choose-monsters.title"
  }[cat]);
  return `${t} <small style="opacity:.7">[${game.i18n.localize(String(typeLabel))}]</small>`;
}

/** Build a page's HTML list for a category by resolved type key. */
function buildCategoryHTML(cat, typeKey) {
  const actors = (game.actors?.filter(a => a.type === typeKey) ?? []);
  const listItems = actors
    .map(a => extractActorSummary(a))
    .map(sum => renderActorListItem(sum, cat))
    .join("\n");

  const empty = `<li class="lgmp-empty"><em>(none found for type ${typeKey})</em></li>`;
  return `
  <section class="lgmp-section lgmp-${cat}">
    <ul class="lgmp-actor-list">
      ${listItems || empty}
    </ul>
  </section>`;
}

/** Ensure a folder exists; return folder id or null. */
async function ensureFolder(folderName) {
  if (!folderName) return null;
  const existing = game.folders?.find(f => f.type === "JournalEntry" && f.name === folderName);
  if (existing) return existing.id;
  const f = await Folder.create({ name: folderName, type: "JournalEntry" });
  return f?.id ?? null;
}

/**
 * Public API: create the Prep Journal with one page per Lazy DM section.
 * Respects: folderName, journalPrefix, separatePages, include toggles.
 */
export async function createPrepJournal() {
  const { actorType, npcType, monsterType } = resolveTypesFromSettings();

  const folderName   = getSetting("folderName", "GM Prep");
  const separate     = !!getSetting("separatePages", true);
  const namePrefix   = getSetting("journalPrefix", "Session");
  const seq = nextSequenceNumber(); // simple incrementer
  const entryName = `${namePrefix} ${seq}: ${new Date().toLocaleDateString()}`;

  const folderId = await ensureFolder(folderName);

  // Build pages
  const pages = [];

  if (includeSection("actor")) {
    pages.push({
      name: game.i18n.localize("lazy-gm-prep.steps.review-characters.title"),
      type: "text",
      text: {
        format: 1, // HTML
        content: `<h2>${sectionTitle("actor", actorType)}</h2>${buildCategoryHTML("actor", actorType)}`
      }
    });
  }

  if (includeSection("npc")) {
    pages.push({
      name: game.i18n.localize("lazy-gm-prep.steps.important-npcs.title"),
      type: "text",
      text: {
        format: 1,
        content: `<h2>${sectionTitle("npc", npcType)}</h2>${buildCategoryHTML("npc", npcType)}`
      }
    });
  }

  if (includeSection("monster")) {
    pages.push({
      name: game.i18n.localize("lazy-gm-prep.steps.choose-monsters.title"),
      type: "text",
      text: {
        format: 1,
        content: `<h2>${sectionTitle("monster", monsterType)}</h2>${buildCategoryHTML("monster", monsterType)}`
      }
    });
  }

  // Create the Journal Entry
  const entry = await JournalEntry.create({ name: entryName, folder: folderId, pages });
  ui.notifications?.info(game.i18n.format("lazy-gm-prep.notifications.created", { name: entry.name }));
  return entry;
}

function nextSequenceNumber() {
  const prefix = getSetting("journalPrefix", "Session");
  const existing = game.journal?.filter(j => j.name?.startsWith(prefix)) ?? [];
  const nums = existing
    .map(j => (j.name.match(/\b(\d+)\b/)?.[1]) || null)
    .map(n => (n ? parseInt(n, 10) : 0));
  const max = nums.length ? Math.max(...nums) : 0;
  return max + 1;
}
