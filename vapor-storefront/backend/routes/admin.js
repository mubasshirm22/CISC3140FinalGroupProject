const express = require("express");
const router = express.Router();
const db = require("../db/db.js");
const requireAdmin = require("../middleware/requireAdmin");

// All routes here require admin
router.use(requireAdmin);

// GET all products
router.get("/products", async (req, res) => {
  const result = await db.query("SELECT * FROM products ORDER BY product_id ASC");
  res.json(result.rows);
});

// CREATE product
router.post("/products", async (req, res) => {
  const { name, price, description, image_url, genre, min_specs, is_dlc, vapor_score } = req.body;

  if (!name || price == null) {
    return res.status(400).json({ error: "Name and price are required" });
  }

  const result = await db.query(
    `INSERT INTO products (name, price, description, image_url, genre, min_specs, is_dlc, vapor_score)
     VALUES ($1, $2, $3, $4, $5, $6, COALESCE($7, false), COALESCE($8, 70))
     RETURNING *`,
    [name, price, description, image_url, genre || null, min_specs || null, is_dlc, vapor_score]
  );

  res.json(result.rows[0]);
});

router.get("/products/:id", requireAdmin, async (req, res) => {
  const { id } = req.params;

  try {
    const result = await db.query(
      "SELECT * FROM products WHERE product_id = $1",
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Product not found" });
    }

    res.json(result.rows[0]);
  } catch (err) {
    console.error("Error loading product:", err);
    res.status(500).json({ error: "Failed to load product" });
  }
});

// UPDATE product
router.put("/products/:id", async (req, res) => {
  const { id } = req.params;
  const { name, price, description, image_url, genre, min_specs, is_dlc, vapor_score } = req.body;

  const result = await db.query(
    `UPDATE products
     SET name = $1,
         price = $2,
         description = $3,
         image_url = $4,
         genre = $5,
         min_specs = $6,
         is_dlc = COALESCE($7, is_dlc),
         vapor_score = COALESCE($8, vapor_score)
     WHERE product_id = $9
     RETURNING *`,
    [name, price, description, image_url, genre || null, min_specs || null, is_dlc, vapor_score, id]
  );

  if (result.rows.length === 0) {
    return res.status(404).json({ error: "Product not found" });
  }

  res.json(result.rows[0]);
});

// DELETE product
router.delete("/products/:id", async (req, res) => {
  const { id } = req.params;

  await db.query("DELETE FROM products WHERE product_id = $1", [id]);
  res.json({ success: true });
});

module.exports = router;
