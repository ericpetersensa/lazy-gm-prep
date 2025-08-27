import { PrepSidebarTab } from "./prep-tab.js";

Hooks.once("init", () => {
  // Register our tab class
  CONFIG.ui.prep = PrepSidebarTab;
});

Hooks.once("ready", () => {
  if (!game.user.isGM) return;

  // Ask the sidebar to create and register the new tab
  const prepTab = new CONFIG.ui.prep();
  ui.sidebar.tabs.prep = prepTab;
  ui.sidebar.addTab({
    id: "prep",
    tab: prepTab,
    label: "Prep",
    icon: "fas fa-clipboard-list"
  });

  console.log("lazy-gm-prep | v13-native Prep tab registered");
});
