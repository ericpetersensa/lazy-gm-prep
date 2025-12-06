
// src/journal/pages/outlineScene.js
import { renderPromptsBlock } from '../helpers.js';

/** Minimal HTML escaper (keeps localized strings safe in HTML). */
function escapeHtml(str) {
  const map = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' };
  return String(str ?? '').replace(/[&<>"']/g, (c) => map[c]);
}

/**
 * Build N scene cards. If you later want to seed with previous content,
 * you can parse `prevContent` and hydrate notes per card.
 */
function buildScenesHTML(prevContent, count = 3) {
  let html = '';
  for (let i = 1; i <= count; i++) {
    html += `
      <section class="lgmp-scene card">
        <header class="card-header">
          <h3 class="card-title">Scene ${i}</h3>
        </header>
        <div class="card-body">
          <div class="lgmp-notes">
            <p class="lgmp-notes-hint">Add your notes here.</p>
          </div>
          <ul class="lgmp-checklist">
            <!-- Plain checklist item; domHooks.js will attach behavior -->
            <li data-marker="scene-done">☐ Done</li>
          </ul>
        </div>
      </section>
    `;
  }
  return html;
}

/**
 * Outline Potential Scenes page as a v13 JournalEntryPage object.
 */
export function createOutlineScenesPage(def, prevContent) {
  // Localized section title and description
  const title = game.i18n.localize(def.titleKey);
  const desc = game.i18n.localize("lazy-gm-prep.steps.outline-scenes.description");

  // Build top header + description
  let html = `
    <h2 class="lgmp-section-title">${escapeHtml(title)}</h2>
    <p class="lgmp-section-desc">${escapeHtml(desc)}</p>
  `;

  // Prompts (collapsed by default)
  const promptKeys = [
    "lazy-gm-prep.outline-scenes.prompts.1",
    "lazy-gm-prep.outline-scenes.prompts.2",
    "lazy-gm-prep.outline-scenes.prompts.3",
    "lazy-gm-prep.outline-scenes.prompts.4"
  ];
  html += renderPromptsBlock(promptKeys, "lazy-gm-prep.prompts.heading", false);

  // Scenes section (open by default)
  const scenesHeading = game.i18n.localize("lazy-gm-prep.outline-scenes.heading") || "Scenes";
  html += `
    <h2 class="lgmp-section-title">${escapeHtml(scenesHeading)}</h2>
    ${buildScenesHTML(prevContent, 3)}
  `;

  // Return a proper JournalEntryPage object (v13)
  return {
    name: title,
    type: "text",
    text: {
      content: html,
      format: CONST.TEXT_FORMAT_HTML
    },
    sort: 500
  };
}
