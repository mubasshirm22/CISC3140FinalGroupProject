const { Pool } = require("pg");
require("dotenv").config();

const db = new Pool({
    connectionString: process.env.DATABASE_URL
});

db.connect()
  .then(() => {
      console.log("Connected successfully!");
      process.exit();
  })
  .catch(err => {
      console.error("Connection failed:", err);
      process.exit();
  });
