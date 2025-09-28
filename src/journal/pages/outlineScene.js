// src/journal/pages/outlineScene.js
import { notesPlaceholder } from '../helpers.js';

/**
 * Creates the "3. Outline Potential Scenes" page with:
 *  - Combined description (confidence without constraint)
 *  - "Tips for Scene Outlining" list
 *  - Three minimal scene templates
 *
 * If prevContent is provided (Copy Previous enabled and content exists),
 * we return that content instead—consistent with your other page builders.
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
  const desc = [
    "Prepping just enough to feel confident, not constrained.",
    "Use this page as your flexible, living roadmap—ready to adapt, improvise, and delight in the surprises your players bring.",
    "Jot a loose list of likely scenes—just a few words each—to gain confidence without overcommitting. Be ready to throw them away when play goes elsewhere."
  ].join(' ');

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
  const blocks = [1, 2, 3].map(n => sceneTemplateHTML(n)).join('\n');
  return `
<div class="lgmp-scenes">
  ${blocks}
</div>
`;
}

function sceneTemplateHTML(n) {
  // Lightweight, fill-in-first approach. Keep structure minimal and editable.
  const samples = {
    title: "(e.g., “Ambush at the Old Bridge”)",
    purpose: "(What is this scene for? A challenge, a clue, a turning point?)",
    elements: "(1–3 things: location, NPC, monster, secret, or twist)",
    notes: "(How might it start? What’s the vibe? What could go wrong?)"
  };

  return `
<section class="lgmp-scene">
  <h5>Scene ${n}</h5>

  <p class="lgmp-field"><strong>Scene Title:</strong> <em>${escapeHtml(samples.title)}</em></p>

  <p class="lgmp-field"><strong>Purpose:</strong> <em>${escapeHtml(samples.purpose)}</em></p>

  <div class="lgmp-field">
    <strong>Key Elements:</strong> <em>${escapeHtml(samples.elements)}</em>
    <ul class="lgmp-keylist">
      <li>&nbsp;</li>
      <li>&nbsp;</li>
      <li>&nbsp;</li>
    </ul>
  </div>

  <div class="lgmp-field">
    <strong>Loose Notes:</strong> <em>${escapeHtml(samples.notes)}</em>
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
