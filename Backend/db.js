const mysql = require("mysql2/promise");
require("dotenv").config();

const db = mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,

  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
});

//  Test DB Connection
(async () => {
  try {
    const connection = await db.getConnection();
    console.log("MySQL Connected Successfully");
    connection.release();
  } catch (err) {
    console.error("MySQL Connection Failed:");
    console.error(err.message);
  }
})();

// Function to ensure address column exists in user tables
db.ensureAddressColumn = async () => {
  const tables = ["tbemployees", "tbca", "tbcaemployees"];
  for (const table of tables) {
    try {
      const [columns] = await db.query(`SHOW COLUMNS FROM ${table} LIKE 'address'`);
      if (columns.length === 0) {
        console.log(`Adding 'address' column to ${table}...`);
        await db.query(`ALTER TABLE ${table} ADD COLUMN address TEXT AFTER pan`);
      }
    } catch (err) {
      console.error(`Error ensuring 'address' column in ${table}:`, err.message);
    }
  }
};

module.exports = db;




// db.js
// const mysql = require('mysql2/promise');

// const db = mysql.createPool({
//   // host: 'localhost',
//   // user: 'root',
//   // password: '',
//   // database: 'dbEnegix'

//   host: '185.27.134.175',
//   user: 'if0_39475678',
//   password: 'OWxmEIee5nFl',
//   database: 'if0_39475678_dbenegix'
// });

// module.exports = db;