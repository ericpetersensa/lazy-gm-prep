// src/roll/start.js

export async function rollTwiceOnColorTableAndDisplay(sheet) {
  // Get the RollTable by name
  const table = game.tables.getName("Color");
  if (!table) {
    ui.notifications.error(`RollTable "Color" not found.`);
    return;
  }

  // Roll twice
  const roll1 = await table.draw();
  const roll2 = await table.draw();

  // Get results
  const result1 = roll1.results[0].text;
  const result2 = roll2.results[0].text;

  // Find the result container below the button
  const resultDiv = sheet.element.find("#strong-start-color-result");
  if (resultDiv.length) {
    resultDiv.html(
      `<b>Color Results:</b><br>1. ${result1}<br>2. ${result2}`
    );
  }
}
