const db = require("./db");

async function migrate() {
  try {
    const commands = [
      "ALTER TABLE stock_units ADD COLUMN type VARCHAR(20) DEFAULT 'Simple';",
      "ALTER TABLE stock_units ADD COLUMN formalName VARCHAR(100);",
      "ALTER TABLE stock_units ADD COLUMN decimalPlaces INT DEFAULT 2;",
      "ALTER TABLE stock_units ADD COLUMN firstUnit VARCHAR(50);",
      "ALTER TABLE stock_units ADD COLUMN conversionFactor DECIMAL(10,3);",
      "ALTER TABLE stock_units ADD COLUMN secondUnit VARCHAR(50);"
    ];

    for (const cmd of commands) {
      try {
        await db.query(cmd);
        console.log("Success:", cmd);
      } catch (e) {
        console.log("Error or already exists:", e.message);
      }
    }
  } catch (err) {
    console.error(err);
  } finally {
    process.exit(0);
  }
}
migrate();
