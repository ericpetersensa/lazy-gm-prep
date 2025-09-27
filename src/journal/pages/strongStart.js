// src/journal/pages/strongStart.js
import { sectionDescription } from '../helpers.js';

export function createStrongStartPage(def, prevContent) {
  const title = game.i18n.localize(def.titleKey);
  let html = '';
  html += sectionDescription(def);           // standardized per-section intro rule
  html += introHTML();                       // short description + attribution
  html += promptsHTML();                     // thought-provoking prompts
  html += d20TableHTML();                    // d20 table + inline roller
  // If “Copy previous” is enabled and content exists, append it at the end.
  if (prevContent && String(prevContent).trim()) {
    const prevHeading = game.i18n.localize('lazy-gm-prep.ui.previous-section.heading') || 'Previous Notes';
    html += `\n<hr>\n<h3>${escapeHtml(prevHeading)}</h3>\n${prevContent}`;
  }

  return {
    name: title,
    type: 'text',
    text: { format: 1, content: html }
  };
}

function introHTML() {
  const blurb = game.i18n.localize('lazy-gm-prep.strong-start.blurb');
  const attribution = game.i18n.localize('lazy-gm-prep.strong-start.attribution');
  return `
<p>${escapeHtml(blurb)}</p>
<p class="lgmp-quote-source"><em>${escapeHtml(attribution)}</em></p>
`;
}

function promptsHTML() {
  const heading = game.i18n.localize('lazy-gm-prep.strong-start.prompts.heading');
  const keys = [
    'lazy-gm-prep.strong-start.prompts.world',
    'lazy-gm-prep.strong-start.prompts.grab',
    'lazy-gm-prep.strong-start.prompts.close',
    'lazy-gm-prep.strong-start.prompts.twist',
    'lazy-gm-prep.strong-start.prompts.tie',
    'lazy-gm-prep.strong-start.prompts.mood',
    'lazy-gm-prep.strong-start.prompts.player'
  ];
  const lis = keys.map(k => `<li>${escapeHtml(game.i18n.localize(k))}</li>`).join('\n');
  return `
<h3>${escapeHtml(heading)}</h3>
<ul class="lgmp-prompts">
${lis}
</ul>
`;
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
<h3>${escapeHtml(heading)}</h3>
<p><strong>${escapeHtml(rollLabel)}:</strong> [[1d20]]</p>
<table class="lgmp-table lgmp-strong-start">
  <thead><tr><th>d20</th><th>${escapeHtml(heading)}</th></tr></thead>
  <tbody>
${rows}
  </tbody>
</table>
`;
}

function escapeHtml(s) {
  return String(s ?? '').replace(/[&<>\"']/g, c => (
    { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]
  ));
}
