// src/journal/pages/fantasticLocations.js
import { renderPromptsBlock, sectionDescription } from '../helpers.js';

export function createFantasticLocationsPage(def, prevContent) {
  const title = game.i18n.localize(def.titleKey);

  // Honor "Copy previous" behavior
  if (prevContent && String(prevContent).trim()) {
    return {
      name: title,
      type: 'text',
      text: { format: 1, content: String(prevContent) }
    };
  }

  const promptKeys = [
    "lazy-gm-prep.fantastic-locations.prompts.1",
    "lazy-gm-prep.fantastic-locations.prompts.2",
    "lazy-gm-prep.fantastic-locations.prompts.3",
    "lazy-gm-prep.fantastic-locations.prompts.4",
    "lazy-gm-prep.fantastic-locations.prompts.5",
    "lazy-gm-prep.fantastic-locations.prompts.6"
  ];

  let html = '';
  // Localized page description from lang/en.json via def.descKey
  html += sectionDescription(def);

  // Prompts block
  html += renderPromptsBlock(promptKeys, "lazy-gm-prep.prompts.heading", false);

  // Localized Tip as a blockquote (placed after Prompts)
  html += tipBlockquoteHTML();

  // Three template blocks (styled cards like Outline Scenes)
  html += templatesHTML();

  return {
    name: title,
    type: 'text',
    text: { format: 1, content: html }
  };
}

/**
 * Renders the i18n Tip (after Prompts) as a blockquote.
 * If the key is missing/empty, nothing is rendered.
 */
function tipBlockquoteHTML() {
  const tip = game.i18n.localize("lazy-gm-prep.fantastic-locations.tip") ?? "";
  const clean = String(tip).trim();
  if (!clean) return "";
  return `
<blockquote><em>${escapeHtml(clean)}</em></blockquote>
`;
}

function templatesHTML() {
  // Parent grid container for cards
  return `
<div class="lgmp-scenes">
  ${[1, 2, 3].map(n => locationTemplateHTML(n)).join('\n')}
</div>
`;
}

function locationTemplateHTML(n) {
  return `
  <div class="lgmp-scene">
    <h5>Location ${n}</h5>
    <div class="lgmp-field"><strong>Name:</strong> <em>(Make it memorable)</em></div>
    <div class="lgmp-field"><strong>Three Features:</strong>
      <ul>
        <li>(What stands out? Scale, age, weirdness, danger, mystery)</li>
        <li></li>
        <li></li>
      </ul>
    </div>
    <div class="lgmp-field"><strong>Who/What’s Here:</strong> <em>(Monsters, NPCs, factions, or just a vibe)</em></div>
    <div class="lgmp-field"><strong>PC Hook:</strong> <em>(How could this matter to the party?)</em></div>
  </div>
`;
}

function escapeHtml(s) {
  return String(s ?? '').replace(/[&<>\"']/g, c => (
    { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]
  ));
}
