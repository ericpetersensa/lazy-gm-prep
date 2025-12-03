
// src/journal/pages/outlineScene.js

import {
  notesPlaceholder,
  renderPromptsBlock
} from '../helpers.js';

export function createOutlineScenesPage(def, prevContent) {
  const title = game.i18n.localize(def.titleKey);

  // Description section
  const desc = "Use this page as your flexible, living roadmap—ready to adapt, improvise, and delight in the surprises your players bring. Prep just enough to feel confident, not constrained, and without overcommitting. Be ready to throw them away when play goes elsewhere.";
  let html = `<div class="lgmp-section">${escapeHtml(desc)}</div>`;

  // Prompts section (collapsed by default)
  const promptKeys = [
    "lazy-gm-prep.outline-scenes.prompts.1",
    "lazy-gm-prep.outline-scenes.prompts.2",
    "lazy-gm-prep.outline-scenes.prompts.3",
    "lazy-gm-prep.outline-scenes.prompts.4"
  ];
  html += renderPromptsBlock(promptKeys, "lazy-gm-prep.prompts.heading", false);

  // Scenes section (open by default)
  html += `
    <details class="lgmp-scenes-block" open>
      <summary>${game.i18n.localize("lazy-gm-prep.outline-scenes.heading") || "Scenes"}</summary>
      <div class="lgmp-scenes">
        ${buildScenesHTML(prevContent, 3)}
      </div>
    </details>
  `;

  return { name: title, type: 'text', text: { format: 1, content: html } };
}

/** Build Scenes HTML by carrying over non-done from prevContent, then add blanks to reach minCount */
function buildScenesHTML(prevContent, minCount = 3) {
  const kept = extractNonDoneScenes(prevContent);
  const cards = kept.length ? kept.map((html, i) => renumberScene(html, i + 1)) : [];
  const needed = Math.max(0, minCount - cards.length);

  for (let i = 0; i < needed; i++) {
    cards.push(sceneCardHTML(cards.length + 1));
  }
  return cards.join("\n");
}

/** Extract scenes from previous content, return only those NOT checked (done=false) */
function extractNonDoneScenes(prevContent) {
  if (!prevContent || !String(prevContent).trim()) return [];

  // Parse reliably using DOMParser
  const doc = new DOMParser().parseFromString(String(prevContent), "text/html");
  const sceneNodes = Array.from(doc.querySelectorAll(".lgmp-scene"));

  // Keep scenes whose checklist marker is NOT checked
  const keep = sceneNodes.filter(node => {
    const li = node.querySelector("ul.lgmp-checklist li");
    return li && !/^☑/.test(li.textContent.trim());
  });

  // Return raw HTML for each kept scene node
  return keep.map(node => node.outerHTML);
}

/** Renumber an existing scene card's label to the provided number */
function renumberScene(sceneHtml, num) {
  return sceneHtml.replace(/(<span[^>]*class="lgmp-label"[^>]*>)(Scene\s*)(\d+)(<\/span>)/i, `$1$2${num}$4`);
}

/** Fresh blank scene card with checklist-style Done marker (unchecked by default) */
function sceneCardHTML(n) {
  const labelScenes = game.i18n.localize("lazy-gm-prep.outline-scenes.label.scene") || "Scene";
  return `
    <div class="lgmp-scene">
      <ul class="lgmp-checklist">
        <li>☐ Done</li>
      </ul>
      <span class="lgmp-label">${escapeHtml(labelScenes)} ${n}</span>
      <div class="lgmp-field">
        <strong>Title:</strong>
        <div class="lgmp-card-fill">(e.g., “Ambush at the Old Bridge”)</div>
      </div>
      <div class="lgmp-field">
        <strong>Purpose:</strong>
        <div class="lgmp-card-fill">(What is this scene for? A challenge, a clue, a turning point?)</div>
      </div>
      <div class="lgmp-field">
        <strong>Key Elements:</strong>
        <div class="lgmp-card-fill">(1–3 things: location, NPC, monster, secret, or twist)</div>
      </div>
      <div class="lgmp-field">
        <strong>Loose Notes:</strong>
        <div class="lgmp-card-fill">(How might it start? What’s the vibe? What could go wrong?)</div>
        ${notesPlaceholder()}
      </div>
    </div>
  `;
}

function escapeHtml(s) {
  return String(s ?? '').replace(/[&<>"']/g, c => (
    { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]
  ));
}
