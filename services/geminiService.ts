import { WeatherOutfitResponse, Gender, Style, ColorSeason, TimeOfDay, TargetDay } from '../types';
import { GoogleGenerativeAI } from '@google/generative-ai';

const MODEL_NAME = "gemini-2.5-flash";

const getApiKey = (keyName: string) => {
  const envKey = import.meta.env[keyName];
  return envKey ? envKey.trim() : null;
}

// 📅 算出準確日期 (YYYY-MM-DD)
const getDateString = (targetDay: TargetDay): string => {
  const date = new Date();
  if (targetDay === 'tomorrow') {
    date.setDate(date.getDate() + 1);
  }
  return date.toISOString().split('T')[0];
};

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

// 📸 Pexels 搜尋優化：強制加入 "outfit" 相關詞彙，避免出現建築物
const fetchPexelsImages = async (searchQuery: string): Promise<any[]> => {
  const PEXELS_API_KEY = getApiKey('VITE_PEXELS_API_KEY');
  if (!PEXELS_API_KEY || !searchQuery) return [];
  
  try {
    // 🔥 強制加上 "outfit", "fashion", "clothing" 等詞，確保搜到的是人穿衣服
    const finalQuery = `${searchQuery} outfit fashion clothing full body -building -landscape`; 
    
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

const fetchRealWeather = async (location: string, displayLocation: string, targetDay: TargetDay) => {
  try {
    // 🔥 汐止強制加上 New Taipei City，增加準確度
    const isKnownLocation = ['汐止', '泰山', '雙北', '新北'].some(l => displayLocation.includes(l));
    const searchLocation = isKnownLocation 
      ? `${location},New+Taipei+City,Taiwan`
      : `${location},Taiwan`;
      
    const response = await fetch(`https://wttr.in/${encodeURIComponent(searchLocation)}?format=j1`);
    if (!response.ok) throw new Error('Weather API Error');
    const data = await response.json();
    
    // 🔥 嚴格區分今天與明天
    const targetDateIndex = targetDay === 'tomorrow' ? 1 : 0;
    const weatherData = data.weather[targetDateIndex]; 
    
    // 🔥 修正：不使用 current_condition (那是現在的)，改用預報的高低溫平均值
    // wttr.in 的 avgtempC 比較接近實際體感
    const displayTemp = weatherData.avgtempC; 

    return {
      temp_C: parseInt(displayTemp), 
      FeelsLikeC: parseInt(displayTemp) - 1, // 台灣濕冷，體感通常比氣溫低
      humidity: parseInt(weatherData.hourly[4].humidity), // 取中午資料
      maxtempC: parseInt(weatherData.maxtempC),
      mintempC: parseInt(weatherData.mintempC),
      chanceofrain: parseInt(weatherData.hourly[4].chanceofrain), 
      condition: translateCondition(weatherData.hourly[4].weatherDesc[0].value),
      date: weatherData.date 
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
  weather: { location: "Taipei", temperature: 20, feels_like: 18, maxtempC: 22, mintempC: 18, humidity: "80%", precipitation: "30%", condition: "陰短暫雨" },
  outfit: {
    summary: "濕冷天氣對策",
    reason: "天氣轉涼且有雨，建議洋蔥式穿搭。",
    tips: "出門記得攜帶雨具。",
    color_palette: ["深藍", "灰色", "白色"],
    items: [
      { name: "防水風衣", color: "深藍", material: "尼龍", type: "jacket" },
      { name: "針織衫", color: "灰色", material: "羊毛", type: "top" },
      { name: "牛仔褲", color: "藍色", material: "丹寧", type: "pants" },
      { name: "雨靴", color: "黑色", material: "橡膠", type: "shoes" }
    ],
    visualPrompts: ["woman wearing navy rain jacket and grey knit sweater street style"]
  },
  generatedImages: [],
  targetDay: "today"
};

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

  const realWeather = await fetchRealWeather(location, displayLocation, targetDay);
  const exactDate = getDateString(targetDay);
  
  // 🔥 在 Prompt 中加入季節提示
  const seasonHint = "現在是台灣的秋冬季節，天氣通常濕冷，請避免推薦短袖或過於輕薄的衣物。";
  
  const timeDescription = `${exactDate} (${targetDay === 'tomorrow' ? '明天' : '今天'}) ${timeOfDay === 'morning' ? '早上' : timeOfDay === 'afternoon' ? '下午' : '晚上'}`;
  
  const weatherInfo = realWeather 
    ? `預測日期 ${realWeather.date} 的天氣為：氣溫 ${realWeather.temp_C}°C, 天氣狀況 ${realWeather.condition}, 最高溫 ${realWeather.maxtempC}°C, 最低溫 ${realWeather.mintempC}°C, 降雨機率 ${realWeather.chanceofrain}%` 
    : '天氣資訊取得中';

  const prompt = `
    你是一位頂尖時尚造型師。請根據以下條件提供一套完整的穿搭建議。
    - 使用者: ${gender}, 風格 ${style}, 個人色彩: ${colorSeason}
    - 地點: ${displayLocation} (台灣)
    - 時間: ${timeDescription}
    - 天氣: ${weatherInfo}
    - 季節提示: ${seasonHint}

    請嚴格依照此 JSON 格式回傳：
    {
      "weather": { "location": "${displayLocation}", "temperature": 20, "feels_like": 18, "maxtempC": 22, "mintempC": 17, "humidity": "80%", "precipitation": "20%" },
      "outfit": {
        "summary": "一句話風格總結",
        "reason": "詳細穿搭理由 (請考慮濕冷天氣)",
        "tips": "實用小提醒",
        "color_palette": ["顏色1", "顏色2", "顏色3"],
        "items": [
          {"name": "單品名", "color": "顏色", "material": "材質", "type": "top"},
          {"name": "單品名", "color": "顏色", "material": "材質", "type": "pants"},
          {"name": "單品名", "color": "顏色", "material": "材質", "type": "shoes"},
          {"name": "單品名", "color": "顏色", "material": "材質", "type": "bag"},
          {"name": "外套/配件", "color": "顏色", "material": "材質", "type": "jacket"} 
        ],
        "visualPrompts": ["給 Pexels 使用的英文搜尋關鍵字，描述這套穿搭的視覺樣子，必須包含 'outfit' 或 'wearing'，例如 'woman wearing beige trench coat and jeans street style'"]
      }
    }
    ⚠️ items 至少包含 top, pants, shoes。
    ⚠️ 如果天氣低於 22度 或有雨，建議包含 jacket 或 coat。
    ⚠️ visualPrompts 請專注於人物穿搭，不要描述風景。
  `;

  try {
    const genAI = new GoogleGenerativeAI(GOOGLE_API_KEY);
    const model = genAI.getGenerativeModel({ model: MODEL_NAME });
    const result = await model.generateContent(prompt);
    const text = result.response.text();
    if (!text) throw new Error("Empty response");
    const parsedData = JSON.parse(repairJson(text));

    if (realWeather) {
        parsedData.weather = { 
          ...parsedData.weather, 
          ...realWeather, 
          humidity: `${realWeather.humidity}%`, 
          precipitation: `${realWeather.chanceofrain}%` 
        };
    }
    parsedData.targetDay = targetDay;

    const aiSearchQuery = parsedData.outfit?.visualPrompts?.[0] || `${style} ${gender} outfit`;
    const images = await fetchPexelsImages(aiSearchQuery);
    parsedData.generatedImages = images.slice(0, 3);
    
    return parsedData;
  } catch (e) { 
    console.error('Gemini 錯誤:', e);
    const safeData = { ...FALLBACK_DATA, targetDay };
    // ... (錯誤處理保持不變)
    return safeData;
  }
};
