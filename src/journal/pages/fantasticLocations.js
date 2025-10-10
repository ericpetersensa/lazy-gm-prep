// src/journal/pages/fantasticLocations.js
import { renderPromptsBlock } from '../helpers.js';

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
  html += descriptionHTML();
  html += renderPromptsBlock(promptKeys, "lazy-gm-prep.prompts.heading", false);
  html += templatesHTML();

  return {
    name: title,
    type: 'text',
    text: { format: 1, content: html }
  };
}

function descriptionHTML() {
  const desc =
    "Give each place a bold, evocative name and jot down a few striking features—think scale, age, or weirdness. These become memorable backdrops you can drop in anytime. Focus on what makes each location unique, what’s happening there now, and how it might connect to your PCs. That’s it—keep it simple, keep it fantastic.\n\n" +
    "Tip: Don’t overthink it. One sentence per field is enough. If you need inspiration, roll on a random table or borrow from your favorite adventure.";
  return `
${escapeHtml(desc)}
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
