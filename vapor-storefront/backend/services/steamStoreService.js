const STEAM_BASE = "https://store.steampowered.com/api";
const REQUEST_TIMEOUT = 10000;
const MAX_RETRIES = 3;
const RETRY_DELAY = 1500;

const STEAM_CACHE = new Map();

const MANUAL_APP_MAP = {
  "Dungeon Crawler": 620,
  "Space Adventure": 275850,
  "The Legend of Greg: Twilight Handball": 1174180,
  "The Legend of Greg: Breath of the Subway": 730,
  "The Legend of Greg: Chopped Cheeze of Time": 367520,
  "Soundtrack Collection": 323910
};

async function steamFetch(path, retries = 0) {
  if (typeof fetch !== "function") {
    throw new Error("Global fetch is unavailable in current Node runtime");
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
      throw new Error(`Steam API request failed: ${response.status} ${response.statusText}`);
    }

    return response.json();
  } catch (error) {
    console.error(`Steam API error (attempt ${retries + 1}/${MAX_RETRIES}):`, error.message);

    const shouldRetry =
      retries < MAX_RETRIES &&
      (error.name === 'AbortError' ||
        error.message.includes('timeout') ||
        error.message.includes('429') ||
        error.message.includes('500') ||
        error.message.includes('502') ||
        error.message.includes('503') ||
        error.message.includes('504'));

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
  if (MANUAL_APP_MAP[name]) {
    return MANUAL_APP_MAP[name];
  }

  const searchResult = await steamFetch(
    `/storesearch/?term=${encodeURIComponent(name)}&l=en&cc=us`
  );

  if (!searchResult || !Array.isArray(searchResult.items) || searchResult.items.length === 0) {
    return null;
  }

  return Number(searchResult.items[0].id);
}

async function fetchAppDetails(appid) {
  const details = await steamFetch(`/appdetails/?appids=${appid}&l=en&cc=us`);
  const payload = details?.[appid];

  if (!payload || !payload.success || !payload.data) {
    return null;
  }

  return normalizeSteamDetails(appid, payload.data);
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