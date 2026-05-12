const db = require("../db");

module.exports = async function requireAdmin(req, res, next) {
  if (!req.customer_id) {
    return res.status(401).json({ error: "Not logged in" });
  }

  try {
    const result = await db.query(
      "SELECT is_admin FROM customers WHERE customer_id = $1",
      [req.customer_id]
    );

    if (!result.rows[0]?.is_admin) {
      return res.status(403).json({ error: "Forbidden" });
    }

    next();
  } catch (err) {
    console.error("Admin check error:", err);
    res.status(500).json({ error: "Server error" });
  }
};
