// src/constants.js
// The module’s registry key
export const MODULE_ID = "lazy-gm-prep";

// All setting keys in one place
export const SETTINGS = {
  separatePages: "separatePages",
  folderName: "folderName",
  journalPrefix: "journalPrefix",
  pcActorTypes: "pcActorTypes", // kept for future use (system-agnostic)
  initialCharacterRows: "initialCharacterRows" // NEW: default rows in Characters table
};

// Default values for settings
export const DEFAULTS = {
  separatePages: true,
  folderName: "Lazy GM Prep",
  journalPrefix: "Session",
  pcActorTypes: "character", // comma-separated list (e.g., "character, pc")
  initialCharacterRows: 5
};
