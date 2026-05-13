const express = require("express");
const router = express.Router();

const db = require("../db/db");
const authMiddleware = require("../middleware/authMiddleware");

function isUuid(value) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(String(value || ""));
}


// ADD TO CART
router.post("/add", authMiddleware, async (req, res) => {
  const { product_id } = req.body;

  try {
    if (!isUuid(product_id)) {
      return res.status(400).json({ error: "Invalid product_id" });
    }

    const customer = await db.query(
      `SELECT 1 FROM customers WHERE customer_id = $1`,
      [req.customer_id]
    );

    if (customer.rows.length === 0) {
      return res.status(401).json({ error: "Session is invalid. Please sign in again." });
    }

    const product = await db.query(
      `SELECT 1 FROM products WHERE product_id = $1`,
      [product_id]
    );

    if (product.rows.length === 0) {
      return res.status(404).json({ error: "Product not found" });
    }

    await db.query(`
      INSERT INTO cart_items (customer_id, product_id, quantity)
      VALUES ($1, $2, 1)
      ON CONFLICT (customer_id, product_id)
      DO UPDATE SET quantity = cart_items.quantity + 1
    `, [req.customer_id, product_id]);

    res.json({ message: "Added to cart" });
  } catch (err) {
    console.error("Cart add error:", err);
    res.status(500).json({ error: "Failed to add item to cart" });
  }
});


// GET USER CART
router.get("/", authMiddleware, async (req, res) => {
  try {
    const result = await db.query(`
      SELECT ci.quantity, p.*
      FROM cart_items ci
      JOIN products p ON p.product_id = ci.product_id
      WHERE ci.customer_id = $1
    `, [req.customer_id]);

    res.json(result.rows);
  } catch (err) {
    console.error("Cart load error:", err);
    res.status(500).json({ error: "Failed to load cart" });
  }
});


// REMOVE FROM CART
router.post("/remove", authMiddleware, async (req, res) => {
  const { product_id } = req.body;

  try {
    if (!isUuid(product_id)) {
      return res.status(400).json({ error: "Invalid product_id" });
    }

    await db.query(`
      DELETE FROM cart_items
      WHERE customer_id = $1 AND product_id = $2
    `, [req.customer_id, product_id]);

    res.json({ message: "Removed" });
  } catch (err) {
    console.error("Cart remove error:", err);
    res.status(500).json({ error: "Failed to remove item from cart" });
  }
});


module.exports = router;