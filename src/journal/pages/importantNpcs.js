// src/journal/pages/importantNpcs.js
import { sectionDescription, notesPlaceholder, importantNpcsTableHTML } from '../helpers.js';

export function createImportantNpcsPage(def, prevContent, initialRows = 5) {
  let content;
  if (prevContent) {
    content = prevContent.trim()
      ? prevContent
      : sectionDescription(def) + importantNpcsTableHTML(initialRows) + notesPlaceholder();
  } else {
    content = sectionDescription(def) + importantNpcsTableHTML(initialRows) + notesPlaceholder();
  }
  return {
    name: game.i18n.localize(def.titleKey),
    type: 'text',
    text: { format: 1, content }
  };
}
