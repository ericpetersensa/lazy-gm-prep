// src/journal/pages/secretsClues.js
import { normalizeMarkers, extractModuleChecklist, topUpToTen, renderChecklist } from '../checklist.js';
import { sectionDescription, notesPlaceholder, renderPromptsBlock } from '../helpers.js';

export function createSecretsCluesPage(def, prevContent) {
  const promptKeys = [
    "lazy-gm-prep.secrets-clues.prompts.rumor",
    "lazy-gm-prep.secrets-clues.prompts.secretPast",
    "lazy-gm-prep.secrets-clues.prompts.artifact",
    "lazy-gm-prep.secrets-clues.prompts.mystery"
  ];

  let content;
  if (prevContent) {
    const normalized = normalizeMarkers(prevContent);
    const { bodyWithoutChecklist, items } = extractModuleChecklist(normalized);
    const uncheckedTexts = items.filter(i => !i.checked).map(i => i.text.trim());
    const toRender = topUpToTen(uncheckedTexts, 'Clue');
    const bodyCore = bodyWithoutChecklist?.trim() ? `${bodyWithoutChecklist.trim()}\n` : '';
    content = `${bodyCore}${renderChecklist(toRender)}`;
    if (!bodyCore) {
      content = sectionDescription(def)
        + renderPromptsBlock(promptKeys, "lazy-gm-prep.secrets-clues.prompts.heading", false)
        + notesPlaceholder()
        + content;
    }
  } else {
    content = sectionDescription(def)
      + renderPromptsBlock(promptKeys, "lazy-gm-prep.secrets-clues.prompts.heading", false)
      + notesPlaceholder()
      + renderChecklist(topUpToTen([], 'Clue'));
  }
  return {
    name: game.i18n.localize(def.titleKey),
    type: 'text',
    text: { format: 1, content }
  };
}
