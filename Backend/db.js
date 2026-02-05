// db.js
const mysql = require("mysql2/promise");
require("dotenv").config(); // 👈 VERY IMPORTANT

const db = mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD, // 👈 from .env
  database: process.env.DB_NAME,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

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