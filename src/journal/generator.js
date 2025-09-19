// src/journal/generator.js
import { MODULE_ID, SETTINGS } from "../constants.js";
import { PAGE_ORDER, getSetting } from "../settings.js";
/**
 * Create a new GM Prep journal for the next session.
 * - Separate pages: no in-body H2 (avoid duplicate with page name).
 * - Fresh "secrets-clues" => description + notes + 10 blank ☐ Clue lines.
 * - Copy "secrets-clues" => rebuild checklist from UNCHECKED items only (top up to 10).
 * - Copy non-secrets => scrub legacy headers/desc; keep content.
 * - Combined page mode: includes H2 per section; same checklist logic.
 * - Normalizes legacy [ ] / [x] and <input type="checkbox"> to ☐ / ☑ before processing.
 * - NEW: "review-characters" => inject a 6×5 blank table + four GM prompts on fresh pages.
 */
export async function createPrepJournal() {
  const separate = !!getSetting(SETTINGS.separatePages, true);
  const folderName = getSetting(SETTINGS.folderName, "GM Prep");
  const prefix = getSetting(SETTINGS.journalPrefix, "Session");
  const includeDate = !!getSetting("includeDateInName", true);
  const folderId = await ensureFolder(folderName);
  const seq = nextSequenceNumber(prefix); // next session number based on highest existing
  const entryName = includeDate
    ? `${prefix} ${seq}: ${new Date().toLocaleDateString()}`
    : `${prefix} ${seq}`;
  const prev = findPreviousSession(prefix); // highest-numbered existing session (source)

  if (separate) {
    const pages = [];
    for (const def of PAGE_ORDER) {
      const copyOn = !!getSetting(`copy.${def.key}`, def.key !== "choose-monsters");
      const prevContent = copyOn ? getPreviousPageContent(prev, def) : null;

      // --- Secrets & Clues (special handling) ---
      if (def.key === "secrets-clues") {
        let content;
        if (prevContent) {
          // Normalize + rebuild from UNCHECKED
          const normalized = normalizeMarkers(
            scrubContent(prevContent, def, { stripTitle: true, stripLegacyHeader: true, stripDesc: false })
          );
          const { bodyWithoutChecklist, items } = extractModuleChecklist(normalized);
          const uncheckedTexts = items.filter(i => !i.checked).map(i => i.text.trim());
          const toRender = topUpToTen(uncheckedTexts, "Clue");
          const bodyCore = bodyWithoutChecklist?.trim()
            ? `${bodyWithoutChecklist.trim()}\n`
            : "";
          content = `${bodyCore}${renderChecklist(toRender)}`;
          if (!bodyCore) content = sectionDescription(def) + notesPlaceholder() + content;
        } else {
          // Fresh page
          content = sectionDescription(def) + notesPlaceholder() + renderChecklist(topUpToTen([], "Clue"));
        }
        pages.push({ name: game.i18n.localize(def.titleKey), type: "text", text: { format: 1, content } });
        continue;
      }

      // --- NEW: Review the Characters (special handling) ---
      // Inject a 6×5 blank table + four prompts on fresh pages (or when scrubbed content ends up empty).
      if (def.key === "review-characters") {
        let content;
        if (prevContent) {
          content = scrubContent(prevContent, def, { stripTitle: true, stripLegacyHeader: true, stripDesc: false });
          if (!content.trim()) {
            content =
              sectionDescription(def) +
              characterReviewTableHTML(5) +
              gmReviewPromptsHTML() +
              notesPlaceholder();
          }
        } else {
          // Fresh page
          content =
            sectionDescription(def) +
            characterReviewTableHTML(5) +
            gmReviewPromptsHTML() +
            notesPlaceholder();
        }
        pages.push({ name: game.i18n.localize(def.titleKey), type: "text", text: { format: 1, content } });
        continue;
      }

      // --- Default handling for other pages ---
      let content;
      if (prevContent) {
        content = scrubContent(prevContent, def, { stripTitle: true, stripLegacyHeader: true, stripDesc: false });
        if (!content.trim()) content = sectionDescription(def) + notesPlaceholder();
      } else {
        content = sectionDescription(def) + notesPlaceholder();
      }
      pages.push({ name: game.i18n.localize(def.titleKey), type: "text", text: { format: 1, content } });
    }

    const entry = await JournalEntry.create({ name: entryName, folder: folderId, pages });
    ui.notifications?.info(game.i18n.format("lazy-gm-prep.notifications.created", { name: entry.name }));
    return entry;
  }

  // --- Combined single page mode ---
  const chunks = [];
  for (const def of PAGE_ORDER) {
    const copyOn = !!getSetting(`copy.${def.key}`, def.key !== "choose-monsters");
    const prevContent = copyOn ? getPreviousPageContent(prev, def) : null;
    const headerHtml = sectionHeader(def) + sectionDescription(def);

    if (def.key === "secrets-clues") {
      let bodyHtml;
      if (prevContent) {
        const normalized = normalizeMarkers(
          scrubContent(prevContent, def, { stripTitle: true, stripLegacyHeader: true, stripDesc: true })
        );
        const { bodyWithoutChecklist, items } = extractModuleChecklist(normalized);
        const uncheckedTexts = items.filter(i => !i.checked).map(i => i.text.trim());
        const toRender = topUpToTen(uncheckedTexts, "Clue");
        bodyHtml = `${(bodyWithoutChecklist?.trim() ?? "")}${renderChecklist(toRender)}`;
        if (!bodyWithoutChecklist?.trim()) bodyHtml = notesPlaceholder() + bodyHtml;
      } else {
        bodyHtml = notesPlaceholder() + renderChecklist(topUpToTen([], "Clue"));
      }
      chunks.push(`${headerHtml}${bodyHtml}`);
      continue;
    }

    // NEW: Characters in combined page
    if (def.key === "review-characters") {
      let bodyHtml;
      if (prevContent) {
        bodyHtml = scrubContent(prevContent, def, { stripTitle: true, stripLegacyHeader: true, stripDesc: true });
        if (!bodyHtml.trim()) bodyHtml = characterReviewTableHTML(5) + gmReviewPromptsHTML() + notesPlaceholder();
      } else {
        bodyHtml = characterReviewTableHTML(5) + gmReviewPromptsHTML() + notesPlaceholder();
      }
      chunks.push(`${headerHtml}${bodyHtml}`);
      continue;
    }

    // Other sections (combined)
    let bodyHtml;
    if (prevContent) {
      bodyHtml = scrubContent(prevContent, def, { stripTitle: true, stripLegacyHeader: true, stripDesc: true });
      if (!bodyHtml.trim()) bodyHtml = notesPlaceholder();
    } else {
      bodyHtml = notesPlaceholder();
    }
    chunks.push(`${headerHtml}${bodyHtml}`);
  }

  const entry = await JournalEntry.create({
    name: entryName,
    folder: folderId,
    pages: [{
      name: game.i18n.localize("lazy-gm-prep.module.name"),
      type: "text",
      text: { format: 1, content: chunks.join("\n<hr/>\n") }
    }]
  });
  ui.notifications?.info(game.i18n.format("lazy-gm-prep.notifications.created", { name: entry.name }));
  return entry;
}

/* =============================== section builders =============================== */
function sectionHeader(def) {
  const title = game.i18n.localize(def.titleKey);
  return `<h2 style="margin:0">${escapeHtml(title)}</h2>\n`;
}
function sectionDescription(def) {
  const desc = game.i18n.localize(def.descKey);
  return `<p class="lgmp-step-desc">${escapeHtml(desc)}</p>\n<hr/>\n`;
}
function notesPlaceholder() {
  const hint = game.i18n.localize("lazy-gm-prep.ui.add-notes-here") ||
               "Add your notes here.";
  return `<p><em>${escapeHtml(hint)}</em></p>\n`;
}

/* ============================== Characters table & prompts ============================== */
/** 6 columns, 5 rows blank. English labels are inline to avoid touching en.json. */
function characterReviewTableHTML(rowCount = 5) {
  const headers = ["PC Name", "Player", "Concept/Role", "Goal/Hook", "Bond/Drama", "
