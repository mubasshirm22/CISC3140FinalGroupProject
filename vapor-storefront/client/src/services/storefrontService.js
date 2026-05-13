import { request } from "./api/httpClient";

export const STEAM_FALLBACK_EVENT = "steamFallbackStatus";

let steamFallbackActive = false;

function buildSteamPortraitUrl(appid, suffix = "") {
  if (!appid) {
    return "";
  }

  return `https://cdn.cloudflare.steamstatic.com/steam/apps/${appid}/library_600x900${suffix}.jpg`;
}

function getThumbnailCandidates(game) {
  const appid = game?.steam?.steam_appid || game?.steam_appid;

  return [
    game?.steam?.images?.portrait,
    buildSteamPortraitUrl(appid, "_2x"),
    buildSteamPortraitUrl(appid),
    Array.isArray(game?.screenshots) ? game.screenshots[0] : "",
    Array.isArray(game?.steam?.screenshots) ? game.steam.screenshots[0] : "",
    game?.steam?.header_image,
    game?.steam?.capsules?.capsule_lg,
    game?.steam?.capsules?.capsule_sm,
    game?.header_image,
    game?.image_url
  ].filter(Boolean);
}

export function getGameThumbnailSrc(game) {
  const candidates = getThumbnailCandidates(game);
  return candidates[0] || "";
}

function emitSteamFallbackStatus(active) {
  if (steamFallbackActive === active) {
    return;
  }

  steamFallbackActive = active;

  if (typeof window !== "undefined") {
    window.dispatchEvent(
      new CustomEvent(STEAM_FALLBACK_EVENT, {
        detail: { active }
      })
    );
  }
}

function normalizeSearchText(value) {
  return String(value || "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ");
}

function matchesSearchTerm(game, searchTerm) {
  const normalizedTerm = normalizeSearchText(searchTerm);

  if (!normalizedTerm) {
    return true;
  }

  const terms = normalizedTerm.split(" ").filter(Boolean);
  const haystack = normalizeSearchText(
    [
      game.name,
      game.description,
      game.genre,
      ...(Array.isArray(game.tags) ? game.tags : [])
    ].join(" ")
  );

  return terms.every((term) => haystack.includes(term));
}

function withFallbackTags(game) {
  const price = Number(game?.price || 0);
  const incomingTags = Array.isArray(game.tags) ? game.tags : [];
  const normalizedTags = incomingTags
    .filter(Boolean)
    .map((tag) => String(tag).trim())
    .filter((tag, index, allTags) => allTags.findIndex((item) => item.toLowerCase() === tag.toLowerCase()) === index)
    .filter((tag) => !(price > 0 && tag.toLowerCase() === "free to play"));

  if (normalizedTags.length > 0) {
    return {
      ...game,
      tags: normalizedTags
    };
  }

  return {
    ...game,
    tags: game.genre ? [game.genre] : []
  };
}

async function enrichProducts(products) {
  if (!Array.isArray(products) || products.length === 0) {
    return [];
  }

  try {
    const enriched = await request("/steam/enrich", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ products })
    });

    emitSteamFallbackStatus(false);
    return Array.isArray(enriched) ? enriched.map(withFallbackTags) : products.map(withFallbackTags);
  } catch (error) {
    emitSteamFallbackStatus(true);
    return products.map(withFallbackTags);
  }
}

export async function enrichStandaloneGames(games) {
  return enrichProducts(games);
}

export async function fetchCatalog(searchTerm = "") {
  const products = await request("/products");
  const enriched = await enrichProducts(products);

  if (!searchTerm) {
    return enriched;
  }

  return enriched.filter((game) => matchesSearchTerm(game, searchTerm));
}

export async function fetchSpotlight() {
  try {
    const spotlight = await request("/products/spotlight");
    return Array.isArray(spotlight) ? spotlight : [];
  } catch (error) {
    return [];
  }
}

export async function fetchGameById(productId) {
  const products = await request("/products");
  const matched = products.find((game) => String(game.product_id) === String(productId));

  if (!matched) {
    return null;
  }

  const enriched = await enrichProducts([matched]);
  return enriched[0] || withFallbackTags(matched);
}

export async function fetchLibrary(token) {
  const library = await request("/library", {
    headers: {
      Authorization: `Bearer ${token}`
    }
  });

  return enrichProducts(library);
}