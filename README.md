# Lazy GM Prep

**Generate session prep journals for Foundry VTT v13, inspired by Return of the Lazy Dungeon Master.**

---

## Features

- **One-click GM Prep:** Adds a "Create GM Prep" button to the Journal Directory (inline and in the header menu).
- **Session Journal Generator:** Creates a new journal for each session, auto-incremented and dated in your local timezone. Always uses the highest-numbered session as the source.
- **Smart Clue Checklist:** On the "4. Define Secrets & Clues" page, only unchecked clues are copied to the next session. Blank lines are filled with "Clue" (no numbering).
- **Direct Click-to-Toggle:** Instantly mark clues as complete (☐/☑) by clicking them in view mode—no overlay required. Changes persist automatically.
- **Overlay Panel:** Optional floating ☰ Secrets button lets you toggle clues in a pop-out panel.
- **Horizontal Rule:** Each page now includes a horizontal rule (`<hr/>`) after the description for visual clarity.
- **Configurable:** Choose your folder, journal name prefix, and whether to split prep steps into separate pages.
- **Simple & Lean:** No actor flags, no sidebar tabs—just fast, focused prep.

---

## Installation

1. **Download:**
   https://github.com/ericpetersensa/lazy-gm-prep/archive/refs/heads/main.zip
2. **Install in Foundry VTT:**
   - Go to **Add-on Modules** > **Install Module**.
   - Paste the manifest URL:
     ```
     https://raw.githubusercontent.com/ericpetersensa/lazy-gm-prep/main/module.json
     ```
   - Or upload the ZIP directly.

---

## Usage

- **Create GM Prep:**
  - Open the Journal Directory sidebar.
  - Click the **Create GM Prep** button (inline or in the header menu).
  - A new journal is created in your chosen folder, named like `Session 1: YYYY-MM-DD`.
  - The "4. Define Secrets & Clues" page will show only unchecked clues from the previous session, with blank lines labeled "Add Clue".
- **Direct Checklist Toggle:**
  - In view mode, click any clue in the checklist to mark it complete (☐/☑). Changes are saved instantly.
- **Overlay Panel:**
  - Click the ☰ Secrets button to open a floating panel for toggling clues.
- **/prep Chat Command:**
  - As GM, type `/prep` in chat to instantly create a new prep journal.
- **Settings:**
  - Access module settings to configure:
    - Folder name for journals
    - Journal name prefix (e.g., "Session")
    - Separate pages for each prep step

---

## Compatibility

- **Foundry VTT v13+**
- **AppV2-native** (uses header controls and render hooks for maximum compatibility)

---

## Support & Issues

- https://github.com/ericpetersensa/lazy-gm-prep/issues

---

## License

MIT — see LICENSE for details.

---

## Credits

- Module by Eric Petersen
- Inspired by [Return of the Lazy Dungeon Master](https://slyflourish.com/lazydm/)
