
// src/journal/pages/strongStart.js

import {
  sectionDescription,
  notesPlaceholder,
  renderPromptsBlock,
  renderDetailsBlock
} from '../helpers.js';

export function createStrongStartPage(def, prevContent) {
  const title = game.i18n.localize(def.titleKey);

  // If copying previous content, use it directly—no extra heading or template
  if (prevContent && String(prevContent).trim()) {
    return { name: title, type: 'text', text: { format: 1, content: prevContent } };
  }

  // Otherwise, render the default template
  const promptKeys = [
    "lazy-gm-prep.strong-start.prompts.world",
    "lazy-gm-prep.strong-start.prompts.grab",
    "lazy-gm-prep.strong-start.prompts.twist",
    "lazy-gm-prep.strong-start.prompts.tie"
  ];

  let html = "";
  html += sectionDescription(def);
  html += renderPromptsBlock(promptKeys, "lazy-gm-prep.prompts.heading", false);
  html += notesPlaceholder();

  // Collapsible: Strong Start Encounters under a twisty
  html += renderDetailsBlock(
    "lazy-gm-prep.strong-start.table.heading",
    strongStartEncountersHTML(), // inner content (roller + table)
    false,                       // collapsed by default; set to true if you want it open initially
    "lgmp-strong-start-block"    // class hook for styling / JS
  );

  return { name: title, type: 'text', text: { format: 1, content: html } };
}

/**
 * Inner content for the Strong Start Encounters block:
 * - The inline roller is wrapped in .lgmp-ss-roller so the highlighter can find it.
 * - The table carries .lgmp-strong-start so the highlighter can target rows.
 */
function strongStartEncountersHTML() {
  const heading = game.i18n.localize('lazy-gm-prep.strong-start.table.heading');
  const rollLabel = game.i18n.localize('lazy-gm-prep.strong-start.table.rollLabel');

  const rows = Array.from({ length: 20 }, (_, i) => {
    const n = i + 1;
    const text = game.i18n.localize(`lazy-gm-prep.strong-start.table.${n}`);
    return `<tr><td>${n}</td><td>${escapeHtml(text)}</td></tr>`;
  }).join('\n');

  // Use Foundry's inline-roll syntax so core creates the anchor with data-roll
  // Keep the roller near the table, inside the details, for a self-contained section.
  return `
<div class="lgmp-ss-roller">${escapeHtml(rollLabel)} [[1d20]]</div>
<table class="lgmp-strong-start">
  <thead><tr><th>d20</th><th>${escapeHtml(heading)}</th></tr></thead>
  <tbody>
    ${rows}
  </tbody>
</table>
`;
}

function escapeHtml(s) {
  return String(s ?? '').replace(/[&<>\"']/g, c => (
    { '&': '&', '<': '<', '>': '>', '"': '\"' }[c]
  ));
}
