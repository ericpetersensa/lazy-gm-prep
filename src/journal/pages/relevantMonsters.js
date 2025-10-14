// src/journal/pages/relevantMonsters.js
import { renderPromptsBlock } from '../helpers.js';

export function createRelevantMonstersPage(def, prevContent) {
  if (prevContent && prevContent.trim()) {
    return {
      name: game.i18n.localize(def.titleKey),
      type: 'text',
      text: { format: 1, content: prevContent }
    };
  }

  // Prompts keys for monsters section
  const promptKeys = [
    "lazy-gm-prep.monsters.prompts.1",
    "lazy-gm-prep.monsters.prompts.2",
    "lazy-gm-prep.monsters.prompts.3",
    "lazy-gm-prep.monsters.prompts.4"
  ];

  // Collapsible Prompts Section (using shared heading)
  const promptsHtml = renderPromptsBlock(promptKeys);

  // Quote Section
  const quoteHtml = `
    <blockquote style="margin-top:1em;font-style:italic;">
      ${game.i18n.localize("lazy-gm-prep.monsters.quote")}
    </blockquote>
  `;

  // Clickable URL Section
  const urlLabel = game.i18n.localize("lazy-gm-prep.monsters.url.label");
  const url = game.i18n.localize("lazy-gm-prep.monsters.url");
  const urlHtml = `
    <div style="margin-top:1em;">
      <a href="${url}" target="_blank" rel="noopener">${urlLabel}</a>
Html + quoteHtml + urlHtml;

  return {
    name: game.i18n.localize(def.titleKey),
    type: 'text',
    text: { format: 1, content }
  };
}
