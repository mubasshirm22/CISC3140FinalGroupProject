const express = require("express");
const router = express.Router();
const db = require("../db/db");
const authMiddleware = require("../middleware/authMiddleware");

router.post("/", authMiddleware, async (req, res) => {
    const client = await db.connect();
    
    try {
        await client.query('BEGIN');

        const { items } = req.body;
        const customer_id = req.customer_id;

        if (!items || items.length === 0) {
            await client.query('ROLLBACK');
            return res.status(400).json({
                error: "No items provided"
            });
        }

        // CHECK OWNERSHIP FIRST
        const ownedCheck = await client.query(
            `SELECT product_id FROM entitlements 
             WHERE customer_id = $1 AND product_id = ANY($2)`,
            [customer_id, items]
        );

        if (ownedCheck.rows.length > 0) {
            await client.query('ROLLBACK');
            return res.status(400).json({
                error: "You already own one or more of these games. Check your Purchase History."
            });
        }

        let total = 0;

        for (const product_id of items) {
            const product = await client.query(
                `SELECT price FROM products WHERE product_id = $1`,
                [product_id]
            );

            if (product.rows.length === 0) {
                await client.query('ROLLBACK');
                return res.status(404).json({
                    error: "Product not found"
                });
            }

            total += Number(product.rows[0].price);
        }

        const orderResult = await client.query(
            `INSERT INTO orders (customer_id, total_amount)
             VALUES ($1, $2) RETURNING order_id`,
            [customer_id, total]
        );

        const order_id = orderResult.rows[0].order_id;

        for (const product_id of items) {
            const product = await client.query(
                `SELECT price FROM products WHERE product_id = $1`,
                [product_id]
            );

            const price = product.rows[0].price;

            await client.query(
                `INSERT INTO order_items
                 (order_id, product_id, quantity, unit_price, price_at_purchase)
                 VALUES ($1, $2, 1, $3, $3)`,
                [order_id, product_id, price]
            );

            await client.query(
                `INSERT INTO entitlements (customer_id, product_id)
                 VALUES ($1, $2)`,
                [customer_id, product_id]
            );
        }

        await client.query(
            `DELETE FROM cart_items WHERE customer_id = $1`,
            [customer_id]
        );

        await client.query('COMMIT');

        res.json({
            success: true,
            message: "Checkout complete",
            order_id
        });

    } catch (err) {
        await client.query('ROLLBACK');
        console.error("CHECKOUT ERROR:", err);
        res.status(500).json({
            error: "Checkout failed"
        });
    } finally {
        client.release();
    }
});

module.exports = router;