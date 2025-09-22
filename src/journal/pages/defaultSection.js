// src/journal/pages/defaultSection.js
import { sectionDescription, notesPlaceholder } from '../helpers.js';

export function createDefaultSectionPage(def, prevContent) {
  let content;
  if (prevContent) {
    content = prevContent.trim()
      ? prevContent
      : sectionDescription(def) + notesPlaceholder();
  } else {
    content = sectionDescription(def) + notesPlaceholder();
  }
  return {
    name: game.i18n.localize(def.titleKey),
    type: 'text',
    text: { format: 1, content }
  };
}
