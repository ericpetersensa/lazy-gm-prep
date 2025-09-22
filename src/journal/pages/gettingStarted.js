// src/journal/pages/gettingStarted.js
export function createGettingStartedPage() {
  return {
    name: game.i18n.localize('lazy-gm-prep.getting-started.title'),
    type: 'text',
    text: {
      format: 1,
      content: gettingStartedBodyHTML({ prefix: 'Session' })
    }
  };
}

function gettingStartedBodyHTML({ prefix }) {
  // ... (copy the HTML generation logic from your original generator.js)
}
