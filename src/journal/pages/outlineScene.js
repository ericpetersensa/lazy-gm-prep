
// src/journal/pages/outlineScene.js

import { notesPlaceholder, renderPromptsBlock } from '../helpers.js';

/**
 * Build the Scenes section.
 * - Each scene card contains a header, optional notes area, and a checklist.
 * - The "Done" item is a plain checklist LI (no data-marker, no custom JS).
 *
 * @param {string} prevContent - previously saved HTML (for re-render merges if needed)
 * @param {number} defaultCount - the default number of scene cards to render if no prior content exists
 * @returns {string} inner HTML for the scenes block
 */
function buildScenesHTML(prevContent, defaultCount = 3) {
  // If we have previously saved HTML, prefer using it (main.js will manage toggling)
  if (prevContent && String(prevContent).trim().length > 0) {
    return String(prevContent);
  }

  // Otherwise, render a default set of scene cards
  const cards = [];
  for (let i = 1; i <= defaultCount; i++) {
    cards.push(`
      <section class="lgmp-scene card">
        <header class="card-header">
          <h3 class="card-title">Scene ${i}</h3>
        </header>
        <div class="card-body">
          <div class="lgmp-notes">
            ${notesPlaceholder()}
          </div>
          <ul class="lgmp-checklist">
            <!-- Plain checklist item; main.js will attach behavior -->
            <li>☐ Done</li>
          </ul>
        </div>
      </section>
    `);
  }

  return cards.join('\n');
}

export function createOutlineScenesPage(def, prevContent) {
  const title = game.i18n.localize(def.titleKey);

  // Description from i18n
  const desc = game.i18n.localize("lazy-gm-prep.steps.outline-scenes.description");

  let html = `
    <h2 class="lgmp-section-title">${escapeHtml(title)}</h2>
    <p class="lgmp-section-desc">${escapeHtml(desc)}</p>
  `;

  // Prompts section (collapsed by default)
  const promptKeys = [
    "lazy-gm-prep.outline-scenes.prompts.1",
    "lazy-gm-prep.outline-scenes.prompts.2",
    "lazy-gm-prep.outline-scenes.prompts.3",
    "lazy-gm-prep.outline-scenes.prompts.4",
  ];
  html += renderPromptsBlock(promptKeys, "lazy-gm-prep.prompts.heading", false);

  // Scenes section (open by default) — header localized
  const scenesHeading = game.i18n.localize("lazy-gm-prep.outline-scenes.heading") || "Scenes";

  html += `
    <h2 class="lgmp-section-title">${escapeHtml(scenesHeading)}</h2>
    ${buildScenesHTML(prevContent, 3)}
  `;

  // NOTE:
  // - No inline JS.
  // - No data-marker attributes on checklist items.
  // - Toggling behavior is delegated to main.js across Clues and Scenes.

  return html;
}

/**
 * Escape helper.
 * If your project already exports a canonical escapeHtml, feel free to import/use it.
 */
function escapeHtml(str) {
  const s = String(str ?? '');
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}
