// src/journal/pages/outlineScene.js
import { notesPlaceholder } from '../helpers.js';

/**
 * Creates the "3. Outline Potential Scenes" page with:
 *  - Shortened description
 *  - "Tips for Scene Outlining" list
 *  - Three minimal scene templates (Title & Purpose on own lines, no "Scene" label)
 */
export function createOutlineScenesPage(def, prevContent) {
  const title = game.i18n.localize(def.titleKey);

  // If copying previous content, prefer it exactly as saved
  if (prevContent && String(prevContent).trim()) {
    return {
      name: title,
      type: 'text',
      text: { format: 1, content: String(prevContent) }
    };
  }

  let html = '';
  html += descriptionHTML();
  html += tipsHTML();
  html += templatesHTML();

  return {
    name: title,
    type: 'text',
    text: { format: 1, content: html }
  };
}

function descriptionHTML() {
  const desc =
    "Use this page as your flexible, living roadmap—ready to adapt, improvise, and delight in the surprises your players bring. Prep just enough to feel confident, not constrained, and without overcommitting. Be ready to throw them away when play goes elsewhere.";
  return `
<p class="lgmp-step-desc">${escapeHtml(desc)}</p>
<hr>
`;
}

function tipsHTML() {
  const heading = "Tips for Scene Outlining";
  const tips = [
    "Aim for 1–2 scenes per hour of play.",
    "Mix up types: include social, exploration, and combat scenes.",
    "Don’t overcommit: three scenes are enough to feel ready.",
    "Be ready to skip or swap scenes as play evolves."
  ];

  const lis = tips.map(t => `<li>${escapeHtml(t)}</li>`).join('\n');

  return `
<h4>${escapeHtml(heading)}</h4>
<ul class="lgmp-prompts">
${lis}
</ul>
<hr>
`;
}

function templatesHTML() {
  const blocks = [1, 2, 3].map(() => sceneTemplateHTML()).join('\n');
  return `
<div class="lgmp-scenes">
  ${blocks}
</div>
`;
}

function sceneTemplateHTML() {
  // Title and Purpose on their own lines, no "Scene" label
  return `
<section class="lgmp-scene">
  <p class="lgmp-field"><strong>Title:</strong> <em>(e.g., “Ambush at the Old Bridge”)</em></p>
  <p class="lgmp-field"><strong>Purpose:</strong> <em>(What is this scene for? A challenge, a clue, a turning point?)</em></p>
  <div class="lgmp-field">
    <strong>Key Elements:</strong> <em>(1–3 things: location, NPC, monster, secret, or twist)</em>
    <ul class="lgmp-keylist">
      <li>&nbsp;</li>
      <li>&nbsp;</li>
      <li>&nbsp;</li>
    </ul>
  </div>
  <div class="lgmp-field">
    <strong>Loose Notes:</strong> <em>(How might it start? What’s the vibe? What could go wrong?)</em>
    ${notesPlaceholder()}
  </div>
</section>
`;
}

function escapeHtml(s) {
  return String(s ?? '').replace(/[&<>\"']/g, c => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
  })[c]);
}
