import { WeatherOutfitResponse, Gender, Style, ColorSeason, TimeOfDay, TargetDay } from '../types';
import { GoogleGenerativeAI } from '@google/generative-ai';

// 🔥 修正：使用最新的 2.5 模型 (這是目前 Google 官方推薦的)
const MODEL_NAME = "gemini-2.5-flash";

const getApiKey = (keyName: string) => {
  const envKey = import.meta.env[keyName];
  if (!envKey) return null;
  return envKey.trim();
}

// 色彩翻譯機：把 AI 給的怪顏色轉成 Pexels 找得到的關鍵字
const getSearchColor = (hexColor: string, originalColorName: string): string => {
  const name = originalColorName.toLowerCase();
  if (name.includes('electric') || name.includes('neon')) return 'bright blue';
  if (name.includes('hot pink') || name.includes('fuchsia')) return 'bright pink';
  if (name.includes('chartreuse')) return 'lime green';
  if (name.includes('mauve')) return 'purple';
  if (name.includes('taupe')) return 'brown';
  return name; 
};

// Pexels 圖片搜尋
const fetchPexelsImages = async (query: string) => {
  const PEXELS_API_KEY = getApiKey('VITE_PEXELS_API_KEY');
  if (!PEXELS_API_KEY) {
    console.warn('⚠️ No Pexels API key found');
    return [];
  }

  try {
    // 修正關鍵字策略：加上 "fashion style", "clothing", "outfit" 等字眼，並過濾掉 "no person"
    const safeQuery = `${query} fashion style clothing outfit -flatlay -vector`;
    const url = `https://api.pexels.com/v1/search?query=${encodeURIComponent(safeQuery)}&per_page=3&orientation=portrait`;
    
    const response = await fetch(url, {
      headers: { Authorization: PEXELS_API_KEY }
    });

    if (!response.ok) return [];

    const data = await response.json();
    return data.photos.map((photo: any) => ({
      id: photo.id,
      url: photo.url,
      src: {
        medium: photo.src.medium,
        large: photo.src.large
      },
      alt: photo.alt || query
    }));
  } catch (error) {
    console.error('Pexels error:', error);
    return [];
  }
};

// 真實天氣查詢 (wttr.in)
const fetchRealWeather = async (location: string) => {
  try {
    // 強制加上 Taiwan 以避免抓到中國泰山
    const searchLocation = location.includes('Taiwan') ? location : `${location}, Taiwan`;
    // 使用 format=j1 取得詳細 JSON (包含濕度)
    const response = await fetch(`https://wttr.in/${encodeURIComponent(searchLocation)}?format=j1`);
    
    if (!response.ok) throw new Error('Weather API Error');
    
    const data = await response.json();
    const current = data.current_condition[0];
    
    return {
      temp: parseInt(current.temp_C),
      condition: current.weatherDesc[0].value,
      humidity: parseInt(current.humidity), // 抓取濕度
      feelsLike: parseInt(current.FeelsLikeC),
      precip: current.precipMM > 0 ? `${current.precipMM}mm` : '0%'
    };
  } catch (e) {
    console.warn("Weather API failed, falling back to AI simulation", e);
    return null;
  }
};

// 清理 JSON 字串 (防呆)
const repairJson = (jsonString: string) => {
    let clean = jsonString.replace(/``````/g, '').trim();
    const firstBrace = clean.indexOf('{');
    const lastBrace = clean.lastIndexOf('}');
    if (firstBrace !== -1 && lastBrace !== -1) {
        clean = clean.substring(firstBrace, lastBrace + 1);
    }
    return clean;
};

