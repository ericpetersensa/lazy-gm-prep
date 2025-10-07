// src/journal/pages/secretsClues.js
import { normalizeMarkers, extractModuleChecklist, topUpToTen, renderChecklist } from '../checklist.js';
import { sectionDescription, notesPlaceholder, secretsPromptsHTML } from '../helpers.js';

export function createSecretsCluesPage(def, prevContent) {
  let content;

  if (prevContent) {
    const normalized = normalizeMarkers(prevContent);
    const { bodyWithoutChecklist, items } = extractModuleChecklist(normalized);

    // Carry forward ONLY unchecked clues
    const uncheckedTexts = items.filter(i => !i.checked).map(i => i.text.trim());
    const toRender = topUpToTen(uncheckedTexts, 'Clue');

    const bodyCore = bodyWithoutChecklist?.trim() ? `${bodyWithoutChecklist.trim()}\n` : '';
    content = `${bodyCore}${renderChecklist(toRender)}`;

    // If there was no prior body (just a checklist), add desc + Prompts + notes
    if (!bodyCore) {
      content = sectionDescription(def) + secretsPromptsHTML() + notesPlaceholder() + content;
    }
  } else {
    // New page: description + Prompts + notes + empty checklist (10 placeholders)
    content = sectionDescription(def)
      + secretsPromptsHTML()
      + notesPlaceholder()
      + renderChecklist(topUpToTen([], 'Clue'));
  }

  return {
    name: game.i18n.localize(def.titleKey),
    type: 'text',
    text: { format: 1, content }
  };
}
