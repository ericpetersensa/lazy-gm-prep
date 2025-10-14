// src/journal/pages/relevantMonsters.js

export function createRelevantMonstersPage(def, prevContent) {
  if (prevContent && prevContent.trim()) {
    return {
      name: game.i18n.localize(def.titleKey),
      type: 'text',
      text: { format: 1, content: prevContent }
    };
  }

  // Collapsible Prompts Section
  const prompts = [
    game.i18n.localize("lazy-gm-prep.monsters.prompts.1"),
    game.i18n.localize("lazy-gm-prep.monsters.prompts.2"),
    game.i18n.localize("lazy-gm-prep.monsters.prompts.3"),
    game.i18n.localize("lazy-gm-prep.monsters.prompts.4")
  ];
  const promptsHtml = `
    <details>
      <summary><strong>${game.i18n.localize("lazy-gm-prep.prompts.heading")}</strong></summary>
      <ul>
        ${prompts.map(p => `<li>${p}</li>`).join("\n")}
      </ul>
    </details>
  `;

  // Quote Section
  const quoteHtml = `
    <blockquote style="margin-top:1em;font-style:italic;">
      ${game.i18n.localize("lazy-gm-prep.monsters.quote")}
    </blockquote>
  `;

  // Clickable URL Section
  const urlHtml = `
    <div style="margin-top:1em;">
      <a href="${game.i18n.localize("lazy-gm-prep.monize("lazy-gm-prep.monsters.url.label")}
      </a>
    </div>
  `;

  const content = promptsHtml + quoteHtml + urlHtml;

  return {
    name: game.i18n.localize(def.titleKey),
    type: 'text',
    text: { format: 1, content }
  };
}
