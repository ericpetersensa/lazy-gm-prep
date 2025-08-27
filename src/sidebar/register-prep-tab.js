import { PrepSidebarTab } from "./prep-tab.js";

const TAB_ID = "prep";
const TAB_ICON = "fas fa-clipboard-list";
const TAB_LABEL = "Prep";

Hooks.once("init", () => {
  // Register the tab class with Foundry's UI registry
  CONFIG.ui[TAB_ID] = PrepSidebarTab;
});

Hooks.once("ready", () => {
  // GM-only during PoC
  if (!game.user.isGM) return;

  // Avoid duplicate buttons
  const tabs = ui.sidebar.element.find(".tabs[data-group='sidebar']");
  if (tabs.find(`[data-tab='${TAB_ID}']`).length === 0) {
    const button = $(
      `<a class="item" data-tab="${TAB_ID}" id="lgp-${TAB_ID}-tab">
         <i class="${TAB_ICON}"></i> ${TAB_LABEL}
       </a>`
    );
    tabs.append(button);
  }

  // Create and attach the tab content once
  if (!ui.sidebar.tabs[TAB_ID]) {
    const tab = new PrepSidebarTab();
    ui.sidebar.tabs[TAB_ID] = tab;
    ui.sidebar.element.append(tab.render(true));
  }
});
