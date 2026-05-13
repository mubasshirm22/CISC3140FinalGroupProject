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
  const { name, price, description, image_url } = req.body;

  const result = await db.query(
    `INSERT INTO products (name, price, description, image_url)
     VALUES ($1, $2, $3, $4)
     RETURNING *`,
    [name, price, description, image_url]
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
  const { name, price, description, image_url } = req.body;

  const result = await db.query(
    `UPDATE products
     SET name = $1, price = $2, description = $3, image_url = $4
     WHERE product_id = $5
     RETURNING *`,
    [name, price, description, image_url, id]
  );

  res.json(result.rows[0]);
});

// DELETE product
router.delete("/products/:id", async (req, res) => {
  const { id } = req.params;

  await db.query("DELETE FROM products WHERE product_id = $1", [id]);
  res.json({ success: true });
});

module.exports = router;

// GET ALL ORDERS
router.get("/orders", async (req, res) => {
  const result = await db.query(`
    SELECT o.*, c.display_name
    FROM orders o
    JOIN customers c ON c.customer_id = o.customer_id
    ORDER BY o.order_date DESC
  `);

  res.json(result.rows);
});

// GET ORDER DETAILS
router.get("/orders/:id", async (req, res) => {
  const { id } = req.params;

  const order = await db.query(`
    SELECT o.*, c.display_name
    FROM orders o
    JOIN customers c ON c.customer_id = o.customer_id
    WHERE o.order_id = $1
  `, [id]);

  const items = await db.query(`
    SELECT oi.*, p.name, p.image_url
    FROM order_items oi
    JOIN products p ON p.product_id = oi.product_id
    WHERE oi.order_id = $1
  `, [id]);

  res.json({
    order: order.rows[0],
    items: items.rows
  });
});

//GET THEM USERS TOO!
router.get("/users", async (req, res) => {
  try {
    const result = await db.query(`
      SELECT 
        c.customer_id,
        c.display_name,
        c.email,
        c.is_admin,
        c.created_at,
        COUNT(e.entitlement_id) AS entitlement_count
      FROM customers c
      LEFT JOIN entitlements e ON e.customer_id = c.customer_id
      GROUP BY c.customer_id
      ORDER BY c.created_at DESC
    `);

    res.json(result.rows);
  } catch (err) {
    console.error("Admin users error:", err);
    res.status(500).json({ error: "Failed to load users" });
  }
});

router.get("/users/:id", async (req, res) => {
  const { id } = req.params;

  try {
    const user = await db.query(`
      SELECT customer_id, display_name, email, is_admin, created_at
      FROM customers
      WHERE customer_id = $1
    `, [id]);

    const entitlements = await db.query(`
      SELECT 
        e.entitlement_id,
        p.product_id,
        p.name,
        p.image_url,
        e.granted_at
      FROM entitlements e
      JOIN products p ON p.product_id = e.product_id
      WHERE e.customer_id = $1
      ORDER BY e.granted_at DESC
    `, [id]);

    res.json({
      user: user.rows[0],
      entitlements: entitlements.rows
    });
  } catch (err) {
    console.error("Admin user detail error:", err);
    res.status(500).json({ error: "Failed to load user details" });
  }
});
