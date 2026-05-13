// Game Data Service - fetches game info from multiple sources
// Priority: Local API -> RAWG API -> Placeholder

const RAWG_API_KEY = 'demo'; // RAWG demo key (limited)
const RAWG_BASE_URL = 'https://api.rawg.io/api';

// Map local game names to RAWG game names for better data matching
const GAME_MAPPING = {
  'Dungeon Crawler': 'dungeon crawler',
  'Space Adventure': 'space adventure',
  'The Legend of Greg: Twilight Handball': 'twilight',
  'The Legend of Greg: Breath of the Subway': 'breath of',
  'The Legend of Greg: Chopped Cheeze of Time': 'zelda',
  'Soundtrack Collection': 'soundtrack'
};

// Fetch game data from RAWG API
async function fetchFromRAWG(gameName) {
  try {
    const searchName = GAME_MAPPING[gameName] || gameName;
    const response = await fetch(
      `${RAWG_BASE_URL}/games?search=${encodeURIComponent(searchName)}&key=${RAWG_API_KEY}`
    );
    const data = await response.json();
    
    if (data.results && data.results.length > 0) {
      const game = data.results[0];
      return {
        title: game.name,
        description: game.description_raw || 'No description available',
        image_url: game.background_image,
        tags: game.genres ? game.genres.map(g => g.name) : [],
        rating: Math.round(game.rating * 20) || 75,
        platforms: game.platforms ? game.platforms.map(p => p.platform.name) : []
      };
    }
  } catch (error) {
    console.warn('RAWG API error:', error);
  }
  return null;
}

// Fetch data from local backend API
async function fetchFromLocal(productId) {
  try {
    const response = await fetch(`http://localhost:8080/products`);
    const data = await response.json();
    const game = data.find(g => g.product_id === productId);
    
    if (game) {
      return {
        title: game.name,
        description: game.description || 'No description available',
        image_url: game.image_url,
        tags: game.genre ? [game.genre] : [],
        rating: game.vapor_score || 75
      };
    }
  } catch (error) {
    console.warn('Local API error:', error);
  }
  return null;
}

// Enhance game data with external APIs
export async function enrichGameData(game) {
  try {
    // First try RAWG API for richer data
    const rawgData = await fetchFromRAWG(game.name);
    
    if (rawgData) {
      return {
        ...game,
        description: rawgData.description,
        image_url: rawgData.image_url || game.image_url,
        tags: rawgData.tags,
        vapor_score: rawgData.rating,
        platforms: rawgData.platforms
      };
    }
  } catch (error) {
    console.warn('Error enriching game data:', error);
  }
  
  // Fallback to local data
  return game;
}

// Fetch multiple games data
export async function enrichGamesData(games) {
  return Promise.all(games.map(game => enrichGameData(game)));
}

// Get game screenshots (using placeholder service)
export function getGameScreenshots(gameName, count = 3) {
  const gradientMap = {
    'Dungeon Crawler': '1a0533/ffffff?text=Screenshot',
    'Space Adventure': '0a1628/ffffff?text=Screenshot',
    'The Legend of Greg: Twilight Handball': '1a0808/ffffff?text=Screenshot',
    'The Legend of Greg: Breath of the Subway': '0a1820/ffffff?text=Screenshot',
    'The Legend of Greg: Chopped Cheeze of Time': '1a1500/ffffff?text=Screenshot',
    'Soundtrack Collection': '0a1a1a/ffffff?text=Screenshot'
  };
  
  const color = gradientMap[gameName] || '16202d/ffffff?text=Screenshot';
  const baseUrl = 'https://via.placeholder.com/600x400/';
  
  const screenshots = [];
  for (let i = 1; i <= count; i++) {
    screenshots.push(`${baseUrl}${color}+${i}`);
  }
  return screenshots;
}

export default {
  enrichGameData,
  enrichGamesData,
  getGameScreenshots,
  fetchFromRAWG,
  fetchFromLocal
};