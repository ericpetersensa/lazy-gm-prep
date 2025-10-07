// src/journal/pages/strongStart.js
import { sectionDescription, notesPlaceholder, renderPromptsBlock } from '../helpers.js';

export function createStrongStartPage(def, prevContent) {
  const title = game.i18n.localize(def.titleKey);

  const promptKeys = [
    "lazy-gm-prep.strong-start.prompts.world",
    "lazy-gm-prep.strong-start.prompts.grab",
    "lazy-gm-prep.strong-start.prompts.twist",
    "lazy-gm-prep.strong-start.prompts.tie"
  ];

  let html = "";
  html += sectionDescription(def);
  html += renderPromptsBlock(promptKeys, "lazy-gm-prep.strong-start.prompts.heading", true);
  html += notesPlaceholder();
  html += d20TableHTML();

  // If “Copy previous” is enabled and content exists, append it at the end.
  if (prevContent && String(prevContent).trim()) {
    const prevHeading = game.i18n.localize('lazy-gm-prep.ui.previous-section.heading') || 'Previous Notes';
    html += `

#### ${escapeHtml(prevHeading)}

${prevContent}`;
  }

  return { name: title, type: 'text', text: { format: 1, content: html } };
}

function d20TableHTML() {
  const heading = game.i18n.localize('lazy-gm-prep.strong-start.table.heading');
  const rollLabel = game.i18n.localize('lazy-gm-prep.strong-start.table.rollLabel');

  const rows = Array.from({ length: 20 }, (_, i) => {
    const n = i + 1;
    const text = game.i18n.localize(`lazy-gm-prep.strong-start.table.${n}`);
    return `
<tr>
  <td>${n}</td>
  <td>${escapeHtml(text)}</td>
</tr>`;
  }).join('\n');

  return `
#### ${escapeHtml(heading)}

<span class="lgmp-ss-roller">${escapeHtml(rollLabel)}: [[1d20]]</span>
<table class="lgmp-table lgmp-strong-start">
  <thead>
    <tr>
      <th>d20</th>
      <th>${escapeHtml(heading)}</th>
    </tr>
  </thead>
  <tbody>
${rows}
  </tbody>
</table>
`;
}

function escapeHtml(s) {
  return String(s ?? '').replace(/[&<>\"']/g, c => (
    { '&': '&', '<': '<', '>': '>', '"': "\"", "'": "'" }[c]
  ));
}
