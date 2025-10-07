// src/journal/pages/outlineScene.js
import { notesPlaceholder, renderPromptsBlock } from '../helpers.js';

export function createOutlineScenesPage(def, prevContent) {
  const title = game.i18n.localize(def.titleKey);

  if (prevContent && String(prevContent).trim()) {
    return { name: title, type: 'text', text: { format: 1, content: String(prevContent) } };
    }

  const promptKeys = [
    "lazy-gm-prep.outline-scenes.prompts.1",
    "lazy-gm-prep.outline-scenes.prompts.2",
    "lazy-gm-prep.outline-scenes.prompts.3",
    "lazy-gm-prep.outline-scenes.prompts.4"
  ];

  let html = '';
  html += descriptionHTML();
  html += renderPromptsBlock(promptKeys, "lazy-gm-prep.prompts.heading", true);
  html += templatesHTML();

  return { name: title, type: 'text', text: { format: 1, content: html } };
}

function descriptionHTML() {
  const desc = "Use this page as your flexible, living roadmap—ready to adapt, improvise, and delight in the surprises your players bring. Prep just enough to feel confident, not constrained, and without overcommitting. Be ready to throw them away when play goes elsewhere.";
  return `
${escapeHtml(desc)}
`;
}

function templatesHTML() {
  const blocks = [1, 2, 3].map(n => sceneTemplateHTML(n)).join('\n');
  return `
${blocks}
`;
}

function sceneTemplateHTML(n) {
  return `
###### Scene ${n}

Title:
(e.g., “Ambush at the Old Bridge”)

Purpose:
(What is this scene for? A challenge, a clue, a turning point?)

Key Elements: (1–3 things: location, NPC, monster, secret, or twist)
- 
- 
- 

Loose Notes: (How might it start? What’s the vibe? What could go wrong?)
${notesPlaceholder()}
`;
}

function escapeHtml(s) {
  return String(s ?? '').replace(/[&<>"']/g, c => (
    { '&': '&', '<': '<', '>': '>', '"': "\"", "'": "'" }[c]
  ));
}
