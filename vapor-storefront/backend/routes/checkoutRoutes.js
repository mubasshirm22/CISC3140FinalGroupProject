const express = require("express");
const router = express.Router();

const db = require("../db/db");
const authMiddleware = require("../middleware/authMiddleware");


// CHECKOUT
router.post("/", authMiddleware, async (req, res) => {

    const { items } = req.body;

    if (!Array.isArray(items) || items.length === 0) {
        return res.status(400).json({
            error: "No items provided"
        });
    }

    const normalizedItems = items
        .map((item) => {
            if (item && typeof item === "object") {
                return {
                    product_id: item.product_id,
                    quantity: Number(item.quantity) > 0 ? Number(item.quantity) : 1
                };
            }

            return {
                product_id: item,
                quantity: 1
            };
        })
        .filter((item) => item.product_id);

    if (normalizedItems.length === 0) {
        return res.status(400).json({
            error: "No valid items provided"
        });
    }

    try {
        await db.query("BEGIN");

        let total = 0;

        for (const item of normalizedItems) {
            const { product_id, quantity } = item;

            const product = await db.query(
                `SELECT price FROM products WHERE product_id = $1`,
                [product_id]
            );

            if (product.rows.length === 0) {
                await db.query("ROLLBACK");
                return res.status(400).json({
                    error: "One or more products no longer exist"
                });
            }

            total += Number(product.rows[0].price) * quantity;
        }

        const orderResult = await db.query(
            `
            INSERT INTO orders (customer_id, total_amount)
            VALUES ($1, $2)
            RETURNING order_id
            `,
            [req.customer_id, total]
        );

        const order_id = orderResult.rows[0].order_id;

        for (const item of normalizedItems) {
            const { product_id, quantity } = item;

            const product = await db.query(
                `SELECT price FROM products WHERE product_id = $1`,
                [product_id]
            );

            const price = product.rows[0].price;

            await db.query(
                `
                INSERT INTO order_items
                (order_id, product_id, quantity, unit_price, price_at_purchase)
                VALUES ($1, $2, $3, $4, $4)
                `,
                [order_id, product_id, quantity, price]
            );

            await db.query(
                `
                INSERT INTO entitlements (customer_id, product_id)
                VALUES ($1, $2)
                ON CONFLICT (customer_id, product_id) DO NOTHING
                `,
                [req.customer_id, product_id]
            );
        }

        await db.query(
            `
            DELETE FROM cart_items
            WHERE customer_id = $1
            `,
            [req.customer_id]
        );

        await db.query("COMMIT");

        res.json({
            message: "Checkout complete",
            order_id
        });

    } catch (err) {
        await db.query("ROLLBACK");

        console.error(err);

        res.status(500).json({
            error: "Checkout failed"
        });
    }
});


module.exports = router;