const express = require("express");
const router = express.Router();

const db = require("../db/db");
const authMiddleware = require("../middleware/authMiddleware");


// ADD TO CART
router.post("/add", authMiddleware, async (req, res) => {
  const { product_id } = req.body;

  await db.query(`
    INSERT INTO cart_items (customer_id, product_id, quantity)
    VALUES ($1, $2, 1)
    ON CONFLICT (customer_id, product_id)
    DO UPDATE SET quantity = cart_items.quantity + 1
  `, [req.customer_id, product_id]);

  res.json({ message: "Added to cart" });
});


// GET USER CART
router.get("/", authMiddleware, async (req, res) => {
  const result = await db.query(`
    SELECT ci.quantity, p.*
    FROM cart_items ci
    JOIN products p ON p.product_id = ci.product_id
    WHERE ci.customer_id = $1
  `, [req.customer_id]);

  res.json(result.rows);
});


// REMOVE FROM CART
router.post("/remove", authMiddleware, async (req, res) => {
  const { product_id } = req.body;

  await db.query(`
    DELETE FROM cart_items
    WHERE customer_id = $1 AND product_id = $2
  `, [req.customer_id, product_id]);

  res.json({ message: "Removed" });
});


module.exports = router;