const express = require("express");
const db = require("../db/db.js");

const {
  enrichProductsWithSteam,
  fetchAppDetails
} = require("../services/steamStoreService");

const router = express.Router();

router.get("/spotlight", async (req, res) => {
  try {
    // 从数据库获取评分最高的游戏作为spotlight
    const result = await db.query(
      "SELECT product_id, name, description, price, image_url, genre, vapor_score FROM products ORDER BY vapor_score DESC LIMIT 12"
    );
    
    const spotlightGames = result.rows.map(game => ({
      product_id: game.product_id,
      title: game.name,
      short_description: game.description,
      price: parseFloat(game.price),
      header_image: game.image_url,
      genre: game.genre,
      vapor_score: game.vapor_score,
      tags: game.genre ? [game.genre] : []
    }));

    res.json(spotlightGames);
  } catch (error) {
    console.error("[Steam] Spotlight fetch failed:", error.message);
    res.status(500).json({ error: "Failed to load spotlight.", details: error.message });
  }
});

router.post("/enrich", async (req, res) => {
  try {
    const { products } = req.body;
    const enriched = await enrichProductsWithSteam(products);
    res.json(enriched);
  } catch (error) {
    console.error("[Steam] Enrich products failed:", error.message);
    res.status(500).json({ error: "Failed to enrich products with Steam data.", details: error.message });
  }
});

router.get("/app/:appid", async (req, res) => {
  try {
    const appid = Number(req.params.appid);
    if (!appid) {
      return res.status(400).json({ error: "Invalid Steam appid." });
    }

    const details = await fetchAppDetails(appid);
    if (!details) {
      return res.status(404).json({ error: "Steam app not found." });
    }

    return res.json(details);
  } catch (error) {
    console.error(`[Steam] App details fetch failed for appid ${req.params.appid}:`, error.message);
    return res.status(500).json({ error: "Failed to load Steam app details.", details: error.message });
  }
});

module.exports = router;
