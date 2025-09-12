// src/main.js
import { registerSettings } from "./settings.js";
import { MODULE_ID } from "./constants.js";
import { createPrepJournal } from "./journal/generator.js";

/* -------------------------------------------- */
/*  Helpers to open Actors with preferred sheet */
/* -------------------------------------------- */

/** Resolve chosen sheet class from saved setting (by sheetId). */
async function resolveSheetClassById(sheetId) {
  if (!sheetId) return null;

  // Prefer using the data structures also used by DocumentSheetConfig for v13
  const types = Object.keys(CONFIG.Actor?.typeLabels ?? {});
  for (const t of types) {
    // Try to pull the constructor directly from CONFIG registrations
    const raw = CONFIG.Actor?.sheetClasses?.[t]?.[sheetId];
    if (raw?.cls) return raw.cls;
  }
  return null;
}

/**
 * Open an actor with the module's chosen sheet for a category.
 * category: "actor" | "npc" | "monster"
 */
async function openWithPreferredSheet(actor, category) {
  const key = `defaultSheet.${category}`;
  const sheetId = game.settings.get(MODULE_ID, key);
  const SheetCls = await resolveSheetClassById(sheetId);

  // Fallback: use the actor's current/default sheet
  if (!SheetCls) return actor?.sheet?.render(true);

  const app = new SheetCls(actor, { editable: actor.isOwner });
  return app.render(true);
}

/* -------------------------------------------- */
/*  Hooks                                       */
/* -------------------------------------------- */

Hooks.once("init", () => {
  console.log(`${MODULE_ID} init`);
  registerSettings();

  // Expose a tiny API for your other UI bits to reuse
  const mod = game.modules.get(MODULE_ID);
  if (mod) {
    mod.api = {
      openActor:   (actor) => openWithPreferredSheet(actor, "actor"),
      openNPC:     (actor) => openWithPreferredSheet(actor, "npc"),
      openMonster: (actor) => openWithPreferredSheet(actor, "monster")
    };
  }

  // Register keybinding: Alt+P (GM only) to create a prep journal
  game.keybindings.register(MODULE_ID, "create-prep", {
    name: "lazy-gm-prep.keybindings.createPrep.name",
    hint: "lazy-gm-prep.keybindings.createPrep.hint",
    editable: [{ key: "KeyP", modifiers: ["Alt"] }],
    onDown: () => {
      if (!game.user.isGM) return false;
      createPrepJournal();
      return true;
    },
    restricted: true
    // precedence: CONST.KEYBINDING_PRECEDENCE.NORMAL
  });
});

Hooks.once("ready", () => {
  console.log(`${MODULE_ID} ready`);
  if (game.user.isGM) {
    import("./sidebar/register-prep-tab.js")
      .then(() => {
        console.log(`${MODULE_ID} v13-native integration loaded`);
        // In case the directory rendered before our hooks registered
        ui.journal?.render(true);
      })
      .catch((err) => console.error(`${MODULE_ID} Failed to load v13 integration:`, err));
  }
});

/* -------------------------------------------- */
/*  Chat command: /prep                         */
/* -------------------------------------------- */

Hooks.on("chatMessage", (chatLog, messageText) => {
  if (!game.user.isGM) return;
  if (messageText.trim().toLowerCase() === "/prep") {
    createPrepJournal();
    return false;
  }
});
