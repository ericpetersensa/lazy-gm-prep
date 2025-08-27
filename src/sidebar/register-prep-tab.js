import { MODULE_ID } from "../constants.js";

const TAB_ID    = "prep";
const TAB_ICON  = "fas fa-clipboard-list";
const TAB_LABEL = "Prep";
const TEMPLATE  = `modules/${MODULE_ID}/src/sidebar/templates/prep-sidebar.html`;

/**
 * Render the prep panel content and wire listeners.
 */
async function renderPrepPanel(panel) {
  const actors = game.actors?.filter(a => a?.isOwner && a.type === "character") ?? [];
  const data = {
    actors: actors.map(a => ({
      id: a.id,
      name: a.name,
      img: a.img,
      spotlight: a.getFlag(MODULE_ID, "lastSpotlight") ?? "—",
      seen: a.getFlag(MODULE_ID, "lastSeen") ?? "—"
    }))
  };

  const html = await renderTemplate(TEMPLATE, data);
  panel.html(html);

  // Open sheet on click
  panel.find(".lgp-actor").on("click", ev => {
    const actorId = ev.currentTarget.dataset.actorId;
    game.actors.get(actorId)?.sheet?.render(true);
  });
}

/**
 * Ensure the nav button and panel exist, then render content.
 */
async function ensurePrepMounted() {
  if (!game.user.isGM) return;
  const sidebar = ui.sidebar?.element;
  if (!sidebar?.length) return;

  // 1) Ensure the nav button exists
  const tabs = sidebar.find(".tabs[data-group='sidebar']");
  if (!tabs.length) return;

  if (!tabs.find(`[data-tab='${TAB_ID}']`).length) {
    const button = $(
      `<a class="item" data-tab="${TAB_ID}" title="${TAB_LABEL}">
         <i class="${TAB_ICON}"></i> ${TAB_LABEL}
       </a>`
    );
    tabs.append(button);

    // Fallback activation handler
    tabs.on("click", `a.item[data-tab='${TAB_ID}']`, ev => {
      ev.preventDefault();
      // Set active state on nav
      tabs.find("a.item").removeClass("active");
      $(ev.currentTarget).addClass("active");
      // Toggle panels
      sidebar.find(".tab").removeClass("active");
      sidebar.find(`.tab[data-tab='${TAB_ID}']`).addClass("active");
    });
  }

  // 2) Ensure the panel exists
  let panel = sidebar.find(`.tab[data-tab='${TAB_ID}']`);
  if (!panel.length) {
    panel = $(`<div class="tab" data-tab="${TAB_ID}"></div>`);
    sidebar.append(panel);
  }

  // 3) Render content
  await renderPrepPanel(panel);

  console.log(`${MODULE_ID} | Prep tab mounted`);
}

// Mount once on ready (in case sidebar already rendered), and on every sidebar render.
Hooks.once("ready", ensurePrepMounted);
Hooks.on("renderSidebar", ensurePrepMounted);
