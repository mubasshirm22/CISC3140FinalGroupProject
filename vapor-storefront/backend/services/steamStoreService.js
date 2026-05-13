const STEAM_BASE = "https://store.steampowered.com/api";
const REQUEST_TIMEOUT = 10000;
const MAX_RETRIES = 3;
const RETRY_DELAY = 1500;
const SUCCESS_CACHE_TTL_MS = 30 * 60 * 1000;
const FAILURE_CACHE_TTL_MS = 2 * 60 * 1000;
const APPID_CACHE_TTL_MS = 24 * 60 * 60 * 1000;
const APPID_NEGATIVE_CACHE_TTL_MS = 60 * 60 * 1000;
const APP_DETAILS_CACHE_TTL_MS = 24 * 60 * 60 * 1000;
const APP_DETAILS_NEGATIVE_CACHE_TTL_MS = 60 * 60 * 1000;
const STEAM_403_COOLDOWN_MS = 10 * 60 * 1000;

const STEAM_SUCCESS_CACHE = new Map();
const STEAM_FAILURE_CACHE = new Map();
const APPID_CACHE = new Map();
const APP_DETAILS_CACHE = new Map();
let steamBlockedUntil = 0;
let lastCooldownLogAt = 0;

const MANUAL_APP_MAP = {
  "Dungeon Crawler": 620,
  "Space Adventure": 275850,
  "The Legend of Greg: Twilight Handball": 1174180,
  "The Legend of Greg: Breath of the Subway": 730,
  "The Legend of Greg: Chopped Cheeze of Time": 367520,
  "Soundtrack Collection": 323910
};

class SteamApiError extends Error {
  constructor(message, status = 0) {
    super(message);
    this.name = "SteamApiError";
    this.status = Number(status) || 0;
  }
}

function readCache(cache, key) {
  const entry = cache.get(key);
  if (!entry) {
    return null;
  }

  if (Date.now() >= entry.expiresAt) {
    cache.delete(key);
    return null;
  }

  return entry.value;
}

function writeCache(cache, key, value, ttlMs) {
  cache.set(key, {
    value,
    expiresAt: Date.now() + ttlMs
  });
}

function isSteamBlocked() {
  return Date.now() < steamBlockedUntil;
}

function triggerSteamCooldown() {
  steamBlockedUntil = Date.now() + STEAM_403_COOLDOWN_MS;

  if (Date.now() - lastCooldownLogAt > 60 * 1000) {
    lastCooldownLogAt = Date.now();
    console.warn("[Steam] Received 403. Enabling cooldown and serving cached/local fallbacks.");
  }
}

async function steamFetch(path, retries = 0) {
  if (typeof fetch !== "function") {
    throw new Error("Global fetch is unavailable in current Node runtime");
  }

  const successHit = readCache(STEAM_SUCCESS_CACHE, path);
  if (successHit) {
    return successHit;
  }

  const failureHit = readCache(STEAM_FAILURE_CACHE, path);
  if (failureHit) {
    throw new SteamApiError(failureHit.message, failureHit.status);
  }

  if (isSteamBlocked()) {
    const error = new SteamApiError("Steam API temporarily blocked (cooldown)", 403);
    writeCache(STEAM_FAILURE_CACHE, path, { message: error.message, status: 403 }, FAILURE_CACHE_TTL_MS);
    throw error;
  }

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT);

    const response = await fetch(`${STEAM_BASE}${path}`, {
      signal: controller.signal,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      }
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      const status = Number(response.status);
      const message = `Steam API request failed: ${response.status} ${response.statusText}`;

      if (status === 403) {
        triggerSteamCooldown();
      }

      writeCache(STEAM_FAILURE_CACHE, path, { message, status }, FAILURE_CACHE_TTL_MS);
      throw new SteamApiError(message, status);
    }

    const payload = await response.json();
    writeCache(STEAM_SUCCESS_CACHE, path, payload, SUCCESS_CACHE_TTL_MS);
    return payload;
  } catch (error) {
    const status = Number(error.status) || 0;

    if (status !== 403) {
      console.error(`Steam API error (attempt ${retries + 1}/${MAX_RETRIES}):`, error.message);
    }

    const shouldRetry =
      retries < MAX_RETRIES &&
      (error.name === 'AbortError' ||
        error.message.includes('timeout') ||
        [429, 500, 502, 503, 504].includes(status));

    if (shouldRetry) {
      await new Promise(resolve => setTimeout(resolve, RETRY_DELAY * (retries + 1)));
      return steamFetch(path, retries + 1);
    }

    throw error;
  }
}

