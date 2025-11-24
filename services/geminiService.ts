import { WeatherOutfitResponse, Gender, Style, ColorSeason, TimeOfDay, TargetDay } from '../types';
import { GoogleGenerativeAI } from '@google/generative-ai';

const MODEL_NAME = "gemini-2.5-flash";

const getApiKey = (keyName: string) => {
  const envKey = import.meta.env[keyName];
  if (!envKey) return null;
  return envKey.trim();
}

// Pexels 圖片搜尋
const fetchPexelsImages = async (query: string) => {
  const PEXELS_API_KEY = getApiKey('VITE_PEXELS_API_KEY');
  if (!PEXELS_API_KEY) return [];

  try {
    // 🔥 關鍵修正：搜尋時強制加上 "cool tone", "high contrast" 等亮冬型關鍵字，並排除暖色
    const safeQuery = `${query} outfit street style high quality -warm -beige -orange -sepia`;
    const url = `https://api.pexels.com/v1/search?query=${encodeURIComponent(safeQuery)}&per_page=3&orientation=portrait`;
    
    const response = await fetch(url, { headers: { Authorization: PEXELS_API_KEY } });
    if (!response.ok) return [];
    const data = await response.json();
    
    return data.photos.map((photo: any) => ({
      id: photo.id,
      url: photo.url,
      src: { medium: photo.src.medium, large: photo.src.large },
      alt: photo.alt || query
    }));
  } catch (error) {
    return [];
  }
};

// 真實天氣查詢
const fetchRealWeather = async (location: string) => {
  try {
    const searchLocation = location.includes('Taiwan') ? location : `${location}, Taiwan`;
    const response = await fetch(`https://wttr.in/${encodeURIComponent(searchLocation)}?format=j1`);
    if (!response.ok) throw new Error('Weather API Error');
    const data = await response.json();
    const current = data.current_condition[0];
    
    return {
      temp: parseInt(current.temp_C),
      condition: current.weatherDesc[0].value,
      humidity: parseInt(current.humidity),
      feelsLike: parseInt(current.FeelsLikeC),
      precip: current.precipMM > 0 ? `${current.precipMM}mm` : '0%'
    };
  } catch (e) {
    return null;
  }
};

const repairJson = (jsonString: string) => {
    let clean = jsonString.replace(/``````/g, '').trim();
    const firstBrace = clean.indexOf('{');
    const lastBrace = clean.lastIndexOf('}');
    if (firstBrace !== -1 && lastBrace !== -1) clean = clean.substring(firstBrace, lastBrace + 1);
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

  const realWeather = await fetchRealWeather(location);
  let weatherInfo = realWeather 
    ? `真實天氣: 氣溫 ${realWeather.temp}°C, 體感 ${realWeather.feelsLike}°C, 濕度 ${realWeather.humidity}%, 狀況 ${realWeather.condition}`
    : `模擬天氣`;

  // 🔥 關鍵修正：Prompt 強制要求「繁體中文回應」但「保留英文關鍵字給圖片搜尋」
  const prompt = `
    你是一位專業的時尚造型師。
    使用者：${gender}, 風格 ${style}, 個人色彩季型: ${colorSeason} (Bright Winter 亮冬型特點：高對比、鮮豔、冷色調，如寶石藍、正紅、黑、白。絕對避免大地色、卡其色、橘色)。
    時間：${targetDay} ${timeOfDay}。
    ${weatherInfo}

    請嚴格遵守以下 JSON 格式回傳，不要有任何 Markdown 標記：
    {
      "weather": {
        "location": "${location}",
        "temperature": 25,
        "condition": "多雲時晴",
        "humidity": "75%",
        "precipitation": "10%",
        "feels_like": 28
      },
      "outfit": {
        "summary": "一句簡短的繁體中文穿搭總結",
        "reason": "用繁體中文解釋為什麼這樣穿（強調亮冬型的高對比配色）",
        "tips": "針對濕度或防曬的繁體中文貼心小提醒",
        "color_palette": ["Hex1", "Hex2", "Hex3", "Hex4"], 
        "items": [
          {"name": "單品名稱(繁體中文)", "type": "Top", "color": "顏色名稱(繁體中文)", "material": "材質(中文)", "reason": "推薦原因(中文)"},
          {"name": "單品名稱(繁體中文)", "type": "Bottom", "color": "顏色名稱(繁體中文)", "material": "材質(中文)", "reason": "推薦原因(中文)"}
        ],
        "visualPrompts": ["High contrast fashion outfit ${gender} ${style} royal blue and black street style"] 
      }
    }
    
    注意：
    1. items.name 請用中文，例如「寶石藍 T恤」。
    2. visualPrompts 必須用英文，且必須包含亮冬型關鍵字 (如 Royal Blue, Black, White, High Contrast)，不要出現 Beige 或 Khaki。
  `;

  try {
    const genAI = new GoogleGenerativeAI(GOOGLE_API_KEY);
    const model = genAI.getGenerativeModel({ model: MODEL_NAME });
    const result = await model.generateContent(prompt);
    const parsedData = JSON.parse(repairJson(result.response.text()));

    if (realWeather) {
        parsedData.weather = {
            ...parsedData.weather,
            temperature: realWeather.temp,
            condition: realWeather.condition, // 這裡可能會是英文，若要中文需在 ResultDisplay 翻譯，但先求有
            humidity: `${realWeather.humidity}%`,
            feels_like: realWeather.feelsLike,
            precipitation: realWeather.precip
        };
    }

    if (parsedData.outfit?.visualPrompts?.length > 0) {
        const mainQuery = parsedData.outfit.visualPrompts[0];
        // 備用搜尋：強制加上亮冬關鍵字
        const backupQuery = `winter color type fashion ${gender} royal blue black high contrast`;
        
        const [images1, images2] = await Promise.all([
            fetchPexelsImages(mainQuery),
            fetchPexelsImages(backupQuery)
        ]);
        parsedData.generatedImages = [...images1, ...images2].slice(0, 3);
    }
    
    return parsedData;

  } catch (e) {
    console.error(e);
    throw e;
  }
};