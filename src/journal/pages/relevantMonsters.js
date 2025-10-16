// src/journal/pages/relevantMonsters.js
import { renderPromptsBlock } from '../helpers.js';

export function createRelevantMonstersPage(def, prevContent) {
  // Reuse previous content if available and copy is enabled.
  if (prevContent && prevContent.trim()) {
    return {
      name: game.i18n.localize(def.titleKey),
      type: 'text',
      text: { format: 1, content: prevContent }
    };
  }

  // Prompts for the monsters section
  const promptKeys = [
    "lazy-gm-prep.monsters.prompts.1",
    "lazy-gm-prep.monsters.prompts.2",
    "lazy-gm-prep.monsters.prompts.3",
    "lazy-gm-prep.monsters.prompts.4"
  ];
  const promptsHtml = renderPromptsBlock(promptKeys);

  // Quote
  const quoteHtml = `
    <blockquote class="lgmp-quote">
      ${game.i18n.localize("lazy-gm-prep.monsters.quote")}
    </blockquote>
  `;

  // URL + label via i18n, with safe fallbacks if i18n is missing
  const urlKey = "lazy-gm-prep.monsters.url";
  const labelKey = "lazy-gm-prep.monsters.url.label";

  const rawUrl = game.i18n.localize(urlKey);
  const rawLabel = game.i18n.localize(labelKey);

  // If localize fails, it returns the key string; detect and fallback.
  const href = /^https?:\/\//i.test(rawUrl) && rawUrl !== urlKey
    ? rawUrl
    : "https://slyflourish.com/5e_artisanal_database/monsters/index.html";

  const label = rawLabel && rawLabel !== labelKey
    ? rawLabel
    : "Monster Database";

  // Proper clickable link
  const urlHtml = `
    <p>
      ${href}${label}</a>
    </p>
  `;

  const content = `${promptsHtml}\n${quoteHtml}\n${urlHtml}`;

  return {
    name: game.i18n.localize(def.titleKey),
    type: 'text',
    text: { format: 1, content }
  };
}
