import { WeatherOutfitResponse, Gender, Style, ColorSeason, TimeOfDay, TargetDay } from '../types';
import { GoogleGenerativeAI } from '@google/generative-ai';

const MODEL_NAME = "gemini-2.5-flash";

const getApiKey = (keyName: string) => {
  const envKey = import.meta.env[keyName];
  return envKey ? envKey.trim() : null;
}

// 🌤️ 天氣狀況翻譯
const translateCondition = (cond: string): string => {
  if (!cond) return '多雲';
  const c = cond.toLowerCase().trim();
  
  if (c.includes('partly') && c.includes('cloudy')) return '多雲時晴';
  if (c.includes('sunny') || c.includes('clear')) return '晴朗';
  if (c.includes('cloudy') || c.includes('overcast')) return '多雲';
  if (c.includes('mist') || c.includes('fog')) return '有霧';
  if (c.includes('rain') || c.includes('drizzle')) return '有雨';
  if (c.includes('shower')) return '陣雨';
  if (c.includes('thunder')) return '雷雨';
  if (c.includes('snow')) return '下雪';
  
  return cond; 
};

// 📸 Pexels 圖片搜尋 (改為接收 AI 產生的精準關鍵字)
const fetchPexelsImages = async (searchQuery: string): Promise<any[]> => {
  const PEXELS_API_KEY = getApiKey('VITE_PEXELS_API_KEY');
  
  // 如果沒有關鍵字或 Key，回傳空陣列
  if (!PEXELS_API_KEY || !searchQuery) return [];
  
  try {
    // 加上 full body 與 street style 確保是穿搭全身照
    const finalQuery = `${searchQuery} full body street style`;
    
    const url = `https://api.pexels.com/v1/search?query=${encodeURIComponent(finalQuery)}&per_page=3&orientation=portrait`;
    const response = await fetch(url, { headers: { Authorization: PEXELS_API_KEY } });
    
    if (!response.ok) return [];
    
    const data = await response.json();
    return data.photos.map((p: any) => ({ 
        id: p.id, 
        url: p.url, 
        src: { medium: p.src.medium, large: p.src.large }, 
        alt: p.alt || searchQuery 
    }));
  } catch (error) { 
    console.error("Pexels API Error:", error);
    return []; 
  }
};

// 🌡️ 天氣資料抓取
const fetchRealWeather = async (location: string, displayLocation: string) => {
  try {
    const isKnownLocation = ['汐止', '泰山', '雙北', '新北'].some(l => displayLocation.includes(l));
    const searchLocation = isKnownLocation 
      ? `${location},New+Taipei+City,Taiwan`
      : `${location},Taiwan`;
      
    const response = await fetch(`https://wttr.in/${encodeURIComponent(searchLocation)}?format=j1`);
    if (!response.ok) throw new Error('Weather API Error');
    const data = await response.json();
    const today = data.weather[0];
    const current = data.current_condition[0];
    
    return {
      temp_C: parseInt(current.temp_C),
      FeelsLikeC: parseInt(current.FeelsLikeC),
      humidity: parseInt(current.humidity),
      maxtempC: parseInt(today.maxtempC),
      mintempC: parseInt(today.mintempC),
      chanceofrain: parseInt(today.hourly[0].chanceofrain),
      condition: translateCondition(current.weatherDesc[0].value)
    };
  } catch (e) { 
    console.error("天氣 API 錯誤:", e);
    return null; 
  }
};

const repairJson = (jsonString: string) => {
    let clean = jsonString.replace(/``````/g, '').trim();
    const first = clean.indexOf('{'), last = clean.lastIndexOf('}');
    return (first !== -1 && last !== -1) ? clean.substring(first, last + 1) : clean;
};

const FALLBACK_DATA: WeatherOutfitResponse = {
  weather: { location: "Taipei", temperature: 25, feels_like: 27, maxtempC: 28, mintempC: 22, humidity: "70%", precipitation: "20%", condition: "多雲" },
  outfit: {
    summary: "預設建議",
    reason: "系統暫時忙碌，建議穿著舒適透氣。",
    tips: "請稍後再試。",
    color_palette: ["白色", "黑色", "藍色"],
    items: [
      { name: "白色T恤", color: "白色", material: "棉質", type: "top" },
      { name: "牛仔褲", color: "藍色", material: "丹寧", type: "pants" },
      { name: "小白鞋", color: "白色", material: "帆布", type: "shoes" },
      { name: "側背包", color: "黑色", material: "尼龍", type: "bag" }
    ],
    visualPrompts: ["casual fashion"]
  },
  generatedImages: [],
  targetDay: "today"
};

