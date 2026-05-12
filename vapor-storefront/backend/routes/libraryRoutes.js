const express = require("express");
const router = express.Router();

const db = require("../db/db");
const authMiddleware = require("../middleware/authMiddleware");


// GET USER LIBRARY
router.get("/", authMiddleware, async (req, res) => {

    try {

        const customer_id = req.customer_id;

        const result = await db.query(
            `
            SELECT p.*
            FROM entitlements e
            JOIN products p
            ON p.product_id = e.product_id
            WHERE e.customer_id = $1
            `,
            [customer_id]
        );

        res.json(result.rows);

    } catch (err) {

        console.error(err);

        res.status(500).json({
            error: "Failed to load library"
        });
    }
});


module.exports = router;