import { PrepSidebarTab } from "./prep-tab.js";

const TAB_ID    = "prep";
const TAB_ICON  = "fas fa-clipboard-list";
const TAB_LABEL = "Prep";

Hooks.once("init", () => {
  CONFIG.ui[TAB_ID] = PrepSidebarTab;
});

Hooks.on("renderSidebar", () => {
  if (!game.user.isGM) return;

  const tabs = ui.sidebar.element.find(".tabs[data-group='sidebar']");
  if (!tabs.length) {
    console.warn(`lazy-gm-prep | Could not find sidebar tabs container.`);
    return;
  }

  // Add button if missing
  if (!tabs.find(`[data-tab='${TAB_ID}']`).length) {
    const button = $(
      `<a class="item" data-tab="${TAB_ID}" title="${TAB_LABEL}">
         <i class="${TAB_ICON}"></i> ${TAB_LABEL}
       </a>`
    );
    tabs.append(button);
    console.log(`lazy-gm-prep | ${TAB_LABEL} tab button added to sidebar.`);
  }

  // Add content pane if missing
  if (!ui.sidebar.tabs[TAB_ID]) {
    const tab = new PrepSidebarTab();
    ui.sidebar.tabs[TAB_ID] = tab;
    ui.sidebar.element.append(tab.render(true));
    console.log(`lazy-gm-prep | ${TAB_LABEL} tab content attached.`);
  }
});
