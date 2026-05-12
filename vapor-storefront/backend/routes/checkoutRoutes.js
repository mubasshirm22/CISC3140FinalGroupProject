const express = require("express");
const router = express.Router();

const db = require("../db/db");
const authMiddleware = require("../middleware/authMiddleware");


// CHECKOUT
router.post("/", authMiddleware, async (req, res) => {

    const { items } = req.body;

    if (!items || items.length === 0) {
        return res.status(400).json({
            error: "No items provided"
        });
    }

    try {

        let total = 0;

        for (const product_id of items) {

            const product = await db.query(
                `SELECT price FROM products WHERE product_id = $1`,
                [product_id]
            );

            total += Number(product.rows[0].price);
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

        for (const product_id of items) {

            const product = await db.query(
                `SELECT price FROM products WHERE product_id = $1`,
                [product_id]
            );

            const price = product.rows[0].price;

            await db.query(
                `
                INSERT INTO order_items
                (order_id, product_id, quantity, unit_price, price_at_purchase)
                VALUES ($1, $2, 1, $3, $3)
                `,
                [order_id, product_id, price]
            );

            await db.query(
                `
                INSERT INTO entitlements (customer_id, product_id)
                VALUES ($1, $2)
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

        res.json({
            message: "Checkout complete",
            order_id
        });

    } catch (err) {

        console.error(err);

        res.status(500).json({
            error: "Checkout failed"
        });
    }
});


module.exports = router;