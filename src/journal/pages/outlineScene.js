
// src/journal/pages/outlineScene.js

import { notesPlaceholder, renderPromptsBlock } from '../helpers.js';

/**
 * Escape helper (local to avoid import fragility).
 */
function escapeHtml(str) {
  const s = String(str ?? '');
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

/**
 * Build the scenes block. If prevContent exists, we reuse it unchanged.
 * The "Done" marker is a plain checklist LI; no data-marker, no inline JS.
 */
function buildScenesHTML(prevContent, defaultCount = 3) {
  if (prevContent && String(prevContent).trim().length > 0) {
    return String(prevContent);
  }

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
  const desc = game.i18n.localize('lazy-gm-prep.steps.outline-scenes.description');

  const scenesHeading =
    game.i18n.localize('lazy-gm-prep.outline-scenes.heading') || 'Scenes';

  let html = `
    <h2 class="lgmp-section-title">${escapeHtml(title)}</h2>
    <p class="lgmp-section-desc">${escapeHtml(desc)}</p>
  `;

  const promptKeys = [
    'lazy-gm-prep.outline-scenes.prompts.1',
    'lazy-gm-prep.outline-scenes.prompts.2',
    'lazy-gm-prep.outline-scenes.prompts.3',
    'lazy-gm-prep.outline-scenes.prompts.4',
  ];
  html += renderPromptsBlock(promptKeys, 'lazy-gm-prep.prompts.heading', false);

  html += `
    <h2 class="lgmp-section-title">${escapeHtml(scenesHeading)}</h2>
    ${buildScenesHTML(prevContent, 3)}
  `;

  // No inline handlers; main.js will attach toggling behavior uniformly.

  return html;
}
