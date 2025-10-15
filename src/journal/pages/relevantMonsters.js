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

  const promptKeys = [
    "lazy-gm-prep.monsters.prompts.1",
    "lazy-gm-prep.monsters.prompts.2",
    "lazy-gm-prep.monsters.prompts.3",
    "lazy-gm-prep.monsters.prompts.4"
  ];

  const promptsHtml = renderPromptsBlock(promptKeys);

  const quoteHtml = `
    <blockquote class="lgmp-quote">
      ${game.i18n.localize("lazy-gm-prep.monsters.quote")}
    </blockquote>
  `;

  const urlLabel = game.i18n.localize("lazy-gm-prep.monsters.url.label");
  const url = game.i18n.localize("lazy-gm-prep.monsters.url");
  const urlHtml = `
    <p><a href{urlLabel}</a></p>
  `;

  const content = `${promptsHtml}\n${quoteHtml}\n${urlHtml}`;

  return {
    name: game.i18n.localize(def.titleKey),
    type: 'text',
    text: { format: 1, content }
  };
}
