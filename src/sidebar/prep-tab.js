import { MODULE_ID } from "../constants.js";

// Pull SidebarTab from the v13 API namespace
const { SidebarTab } = foundry.applications.api;

export class PrepSidebarTab extends SidebarTab {
  static get defaultOptions() {
    return foundry.utils.mergeObject(super.defaultOptions, {
      id: "prep",
      template: `modules/${MODULE_ID}/src/sidebar/templates/prep-sidebar.html`,
      title: "Session Prep",
      icon: "fas fa-clipboard-list"
    });
  }

  getData(options) {
    const actors = game.actors.filter(a => a.isOwner && a.type === "character");
    return {
      actors: actors.map(a => ({
        id: a.id,
        name: a.name,
        img: a.img,
        spotlight: a.getFlag(MODULE_ID, "lastSpotlight") ?? "—",
        seen: a.getFlag(MODULE_ID, "lastSeen") ?? "—"
      }))
    };
  }

  activateListeners(html) {
    super.activateListeners(html);
    html.find(".lgp-actor").on("click", ev => {
      const actorId = ev.currentTarget.dataset.actorId;
      game.actors.get(actorId)?.sheet?.render(true);
    });
  }
}
