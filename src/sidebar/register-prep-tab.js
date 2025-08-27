import { PrepSidebarTab } from "./prep-tab.js";

const TAB_ID    = "prep";
const TAB_ICON  = "fas fa-clipboard-list";
const TAB_LABEL = "Prep";

/**
 * Register and attach the Prep sidebar tab (PoC)
 * Wrapped in hooks to avoid early evaluation issues.
 */
Hooks.once("init", () => {
  // Register the tab class so Foundry knows about it
  CONFIG.ui[TAB_ID] = PrepSidebarTab;
});

Hooks.once("ready", () => {
  // GM-only for PoC
  if (!game.user.isGM) return;

  // Ensure ui.sidebar exists before touching it
  if (!ui?.sidebar?.element) {
    console.warn(`lazy-gm-prep | Sidebar UI not ready, cannot attach ${TAB_LABEL} tab.`);
    return;
  }

  // Add tab button if it doesn't already exist
  const tabs = ui.sidebar.element.find(".tabs[data-group='sidebar']");
  if (tabs.length && !tabs.find(`[data-tab='${TAB_ID}']`).length) {
    const button = $(
      `<a class="item" data-tab="${TAB_ID}">
        <i class="${TAB_ICON}"></i> ${TAB_LABEL}
       </a>`
    );
    tabs.append(button);
  }

  // Create and attach the tab content if it doesn't already exist
  if (!ui.sidebar.tabs[TAB_ID]) {
    const tab = new PrepSidebarTab();
    ui.sidebar.tabs[TAB_ID] = tab;
    ui.sidebar.element.append(tab.render(true));
  }
});