// 🤖 主函式
export const getGeminiSuggestion = async (
  location: string, 
  displayLocation: string, 
  gender: Gender, 
  style: Style, 
  colorSeason: ColorSeason, 
  timeOfDay: TimeOfDay, 
  targetDay: TargetDay
): Promise<WeatherOutfitResponse> => {
  const GOOGLE_API_KEY = getApiKey('VITE_GOOGLE_API_KEY');
  if (!GOOGLE_API_KEY) return { ...FALLBACK_DATA, weather: { ...FALLBACK_DATA.weather, location: displayLocation } };

  const realWeather = await fetchRealWeather(location, displayLocation);
  
  const timeDescription = `${targetDay === 'tomorrow' ? '明天' : '今天'}${timeOfDay === 'morning' ? '早上' : timeOfDay === 'afternoon' ? '下午' : '晚上'}`;
  const weatherInfo = realWeather 
    ? `預測時間點「${timeDescription}」的參考天氣為：氣溫 ${realWeather.temp_C}°C (體感 ${realWeather.FeelsLikeC}°C), 天氣狀況 ${realWeather.condition}, 最高溫 ${realWeather.maxtempC}°C, 最低溫 ${realWeather.mintempC}°C` 
    : '天氣資訊取得中';

  // 🔥 Prompt 優化：要求 AI 提供搜尋關鍵字
  const prompt = `
    你是一位頂尖時尚造型師。請根據以下條件提供一套完整的穿搭建議。
    - 使用者: ${gender}, 風格 ${style}, 個人色彩: ${colorSeason}
    - 地點: ${displayLocation}
    - 預測時間: ${timeDescription}
    - 詳細天氣資訊: ${weatherInfo}

    請嚴格依照此 JSON 格式回傳，不要有任何多餘的文字：
    {
      "weather": { "location": "${displayLocation}", "temperature": 25, "feels_like": 28, "maxtempC": 30, "mintempC": 24, "humidity": "75%", "precipitation": "10%" },
      "outfit": {
        "summary": "一句話風格總結",
        "reason": "詳細穿搭理由",
        "tips": "實用小提醒",
        "color_palette": ["顏色1", "顏色2", "顏色3"],
        "items": [
          {"name": "單品名", "color": "顏色", "material": "材質", "type": "top"},
          {"name": "單品名", "color": "顏色", "material": "材質", "type": "pants"},
          {"name": "單品名", "color": "顏色", "material": "材質", "type": "shoes"},
          {"name": "單品名", "color": "顏色", "material": "材質", "type": "bag"}
        ],
        "visualPrompts": ["給 Pexels 使用的英文搜尋關鍵字，描述這套穿搭的視覺樣子，例如 'woman wearing white knit sweater and blue jeans street style'"]
      }
    }
    ⚠️ items 必須包含 'top' 和 'pants'。visualPrompts 請給我英文的描述。
  `;

  try {
    const genAI = new GoogleGenerativeAI(GOOGLE_API_KEY);
    const model = genAI.getGenerativeModel({ model: MODEL_NAME });
    const result = await model.generateContent(prompt);
    const text = result.response.text();
    if (!text) throw new Error("Empty response");
    const parsedData = JSON.parse(repairJson(text));

    // 回填真實天氣
    if (realWeather) {
        parsedData.weather = { 
          ...parsedData.weather, 
          ...realWeather, 
          humidity: `${realWeather.humidity}%`, 
          precipitation: `${realWeather.chanceofrain}%` 
        };
    }
    parsedData.targetDay = targetDay;

    // 🔥 使用 AI 產生的關鍵字去搜尋圖片
    const aiSearchQuery = parsedData.outfit?.visualPrompts?.[0] || `${style} ${gender} outfit`;
    const images = await fetchPexelsImages(aiSearchQuery);
    parsedData.generatedImages = images.slice(0, 3);
    
    return parsedData;
  } catch (e) { 
    console.error('Gemini 錯誤:', e);
    const safeData = { ...FALLBACK_DATA, targetDay };
    if (realWeather) {
       safeData.weather = { 
         ...safeData.weather, 
         location: displayLocation, 
         temperature: realWeather.temp_C,
         feels_like: realWeather.FeelsLikeC,
         maxtempC: realWeather.maxtempC,
         mintempC: realWeather.mintempC,
         humidity: `${realWeather.humidity}%`,
         precipitation: `${realWeather.chanceofrain}%`,
         condition: realWeather.condition
       };
    }
    return safeData;
  }
};
