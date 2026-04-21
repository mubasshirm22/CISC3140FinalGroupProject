require("dotenv").config();
const express = require("express");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const { Pool } = require("pg");
const cors = require("cors");

const app = express();
app.use(express.json());
app.use(cors());

function authMiddleware(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader) {
    return res.status(401).json({ error: "Missing Authorization header" });
  }

  const token = authHeader.split(" ")[1];

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    req.customer_id = decoded.customer_id;  // IMPORTANT

    next();
  } catch (err) {
    console.error("JWT error:", err);
    res.status(401).json({ error: "Invalid token" });
  }
}


// Connect to PostgreSQL
const db = new Pool({
    connectionString: process.env.DATABASE_URL
});

// REGISTER
app.post("/register", async (req, res) => {
    const { email, displayName, password } = req.body;

    const hashed = await bcrypt.hash(password, 10);

    try {
        await db.query(
            `INSERT INTO customers (email, display_name, password_hash)
             VALUES ($1, $2, $3)`,
            [email, displayName, hashed]
        );

        res.json({ message: "Account created" });
    } catch (err) {
        res.status(400).json({ error: "Email already exists" });
    }
});

// LOGIN
app.post("/login", async (req, res) => {
    const { email, password } = req.body;

    const result = await db.query(
        `SELECT * FROM customers WHERE email = $1`,
        [email]
    );

    if (result.rows.length === 0) {
        return res.status(400).json({ error: "No such user" });
    }

    const user = result.rows[0];
    const match = await bcrypt.compare(password, user.password_hash);

    if (!match) {
        return res.status(400).json({ error: "Wrong password" });
    }

    const token = jwt.sign(
        { customer_id: user.customer_id },
        process.env.JWT_SECRET,
        { expiresIn: "7d" }
    );

    res.json({ token });
});

// PRODUCTS
app.get("/products", async (req, res) => {
  try {
    const result = await db.query("SELECT * FROM products ORDER BY name");
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to load products" });
  }
});
// LIBRARY
app.get("/library", authMiddleware, async (req, res) => {
  try {
    const customer_id = req.customer_id; // from your JWT middleware
    console.log("Library request from customer:", req.customer_id);

    const result = await db.query(
      `SELECT p.*
       FROM entitlements e
       JOIN products p ON p.product_id = e.product_id
       WHERE e.customer_id = $1`,
      [customer_id]
    );

    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to load library" });
  }
});

// CHECKOUT
const auth = (req, res, next) => {
    const header = req.headers.authorization;
    if (!header) return res.status(401).json({ error: "Missing token" });

    const token = header.split(" ")[1];
    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.customer_id = decoded.customer_id;
        next();
    } catch {
        res.status(401).json({ error: "Invalid token" });
    }
};

app.post("/checkout", auth, async (req, res) => {
    const { items } = req.body; // array of product_ids

    if (!items || items.length === 0) {
        return res.status(400).json({ error: "No items provided" });
    }

    try {
       // 1. Calculate total
        let total = 0;

        for (const product_id of items) {
            const product = await db.query(
                `SELECT price FROM products WHERE product_id = $1`,
                [product_id]
            );

            total += Number(product.rows[0].price);
        }

        // 2. Create order with total_amount
        const orderResult = await db.query(
            `INSERT INTO orders (customer_id, total_amount)
            VALUES ($1, $2)
            RETURNING order_id`,
            [req.customer_id, total]
        );

        const order_id = orderResult.rows[0].order_id;

        // 3. Insert order items + entitlements
        for (const product_id of items) {
            // Get price
            const product = await db.query(
                `SELECT price FROM products WHERE product_id = $1`,
                [product_id]
            );

            const price = product.rows[0].price;

            // Insert order item
            await db.query(
                `INSERT INTO order_items (order_id, product_id, quantity, unit_price, price_at_purchase)
                VALUES ($1, $2, 1, $3, $3)`,
                [order_id, product_id, price]
            );



            // Grant entitlement
            await db.query(
                `INSERT INTO entitlements (customer_id, product_id)
                 VALUES ($1, $2)`,
                [req.customer_id, product_id]
            );
        }

        res.json({ message: "Checkout complete", order_id });

    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Checkout failed" });
    }
});


// TEST ROUTE
app.get("/", (req, res) => {
    res.send("Vapor backend is running");
});

const PORT = 8080;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
