import { PrepSidebarTab } from "./prep-tab.js";

const TAB_ID    = "prep";
const TAB_ICON  = "fas fa-clipboard-list";
const TAB_LABEL = "Prep";

Hooks.once("init", () => {
  CONFIG.ui[TAB_ID] = PrepSidebarTab;
});

Hooks.once("ready", () => {
  if (!game.user.isGM) return;

  if (!ui?.sidebar?.element) {
    console.warn(`lazy-gm-prep | Sidebar UI not ready, cannot attach ${TAB_LABEL} tab.`);
    return;
  }

  const tabs = ui.sidebar.element.find(".tabs[data-group='sidebar']");
  if (tabs.length && !tabs.find(`[data-tab='${TAB_ID}']`).length) {
    const button = $(
      `<a class="item" data-tab="${TAB_ID}">
        <i class="${TAB_ICON}"></i> ${TAB_LABEL}
       </a>`
    );
    tabs.append(button);
  }

  if (!ui.sidebar.tabs[TAB_ID]) {
    const tab = new PrepSidebarTab();
    ui.sidebar.tabs[TAB_ID] = tab;
    ui.sidebar.element.append(tab.render(true));
  }
});
