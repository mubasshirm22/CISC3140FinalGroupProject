const express = require("express");
const router = express.Router();
const db = require("../db/db");
const authMiddleware = require("../middleware/authMiddleware");

// GET ORDER HISTORY
router.get("/", authMiddleware, async (req, res) => {
    try {
        const customer_id = req.customer_id;

        const orders = await db.query(
            `SELECT 
                o.order_id,
                o.total_amount,
                o.order_date,
                json_agg(
                    json_build_object(
                        'product_id', p.product_id,
                        'name', p.name,
                        'genre', p.genre,
                        'price', oi.price_at_purchase
                    )
                ) as items
            FROM orders o
            JOIN order_items oi ON o.order_id = oi.order_id
            JOIN products p ON oi.product_id = p.product_id
            WHERE o.customer_id = $1
            GROUP BY o.order_id
            ORDER BY o.order_date DESC`,
            [customer_id]
        );

        res.json(orders.rows);

    } catch (err) {
        console.error("ORDER HISTORY ERROR:", err);
        res.status(500).json({
            error: "Failed to load order history"
        });
    }
});

module.exports = router;