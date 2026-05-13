const express = require("express");
const router = express.Router();

const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

const db = require("../db/db");
const authMiddleware = require("../middleware/authMiddleware");


// Display Name
router.get("/me", authMiddleware, async (req, res) => {
    try {
        const result = await db.query(
            `SELECT customer_id, email, display_name, is_admin
             FROM customers
             WHERE customer_id = $1`,
            [req.customer_id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ error: "User not found" });
        }

        res.json(result.rows[0]);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Failed to load profile" });
    }
});

// Register
router.post("/register", async (req, res) => {
        const { email, displayName, password } = req.body;

        if (!email || !displayName || !password) {
                return res.status(400).json({ error: "Missing required fields" });
        }

    try {
                const hashed = await bcrypt.hash(password, 10);

        await db.query(
            `INSERT INTO customers (email, display_name, password_hash)
             VALUES ($1, $2, $3)`,
            [email, displayName, hashed]
        );

        res.json({ message: "Account created" });
    } catch (err) {
        console.error(err);
        res.status(400).json({ error: "Email already exists" });
    }
});


// LOGIN
router.post("/login", async (req, res) => {
    const { email, password } = req.body;

    if (!email || !password) {
        return res.status(400).json({ error: "Missing email or password" });
    }

    try {
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
            { customer_id: user.customer_id, is_admin: user.is_admin },
            process.env.JWT_SECRET,
            { expiresIn: "7d" }
        );

        res.json({
            token,
            display_name: user.display_name,
            email: user.email,
            is_admin: user.is_admin
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Login failed" });
    }
});


module.exports = router;