export const getGeminiSuggestion = async (
  location: string,
  gender: Gender,
  style: Style,
  colorSeason: ColorSeason,
  timeOfDay: TimeOfDay,
  targetDay: TargetDay
): Promise<WeatherOutfitResponse> => {
  
  const GOOGLE_API_KEY = getApiKey('VITE_GOOGLE_API_KEY');
  if (!GOOGLE_API_KEY) throw new Error("Missing Google API Key");

  // 1. 先抓真實天氣
  const realWeather = await fetchRealWeather(location);
  let weatherInfo = "";
  
  if (realWeather) {
      weatherInfo = `
      Current Real Weather in ${location}:
      - Temperature: ${realWeather.temp}°C
      - Feels Like: ${realWeather.feelsLike}°C
      - Humidity: ${realWeather.humidity}% (Crucial: Consider humidity for comfort)
      - Condition: ${realWeather.condition}
      - Rain: ${realWeather.precip}
      `;
  } else {
      weatherInfo = `Simulate weather for ${location} in ${targetDay === 'today' ? 'current time' : 'tomorrow'}.`;
  }

  // 2. 組裝 Prompt
  const prompt = `
    Act as a professional fashion stylist.
    User Profile: ${gender}, ${style} style, Personal Color: ${colorSeason}.
    Time: ${targetDay} ${timeOfDay}.
    
    ${weatherInfo}

    【嚴格要求】
    1. 濕度判斷：若濕度 > 70%，請避免厚重棉質，推薦透氣排汗材質；若濕度 < 40%，推薦保濕親膚材質。
    2. 圖示選擇：請從以下清單中選擇最準確的 icon key (items.name 必須包含這些關鍵字):
       - 上身: "t-shirt", "shirt", "hoodie", "coat", "jacket"
       - 下身: "shorts", "skirt", "dress", "pants", "jeans"
       - 鞋子: "sneakers", "boots", "sandals", "shoes"
       - 配件: "bag", "umbrella", "hat", "glasses"
    3. 顏色命名：請使用標準且常見的英文色名 (例如 "Royal Blue" 而非 "Electric Blue") 以利圖片搜尋。

    Return valid JSON only:
    {
      "weather": {
        "location": "${location}",
        "temperature": 25,
        "condition": "Sunny",
        "humidity": "75%",
        "precipitation": "10%",
        "feels_like": 28
      },
      "outfit": {
        "summary": "One sentence summary",
        "reason": "Why this matches weather & color season",
        "tips": "One specific advice for humidity/temp (e.g., 'High humidity today, wear breathable linen.')",
        "color_palette": ["Hex1", "Hex2", "Hex3", "Hex4"],
        "items": [
          {"name": "White T-Shirt", "type": "Top", "color": "White", "material": "Cotton", "reason": "Breathable"},
          {"name": "Denim Shorts", "type": "Bottom", "color": "Blue", "material": "Denim", "reason": "Cool"}
        ],
        "visualPrompts": ["White t-shirt and blue denim shorts fashion outfit street style"]
      }
    }
  `;

  try {
    const genAI = new GoogleGenerativeAI(GOOGLE_API_KEY);
    const model = genAI.getGenerativeModel({ model: MODEL_NAME });
    
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();
    
    const parsedData = JSON.parse(repairJson(text));

    // 如果有真實天氣數據，覆蓋 AI 的幻覺數據
    if (realWeather) {
        parsedData.weather = {
            ...parsedData.weather,
            temperature: realWeather.temp,
            condition: realWeather.condition,
            humidity: `${realWeather.humidity}%`,
            feels_like: realWeather.feelsLike,
            precipitation: realWeather.precip
        };
    }

    // 3. 抓取圖片 (平行處理加速)
    if (parsedData.outfit?.visualPrompts?.length > 0) {
        // 嘗試用更精準的關鍵字搜尋
        const mainQuery = parsedData.outfit.visualPrompts[0];
        const backupColor = parsedData.outfit.items?.[0]?.color || "fashion";
        const backupQuery = `${backupColor} ${gender} fashion outfit`;

        const [images1, images2] = await Promise.all([
            fetchPexelsImages(mainQuery),
            fetchPexelsImages(backupQuery)
        ]);
        
        // 合併結果，優先使用精準搜尋
        parsedData.generatedImages = [...images1, ...images2].slice(0, 3);
    }
    
    return parsedData;

  } catch (e) {
    console.error("Gemini API Error:", e);
    throw e;
  }
};