function normalizeTags(appData) {
  if (!appData || !Array.isArray(appData.genres)) {
    return [];
  }
  return appData.genres.map((genre) => genre.description).filter(Boolean);
}

function normalizeScreenshots(appData) {
  if (!appData || !Array.isArray(appData.screenshots)) {
    return [];
  }
  return appData.screenshots
    .map((shot) => shot.path_full || shot.path_thumbnail)
    .filter(Boolean)
    .slice(0, 5);
}

function normalizePlatforms(appData) {
  if (!appData || !appData.platforms) {
    return [];
  }

  const platformNames = [];

  if (appData.platforms.windows) {
    platformNames.push("Windows");
  }
  if (appData.platforms.mac) {
    platformNames.push("macOS");
  }
  if (appData.platforms.linux) {
    platformNames.push("Linux");
  }

  return platformNames;
}

function normalizeRating(appData) {
  if (!appData || !Array.isArray(appData.ratings) || appData.ratings.length === 0) {
    return "";
  }

  const preferred = appData.ratings.find((rating) =>
    ["ESRB", "PEGI", "USK"].includes(String(rating?.agency || "").toUpperCase())
  );

  const rating = preferred || appData.ratings[0];
  if (!rating) {
    return "";
  }

  const agency = rating.agency || "Rating";
  const descriptor = rating.descriptors || rating.rating || "";

  return descriptor ? `${agency} ${descriptor}` : agency;
}

function buildSteamPortraitUrls(appid) {
  const id = Number(appid);
  if (!id) {
    return {
      portrait: "",
      portrait_2x: ""
    };
  }

  return {
    portrait: `https://cdn.cloudflare.steamstatic.com/steam/apps/${id}/library_600x900.jpg`,
    portrait_2x: `https://cdn.cloudflare.steamstatic.com/steam/apps/${id}/library_600x900_2x.jpg`
  };
}

function normalizeSteamDetails(appid, appData) {
  const images = buildSteamPortraitUrls(appid);

  return {
    steam_appid: Number(appid),
    title: appData.name || "Unknown Title",
    short_description: appData.short_description || "No description available.",
    header_image: appData.header_image || "",
    capsules: {
      capsule_sm: appData.capsule_image || "",
      capsule_lg: appData.capsule_imagev5 || ""
    },
    images,
    tags: normalizeTags(appData),
    screenshots: normalizeScreenshots(appData),
    developers: Array.isArray(appData.developers) ? appData.developers : [],
    publishers: Array.isArray(appData.publishers) ? appData.publishers : [],
    platforms: normalizePlatforms(appData),
    content_rating: normalizeRating(appData),
    categories: Array.isArray(appData.categories)
      ? appData.categories.map((category) => category.description).filter(Boolean)
      : [],
    release_date: appData.release_date?.date || "",
    steam_url: `https://store.steampowered.com/app/${appid}`
  };
}

