// src/journal/links.js
Hooks.on("renderJournalPageSheet", (app, html) => {
  html.on("click", "[data-lazy-open]", async (ev) => {
    ev.preventDefault();
    const el = ev.currentTarget;
    const category = el.getAttribute("data-lazy-open");   // "actor" | "npc" | "monster"
    const actorId  = el.getAttribute("data-actor-id");
    const actor = game.actors.get(actorId);
    if (!actor) return;

    const api = game.modules.get("lazy-gm-prep")?.api;
    if (!api) return actor.sheet?.render(true);

    if (category === "actor")   return api.openActor(actor);
    if (category === "npc")     return api.openNPC(actor);
    if (category === "monster") return api.openMonster(actor);
    return actor.sheet?.render(true);
  });
});
