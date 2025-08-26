export function registerSettings() {
  game.settings.register("lazy-gm-prep", "separatePages", {
    name: "Separate Pages for Each Step",
    hint: "If enabled, create one page per prep step; otherwise combine all steps into one page.",
    scope: "world",
    config: true,
    default: true,
    type: Boolean
  });
}
