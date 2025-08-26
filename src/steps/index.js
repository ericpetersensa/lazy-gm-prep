// src/steps/index.js

/**
 * Registry of the Lazy DM prep steps.
 * Each step has a unique key for future targeting.
 */
export const STEP_DEFS = [
  {
    key: "review-characters",
    title: "Review the Characters",
    numbered: true,
    description: "Look over PCs, notes, and recent changes."
  },
  {
    key: "strong-start",
    title: "Create a Strong Start",
    numbered: true,
    description: "Plan an exciting opening scene."
  },
  {
    key: "outline-scenes",
    title: "Outline Potential Scenes",
    numbered: true,
    description: "List possible scenes that could occur."
  },
  {
    key: "secrets-clues",
    title: "Define Secrets & Clues",
    numbered: true,
    description: "Prep hidden information for the players to discover."
  },
  {
    key: "fantastic-locations",
    title: "Develop Fantastic Locations",
    numbered: true,
    description: "Design memorable locations for the session."
  },
  {
    key: "important-npcs",
    title: "Outline Important NPCs",
    numbered: true,
    description: "List key NPCs with goals and motivations."
  },
  {
    key: "choose-monsters",
    title: "Choose Relevant Monsters",
    numbered: true,
    description: "Pick monsters that fit the session’s themes."
  },
  {
    key: "magic-item-rewards",
    title: "Select Magic Item Rewards",
    numbered: true,
    description: "Add magic items or loot to be found."
  },
  {
    key: "other-notes",
    title: "Other Notes",
    numbered: false,
    description: "Miscellaneous notes, reminders, or ideas."
  }
];
