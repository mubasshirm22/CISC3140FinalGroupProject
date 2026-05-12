const express = require("express");
const router = express.Router();

const db = require("../db/db.js");

// Products
router.get("/products", async (req, res) => {
  try {
    const result = await db.query(
      "SELECT * FROM products ORDER BY name"
    );
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({error:"Failed to load products"});
  }
});

// Search 
router.get("/search", async (req, res) => {
  const { q } = req.query;
  try {

    const result = await db.query(
      "SELECT * FROM products WHERE name ILIKE $1 ORDER BY name",
      [`%${q}%`]
    );
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({
      error: "Search failed"
    });
  }
});


module.exports = router;