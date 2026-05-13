const express = require("express");
const router = express.Router();
const db = require("../db/db");
const authMiddleware = require("../middleware/authMiddleware");

router.post("/", authMiddleware, async (req, res) => {
    let client;
    
    try {
        client = await db.connect();
        await client.query('BEGIN');

        const { items } = req.body;
        const customer_id = req.customer_id;

        // Validate items array
        if (!Array.isArray(items) || items.length === 0) {
            await client.query('ROLLBACK');
            return res.status(400).json({
                error: "No items provided"
            });
        }

        // Normalize items to have consistent structure.
        // For digital games, we enforce one copy per product per checkout.
        const normalizedItems = items
            .map((item) => {
                if (item && typeof item === "object") {
                    return {
                        product_id: item.product_id,
                        quantity: 1
                    };
                }

                return {
                    product_id: item,
                    quantity: 1
                };
            })
            .filter((item) => item.product_id);

        // Remove duplicates in request payload to avoid double-charging same product.
        const dedupedByProduct = new Map();
        for (const item of normalizedItems) {
            dedupedByProduct.set(String(item.product_id), {
                product_id: item.product_id,
                quantity: 1
            });
        }

        const checkoutItems = Array.from(dedupedByProduct.values());

        if (checkoutItems.length === 0) {
            await client.query('ROLLBACK');
            return res.status(400).json({
                error: "No valid items provided"
            });
        }

        // Extract product IDs for ownership check
        const productIds = checkoutItems.map(item => item.product_id);

        // CHECK OWNERSHIP FIRST
        const ownedCheck = await client.query(
            `SELECT product_id FROM entitlements 
             WHERE customer_id = $1 AND product_id = ANY($2)`,
            [customer_id, productIds]
        );

        if (ownedCheck.rows.length > 0) {
            await client.query('ROLLBACK');
            return res.status(400).json({
                error: "You already own one or more of these games. Check your Purchase History."
            });
        }

        // Calculate total and verify products exist
        let total = 0;
        const productPriceMap = new Map();

        for (const item of checkoutItems) {
            const { product_id, quantity } = item;

            const product = await client.query(
                `SELECT price FROM products WHERE product_id = $1`,
                [product_id]
            );

            if (product.rows.length === 0) {
                await client.query('ROLLBACK');
                return res.status(400).json({
                    error: "One or more products no longer exist"
                });
            }

            const price = Number(product.rows[0].price);
            productPriceMap.set(String(product_id), price);
            total += price * quantity;
        }

        // Create order
        const orderResult = await client.query(
            `INSERT INTO orders (customer_id, total_amount)
             VALUES ($1, $2) RETURNING order_id`,
            [customer_id, total]
        );

        const order_id = orderResult.rows[0].order_id;

        // Add order items and entitlements
        for (const item of checkoutItems) {
            const { product_id, quantity } = item;
            const price = productPriceMap.get(String(product_id));

            await client.query(
                `INSERT INTO order_items
                 (order_id, product_id, quantity, unit_price, price_at_purchase)
                 VALUES ($1, $2, $3, $4, $4)`,
                [order_id, product_id, quantity, price]
            );

            await client.query(
                `INSERT INTO entitlements (customer_id, product_id)
                 VALUES ($1, $2)
                 ON CONFLICT (customer_id, product_id) DO NOTHING`,
                [customer_id, product_id]
            );
        }

        // Clear cart
        await client.query(
            `DELETE FROM cart_items
             WHERE customer_id = $1
             AND product_id = ANY($2)`,
            [customer_id, productIds]
        );

        // Commit transaction
        await client.query('COMMIT');

        res.json({
            success: true,
            message: "Checkout complete",
            order_id
        });

    } catch (err) {
        if (client) {
            try {
                await client.query('ROLLBACK');
            } catch (rollbackErr) {
                console.error("Rollback failed:", rollbackErr);
            }
        }
        console.error(err);
        res.status(500).json({
            error: "Checkout failed"
        });
    } finally {
        if (client) {
            client.release();
        }
    }
});

module.exports = router;