import { WeatherOutfitResponse, Gender, Style, ColorSeason, TimeOfDay, TargetDay } from '../types';
import { GoogleGenerativeAI } from '@google/generative-ai';

const MODEL_NAME = "gemini-2.5-flash";

const getApiKey = (keyName: string) => {
  const envKey = import.meta.env[keyName];
  return envKey ? envKey.trim() : null;
}

const fetchPexelsImages = async (query: string): Promise<any[]> => {
  const PEXELS_API_KEY = getApiKey('VITE_PEXELS_API_KEY');
  if (!PEXELS_API_KEY) return [];
  try {
    const safeQuery = `${query} fashion outfit portrait high quality`;
    const url = `https://api.pexels.com/v1/search?query=${encodeURIComponent(safeQuery)}&per_page=3&orientation=portrait`;
    const response = await fetch(url, { headers: { Authorization: PEXELS_API_KEY } });
    if (!response.ok) return [];
    const data = await response.json();
    return data.photos.map((p: any) => ({ 
        id: p.id, 
        url: p.url, 
        src: { medium: p.src.medium, large: p.src.large }, 
        alt: p.alt || query 
    }));
  } catch (error) { return []; }
};

const fetchRealWeather = async (location: string) => {
  try {
    const searchLocation = location.includes('Taiwan') ? location : `${location}, Taiwan`;
    const response = await fetch(`https://wttr.in/${encodeURIComponent(searchLocation)}?format=j1`);
    if (!response.ok) throw new Error('Weather API Error');
    const data = await response.json();
    const today = data.weather[0];
    return {
      temp_C: parseInt(data.current_condition[0].temp_C),
      FeelsLikeC: parseInt(data.current_condition[0].FeelsLikeC),
      humidity: parseInt(data.current_condition[0].humidity),
      maxtempC: parseInt(today.maxtempC),
      mintempC: parseInt(today.mintempC),
      chanceofrain: parseInt(today.hourly[0].chanceofrain),
      condition: data.current_condition[0].weatherDesc[0].value
    };
  } catch (e) { return null; }
};

const repairJson = (jsonString: string) => {
    let clean = jsonString.replace(/``````/g, '').trim();
    const first = clean.indexOf('{'), last = clean.lastIndexOf('}');
    return (first !== -1 && last !== -1) ? clean.substring(first, last + 1) : clean;
};

// 🔥 預設的安全數據，防止 AI 掛掉時白畫面
const FALLBACK_DATA: WeatherOutfitResponse = {
  weather: { location: "Taipei", temperature: 25, feels_like: 27, maxtempC: 28, mintempC: 22, humidity: "70%", precipitation: "20%", condition: "Cloudy" },
  outfit: {
    summary: "AI 暫時休息中，這是預設建議",
    reason: "系統暫時無法連線，建議穿著舒適透氣的衣物。",
    tips: "請稍後再試，或檢查網路連線。",
    color_palette: ["白色", "黑色", "牛仔藍"],
    items: [
      { name: "簡約白色T恤", color: "白色", material: "棉質", type: "top" },
      { name: "經典直筒牛仔褲", color: "藍色", material: "丹寧", type: "pants" },
      { name: "休閒小白鞋", color: "白色", material: "帆布", type: "shoes" },
      { name: "黑色帆布包", color: "黑色", material: "帆布", type: "bag" }
    ],
    visualPrompts: ["casual fashion"]
  },
  generatedImages: [],
  targetDay: "today"
};

export const getGeminiSuggestion = async (
  location: string, displayLocation: string, gender: Gender, style: Style, colorSeason: ColorSeason, timeOfDay: TimeOfDay, targetDay: TargetDay
): Promise<WeatherOutfitResponse> => {
  const GOOGLE_API_KEY = getApiKey('VITE_GOOGLE_API_KEY');
  
  // 如果沒有 API Key，直接回傳預設值，避免報錯
  if (!GOOGLE_API_KEY) {
      console.error("Missing Google API Key");
      return { ...FALLBACK_DATA, weather: { ...FALLBACK_DATA.weather, location: displayLocation } };
  }

  const realWeather = await fetchRealWeather(location);
  const weatherInfo = realWeather ? `真實天氣：${realWeather.temp_C}°C, 體感${realWeather.FeelsLikeC}°C, 濕度${realWeather.humidity}%, 降雨率${realWeather.chanceofrain}%` : '';

  const prompt = `
    你是一位頂尖時尚造型師。根據以下條件，為使用者提供一套完整的穿搭建議。
    - 使用者: ${gender}, 風格 ${style}, 個人色彩: ${colorSeason}
    - 地點: ${displayLocation}
    - 時間: ${targetDay} ${timeOfDay}
    - 天氣: ${weatherInfo}

    請嚴格依照這個 JSON 格式回傳，不要有任何多餘的文字：
    {
      "weather": { "location": "${displayLocation}", "temperature": 25, "feels_like": 28, "maxtempC": 30, "mintempC": 24, "humidity": "75%", "precipitation": "10%" },
      "outfit": {
        "summary": "一句話風格總結",
        "reason": "詳細的穿搭理由",
        "tips": "搭配小技巧或提醒",
        "color_palette": ["推薦色1", "推薦色2", "推薦色3"],
        "items": [
          {"name": "白色棉質T恤", "color": "白色", "material": "棉質", "type": "top"},
          {"name": "黑色修身寬褲", "color": "黑色", "material": "西裝布", "type": "pants"},
          {"name": "銀色厚底球鞋", "color": "銀色", "material": "皮革", "type": "shoes"},
          {"name": "皮革托特包", "color": "黑色", "material": "皮革", "type": "bag"}
        ],
        "visualPrompts": ["${style} ${gender} street style fashion in ${colorSeason} color palette"]
      }
    }
    ⚠️ 絕對規則：items 陣列中，第一個物件的 type 必須是 'top'，第二個物件的 type 必須是 'pants'。總共至少要有 4 個物件。
  `;

  try {
    const genAI = new GoogleGenerativeAI(GOOGLE_API_KEY);
    const model = genAI.getGenerativeModel({ model: MODEL_NAME });
    const result = await model.generateContent(prompt);
    const text = result.response.text();
    
    if (!text) throw new Error("Empty response from Gemini");

    const parsedData = JSON.parse(repairJson(text));

    if (realWeather) {
        parsedData.weather = { ...parsedData.weather, ...realWeather, humidity: `${realWeather.humidity}%`, precipitation: `${realWeather.chanceofrain}%` };
    }
    
    // 注入 targetDay 以便 ResultDisplay 使用
    parsedData.targetDay = targetDay;

    if (parsedData.outfit?.visualPrompts?.length > 0) { 
        const images = await fetchPexelsImages(parsedData.outfit.visualPrompts[0]);
        parsedData.generatedImages = images.slice(0, 3);
    }
    return parsedData;

  } catch (e) { 
    console.error("Gemini Error:", e);
    // 發生錯誤時回傳預設資料，但保留天氣資訊（如果有抓到的話）
    const safeData = { ...FALLBACK_DATA, targetDay };
    if (realWeather) {
       safeData.weather = { 
         ...safeData.weather, 
         location: displayLocation,
         temperature: realWeather.temp_C,
         maxtempC: realWeather.maxtempC,
         mintempC: realWeather.mintempC,
         humidity: `${realWeather.humidity}%`,
         precipitation: `${realWeather.chanceofrain}%`
       };
    }
    return safeData;
  }
};