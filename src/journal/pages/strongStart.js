// src/journal/pages/strongStart.js

import { sectionDescription, notesPlaceholder, renderPromptsBlock } from '../helpers.js';

export function createStrongStartPage(def, prevContent) {
  const title = game.i18n.localize(def.titleKey);

  // If copying previous content, use it directly—no extra heading or template
  if (prevContent && String(prevContent).trim()) {
    return {
      name: title,
      type: 'text',
      text: { format: 1, content: prevContent }
    };
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
  html += d20TableHTML();

  return {
    name: title,
    type: 'text',
    text: { format: 1, content: html }
  };
}

function d20TableHTML() {
  const heading = game.i18n.localize('lazy-gm-prep.strong-start.table.heading');
  const rollLabel = game.i18n.localize('lazy-gm-prep.strong-start.table.rollLabel');
  const rows = Array.from({ length: 20 }, (_, i) => {
    const n = i + 1;
    const text = game.i18n.localize(`lazy-gm-prep.strong-start.table.${n}`);
    return `<tr><td>${n}</td><td>${escapeHtml(text)}</td></tr>`;
  }).join('\n');
  return `
    <h5>${escapeHtml(heading)}</h5>
    <p>${escapeHtml(rollLabel)}: [[1d20]]</p>
    <table>
      <tr>
        <th>d20</th>
        <th>${escapeHtml(heading)}</th>
      </tr>
      ${rows}
    </table>
  `;
}

function escapeHtml(s) {
  return String(s ?? '').replace(/[&<>\"']/g, c => (
    { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]
  ));
}
