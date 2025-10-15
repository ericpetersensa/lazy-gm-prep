// src/journal/pages/relevantMonsters.js
import { renderPromptsBlock } from '../helpers.js';

export function createRelevantMonstersPage(def, prevContent) {
  // If previous content exists and copy is enabled, reuse it.
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

  // Collapsible Prompts Section
  const promptsHtml = renderPromptsBlock(promptKeys);

  // Quote Section
  const quoteHtml = `
    <blockquote class="lgmp-quote">
      ${game.i18n.localize("lazy-gm-prep.monsters.quote")}
    </blockquote>
  `;

  // Clickable URL Section
  const urlLabel = game.i18n.localize("lazy-gm-prep.monsters.url.label");
  const url = game.i18n.localize("lazy-gm-prep.monsters.url");
  const urlHtml = `
    <p>${url}${urlLabel}</a></p>
  `;

  // Final page content
  const content = `${promptsHtml}\n${quoteHtml}\n${urlHtml}`;

  return {
    name: game.i18n.localize(def.titleKey),
    type: 'text',
    text: { format: 1, content }
  };
}
