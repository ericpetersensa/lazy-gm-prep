// src/journal/pages/relevantMonsters.js
import { renderPromptsBlock } from '../helpers.js';

export function createRelevantMonstersPage(def, prevContent) {
  // Reuse previous content if present
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

  // Safe i18n with fallbacks to avoid missing/mashed output
  const t = (key, fallback = "") => {
    const v = game.i18n.localize(key);
    return v === key ? fallback : v;
  };
  const url = t(
    "lazy-gm-prep.monsters.url",
    "https://slyflourish.com/5e_artisanal_database/monsters/index.html"
  );
  const urlLabel = t("lazy-gm-prep.monsters.url.label", "Monster Database");
  const urlHtml = `
    <p>${url}${urlLabel}</a></p>
  `;

  const content = `${promptsHtml}\n${quoteHtml}\n${urlHtml}`;

  return {
    name: game.i18n.localize(def.titleKey),
    type: 'text',
    text: { format: 1, content }
  };
}
``
