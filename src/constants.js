// src/constants.js

// The module’s registry key
export const MODULE_ID = "lazy-gm-prep";

// All setting keys in one place
export const SETTINGS = {
  separatePages: "separatePages",
  folderName:    "folderName",
  journalPrefix: "journalPrefix",
  pcActorTypes:  "pcActorTypes"      // NEW
};

// Default values for settings
export const DEFAULTS = {
  separatePages: true,
  folderName:    "Lazy GM Prep",
  journalPrefix: "Session",
  pcActorTypes:  "character"         // NEW: comma-separated list (e.g. "character, pc")
};
