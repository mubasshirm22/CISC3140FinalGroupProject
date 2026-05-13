const express = require("express");
const router = express.Router();

const db = require("../db/db.js");
const { resolveAppIdByName, fetchAppDetails } = require("../services/steamStoreService");

const steamCoverCache = new Map();

async function getSteamCoverByName(name) {
  if (!name) {
    return null;
  }

  if (steamCoverCache.has(name)) {
    return steamCoverCache.get(name);
  }

  try {
    const appid = await resolveAppIdByName(name);
    if (!appid) {
      return null;
    }

    const details = await fetchAppDetails(appid);
    const coverUrl = details?.header_image || details?.images?.portrait || null;

    if (coverUrl) {
      steamCoverCache.set(name, coverUrl);
    }

    return coverUrl;
  } catch (err) {
    console.error("[Steam] Cover lookup failed for", name, err.message);
    return null;
  }
}

// Products
router.get("/products", async (req, res) => {
  try {
    const result = await db.query(
      "SELECT * FROM products ORDER BY name"
    );
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({error:"Failed to load products"});
  }
});

router.get("/products/spotlight", async (req, res) => {
  try {
    const result = await db.query(
      "SELECT product_id, name, description, price, image_url, genre, vapor_score FROM products ORDER BY vapor_score DESC LIMIT 12"
    );

    const spotlightGames = [];
    for (const game of result.rows) {
      const steamCover = await getSteamCoverByName(game.name);

      spotlightGames.push({
        product_id: game.product_id,
        title: game.name,
        short_description: game.description,
        price: parseFloat(game.price),
        header_image: steamCover || game.image_url,
        genre: game.genre,
        vapor_score: game.vapor_score,
        tags: game.genre ? [game.genre] : []
      });
    }

    res.json(spotlightGames);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to load spotlight." });
  }
});

// Search 
router.get("/search", async (req, res) => {
  const q = String(req.query.q || "").trim();

  if (!q) {
    return res.json([]);
  }

  const terms = q.split(/\s+/).filter(Boolean);
  const whereClause = terms
    .map((_, index) => `name ILIKE $${index + 1}`)
    .join(" AND ");

  try {
    const result = await db.query(
      `SELECT * FROM products WHERE ${whereClause} ORDER BY name`,
      terms.map((term) => `%${term}%`)
    );
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({
      error: "Search failed"
    });
  }
});


module.exports = router;