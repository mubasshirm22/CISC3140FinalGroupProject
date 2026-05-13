const express = require("express");
const router = express.Router();
const db = require("../db/db");
const authMiddleware = require("../middleware/authMiddleware");

// CHECKOUT
router.post("/", authMiddleware, async (req, res) => {
    try {

        const { items } = req.body;
        const customer_id = req.customer_id;

        if (!items || items.length === 0) {
            return res.status(400).json({
                error: "No items provided"
            });
        }

        let total = 0;

        // calculate total
        for (const product_id of items) {

            const product = await db.query(
                `
                SELECT price
                FROM products
                WHERE product_id = $1
                `,
                [product_id]
            );

            if (product.rows.length === 0) {
                return res.status(404).json({
                    error: "Product not found"
                });
            }

            total += Number(product.rows[0].price);
        }

        // create order
        const orderResult = await db.query(
            `
            INSERT INTO orders
            (customer_id, total_amount)

            VALUES ($1, $2)

            RETURNING order_id
            `,
            [customer_id, total]
        );

        const order_id = orderResult.rows[0].order_id;

        // insert order items
        for (const product_id of items) {

            const product = await db.query(
                `
                SELECT price
                FROM products
                WHERE product_id = $1
                `,
                [product_id]
            );

            const price = product.rows[0].price;

            await db.query(
                `
                INSERT INTO order_items
                (
                    order_id,
                    product_id,
                    quantity,
                    unit_price,
                    price_at_purchase
                )

                VALUES ($1, $2, 1, $3, $3)
                `,
                [
                    order_id,
                    product_id,
                    price
                ]
            );

            // check existing ownership
            const existingGame = await db.query(
                `
                SELECT *
                FROM entitlements
                WHERE customer_id = $1
                AND product_id = $2
                `,
                [customer_id, product_id]
            );

            if (existingGame.rows.length > 0) {
                return res.status(400).json({
                    error: "You already own one or more of these games. Check your History"
                });
            }

            // library entitlement
            await db.query(
                `
                INSERT INTO entitlements
                (customer_id, product_id)

                VALUES ($1, $2)
                `,
                [
                    customer_id,
                    product_id
                ]
            );
        }

        // clear cart
        await db.query(
            `
            DELETE FROM cart_items
            WHERE customer_id = $1
            `,
            [customer_id]
        );

        res.json({
            success: true,
            message: "Checkout complete",
            order_id
        });

    } catch (err) {

        console.error("CHECKOUT ERROR:", err);

        res.status(500).json({
            error: "Checkout failed"
        });
    }
});

module.exports = router;