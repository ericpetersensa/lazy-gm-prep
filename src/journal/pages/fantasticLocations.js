// src/journal/pages/fantasticLocations.js
import { renderPromptsBlock, sectionDescription } from '../helpers.js';

export function createFantasticLocationsPage(def, prevContent) {
  const title = game.i18n.localize(def.titleKey);

  // Honor "Copy previous" behavior
  if (prevContent && String(prevContent).trim()) {
    return {
      name: title,
      type: 'text',
      text: { format: 1, content: String(prevContent) }
    };
  }

  const promptKeys = [
    "lazy-gm-prep.fantastic-locations.prompts.1",
    "lazy-gm-prep.fantastic-locations.prompts.2",
    "lazy-gm-prep.fantastic-locations.prompts.3",
    "lazy-gm-prep.fantastic-locations.prompts.4",
    "lazy-gm-prep.fantastic-locations.prompts.5",
    "lazy-gm-prep.fantastic-locations.prompts.6"
  ];

  let html = '';
  // ✅ Localized page description from lang/en.json via def.descKey
  html += sectionDescription(def);

  // Optional tip (not localized unless you want a key for it)
  html += tipHTML();

  // Shared Prompts block
  html += renderPromptsBlock(promptKeys, "lazy-gm-prep.prompts.heading", false);

  // Three template blocks (like Outline Scenes)
  html += templatesHTML();

  return {
    name: title,
    type: 'text',
    text: { format: 1, content: html }
  };
}

function tipHTML() {
  const tip = "Don’t overthink it. One sentence per field is enough. If you need inspiration, roll on a random table or borrow from your favorite adventure.";
  return `
<p><em>${escapeHtml(tip)}</em></p>
`;
}

function templatesHTML() {
  const blocks = [1, 2, 3].map(n => locationTemplateHTML(n)).join('\n');
  return `
${blocks}
`;
}

function locationTemplateHTML(n) {
  return `
###### Location ${n}

Name: (Make it memorable)

Three Features: (What stands out? Scale, age, weirdness, danger, mystery)
• 
• 
• 

Who/What’s Here: (Monsters, NPCs, factions, or just a vibe)

PC Hook: (How could this matter to the party?)
`;
}

function escapeHtml(s) {
  return String(s ?? '').replace(/[&<>\"']/g, c => (
    { '&': '&', '<': '<', '>': '>', '"': '\"', "'": "'" }[c]
  ));
}