async function resolveAppIdByName(name) {
  const normalizedName = String(name || "").trim();
  if (!normalizedName) {
    return null;
  }

  const manualId = MANUAL_APP_MAP[normalizedName];
  if (manualId) {
    return manualId;
  }

  const appIdCached = readCache(APPID_CACHE, normalizedName.toLowerCase());
  if (appIdCached !== null) {
    return appIdCached;
  }

  const searchResult = await steamFetch(
    `/storesearch/?term=${encodeURIComponent(normalizedName)}&l=en&cc=us`
  );

  if (!searchResult || !Array.isArray(searchResult.items) || searchResult.items.length === 0) {
    writeCache(APPID_CACHE, normalizedName.toLowerCase(), null, APPID_NEGATIVE_CACHE_TTL_MS);
    return null;
  }

  const appId = Number(searchResult.items[0].id);
  if (!appId) {
    writeCache(APPID_CACHE, normalizedName.toLowerCase(), null, APPID_NEGATIVE_CACHE_TTL_MS);
    return null;
  }

  writeCache(APPID_CACHE, normalizedName.toLowerCase(), appId, APPID_CACHE_TTL_MS);
  return appId;
}

async function fetchAppDetails(appid) {
  const numericAppId = Number(appid);
  if (!numericAppId) {
    return null;
  }

  const detailsCached = readCache(APP_DETAILS_CACHE, numericAppId);
  if (detailsCached !== null) {
    return detailsCached;
  }

  const details = await steamFetch(`/appdetails/?appids=${appid}&l=en&cc=us`);
  const payload = details?.[appid];

  if (!payload || !payload.success || !payload.data) {
    writeCache(APP_DETAILS_CACHE, numericAppId, null, APP_DETAILS_NEGATIVE_CACHE_TTL_MS);
    return null;
  }

  const normalized = normalizeSteamDetails(appid, payload.data);
  writeCache(APP_DETAILS_CACHE, numericAppId, normalized, APP_DETAILS_CACHE_TTL_MS);
  return normalized;
}

async function enrichProductsWithSteam(products) {
  const safeProducts = Array.isArray(products) ? products : [];

  const enriched = await Promise.all(
    safeProducts.map(async (product) => {
      try {
        const appid = await resolveAppIdByName(product.name || "");
        if (!appid) {
          return {
            ...product,
            steam: null,
            tags: product.genre ? [product.genre] : []
          };
        }

        const steam = await fetchAppDetails(appid);
        if (!steam) {
          return {
            ...product,
            steam: null,
            tags: product.genre ? [product.genre] : []
          };
        }

        return {
          ...product,
          name: steam.title || product.name,
          description: steam.short_description || product.description,
          image_url: steam.header_image || product.image_url,
          tags: steam.tags.length > 0 ? steam.tags : (product.genre ? [product.genre] : []),
          screenshots: steam.screenshots,
          steam
        };
      } catch (error) {
        return {
          ...product,
          steam: null,
          tags: product.genre ? [product.genre] : []
        };
      }
    })
  );

  return enriched;
}

async function fetchSpotlightGames() {
  const response = await steamFetch("/featuredcategories/?cc=us&l=en");

  const pools = [
    ...(response?.specials?.items || []),
    ...(response?.top_sellers?.items || []),
    ...(response?.new_releases?.items || [])
  ];

  const unique = [];
  const seen = new Set();

  for (const item of pools) {
    const appid = Number(item.id);
    if (!appid || seen.has(appid)) {
      continue;
    }
    seen.add(appid);

    const images = buildSteamPortraitUrls(appid);

    unique.push({
      steam_appid: appid,
      title: item.name,
      header_image: item.large_capsule_image || item.header_image || item.small_capsule_image || "",
      images,
      price: typeof item.final_price === "number" ? (item.final_price / 100).toFixed(2) : null,
      tags: [],
      short_description: "",
      steam_url: `https://store.steampowered.com/app/${appid}`
    });

    if (unique.length >= 12) {
      break;
    }
  }

  return unique;
}

module.exports = {
  enrichProductsWithSteam,
  fetchSpotlightGames,
  fetchAppDetails,
  resolveAppIdByName
};