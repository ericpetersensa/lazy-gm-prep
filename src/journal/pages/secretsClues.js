// src/journal/pages/secretsClues.js
import { normalizeMarkers, extractModuleChecklist, topUpToTen, renderChecklist } from '../checklist.js';
import { sectionDescription, notesPlaceholder } from '../helpers.js';

export function createSecretsCluesPage(def, prevContent) {
  let content;
  if (prevContent) {
    const normalized = normalizeMarkers(prevContent);
    const { bodyWithoutChecklist, items } = extractModuleChecklist(normalized);
    const uncheckedTexts = items.filter(i => !i.checked).map(i => i.text.trim());
    const toRender = topUpToTen(uncheckedTexts, 'Clue');
    const bodyCore = bodyWithoutChecklist?.trim() ? `${bodyWithoutChecklist.trim()}\n` : '';
    content = `${bodyCore}${renderChecklist(toRender)}`;
    if (!bodyCore) content = sectionDescription(def) + notesPlaceholder() + content;
  } else {
    content = sectionDescription(def) + notesPlaceholder() + renderChecklist(topUpToTen([], 'Clue'));
  }
  return {
    name: game.i18n.localize(def.titleKey),
    type: 'text',
    text: { format: 1, content }
  };
}
