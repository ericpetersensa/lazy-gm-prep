// src/journal/links.js
import { extractActorSummary, renderActorListItem } from "./extract.js";

/** helpers to rebuild a section on refresh */
function localizedTypeLabel(typeKey) {
  const raw = CONFIG.Actor?.typeLabels?.[typeKey] ?? typeKey;
  return game.i18n.localize(String(raw));
}

function headerWithDesc(stepKey, typeKey /* optional */) {
  const titleKey = {
    "review-characters": "lazy-gm-prep.steps.review-characters.title",
    "strong-start":      "lazy-gm-prep.steps.strong-start.title",
    "outline-scenes":    "lazy-gm-prep.steps.outline-scenes.title",
    "secrets-clues":     "lazy-gm-prep.steps.secrets-clues.title",
    "fantastic-locations":"lazy-gm-prep.steps.fantastic-locations.title",
    "important-npcs":    "lazy-gm-prep.steps.important-npcs.title",
    "choose-monsters":   "lazy-gm-prep.steps.choose-monsters.title",
    "magic-item-rewards":"lazy-gm-prep.steps.magic-item-rewards.title",
    "other-notes":       "lazy-gm-prep.steps.other-notes.title"
  }[stepKey];

  const descKey = {
    "review-characters": "lazy-gm-prep.steps.review-characters.description",
    "strong-start":      "lazy-gm-prep.steps.strong-start.description",
    "outline-scenes":    "lazy-gm-prep.steps.outline-scenes.description",
    "secrets-clues":     "lazy-gm-prep.steps.secrets-clues.description",
    "fantastic-locations":"lazy-gm-prep.steps.fantastic-locations.description",
    "important-npcs":    "lazy-gm-prep.steps.important-npcs.description",
    "choose-monsters":   "lazy-gm-prep.steps.choose-monsters.description",
    "magic-item-rewards":"lazy-gm-prep.steps.magic-item-rewards.description",
    "other-notes":       "lazy-gm-prep.steps.other-notes.description"
  }[stepKey];

  const title = game.i18n.localize(titleKey);
  const desc  = game.i18n.localize(descKey);
  const typeSuffix = typeKey ? ` <small style="opacity:.7">[${localizedTypeLabel(typeKey)}]</small>` : "";
  const refreshBtn = (stepKey === "review-characters" || stepKey === "important-npcs" || stepKey === "choose-monsters")
    ? `<button type="button" class="lgmp-refresh" data-lgmp-refresh>⟲ ${game.i18n.localize("Refresh") || "Refresh"}</button>`
    : "";

  return `
  <div class="lgmp-header">
    <h2 style="margin:0">${title}${typeSuffix}</h2>
    ${refreshBtn}
  </div>
  <p class="lgmp-step-desc">${desc}</p>`;
}

function buildActorListSection(cat, typeKey) {
  const actors = (game.actors?.filter(a => a.type === typeKey) ?? []);
  const listItems = actors
    .map(a => extractActorSummary(a))
    .map(sum => renderActorListItem(sum, cat))
    .join("\n");
  const empty = `<li class="lgmp-empty"><em>(none found for type ${typeKey})</em></li>`;
  return `
  <section class="lgmp-section lgmp-${cat}">
    <ul class="lgmp-actor-list">
      ${listItems || empty}
    </ul>
  </section>`;
}

/* ------------- Hook: open preferred sheet + refresh ------------- */

Hooks.on("renderJournalPageSheet", (app, html) => {
  // Open with Preferred Sheet (names are anchors with data-lazy-open)
  html.on("click", "[data-lazy-open]", async (ev) => {
    ev.preventDefault();
    const el = ev.currentTarget;
    const category = el.getAttribute("data-lazy-open");   // "actor" | "npc" | "monster"
    const actorId  = el.getAttribute("data-actor-id");
    const actor = game.actors.get(actorId);
    if (!actor) return;

    const api = game.modules.get("lazy-gm-prep")?.api;
    if (!api) return actor.sheet?.render(true);

    switch (category) {
      case "actor":   return api.openActor(actor);
      case "npc":     return api.openNPC(actor);
      case "monster": return api.openMonster(actor);
      default:        return actor.sheet?.render(true);
    }
  });

  // Refresh a dynamic page (Actor/NPC/Monster)
  html.on("click", "[data-lgmp-refresh]", async (ev) => {
    ev.preventDefault();
    const page = app.object; // JournalPage
    // category & typeKey stored at creation time
    const flags = page.getFlag("lazy-gm-prep") || {};
    const category = flags.category;
    const typeKey  = flags.typeKey;

    // Map flags back to step key for header/desc
    const stepKey = ({
      "actor":   "review-characters",
      "npc":     "important-npcs",
      "monster": "choose-monsters"
    })[category];

    if (!category || !typeKey || !stepKey)
      return ui.notifications?.warn("Missing refresh context.");

    const content = headerWithDesc(stepKey, typeKey) + buildActorListSection(category, typeKey);
    await page.update({ text: { content } });
    ui.notifications?.info("Section refreshed.");
  });
});
