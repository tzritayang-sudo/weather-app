import { WeatherOutfitResponse, Gender, Style, ColorSeason, TimeOfDay, TargetDay } from '../types';
import { GoogleGenerativeAI } from '@google/generative-ai';

const MODEL_NAME = "gemini-2.5-flash";

const getApiKey = (keyName: string) => {
  const envKey = import.meta.env[keyName];
  return envKey ? envKey.trim() : null;
}

// 📅 1. 算出準確日期
const getDateString = (targetDay: TargetDay): string => {
  const date = new Date();
  if (targetDay === 'tomorrow') {
    date.setDate(date.getDate() + 1);
  }
  return date.toISOString().split('T')[0];
};

// 🧠 2. 智慧建議引擎 (保留 V22 的優點：數據驅動)
const generateSmartAdvice = (temp: number, rainChance: number, humidity: number): string => {
  let advice = "";

  // 溫度策略
  if (temp >= 30) {
    advice += "極度炎熱，請務必推薦透氣、排汗、短袖衣物。";
  } else if (temp >= 26) {
    advice += "天氣悶熱，建議短袖或薄長袖。";
  } else if (temp >= 20) {
    advice += "舒適偏暖，適合薄長袖或短袖搭配薄外套。";
  } else if (temp >= 16) {
    advice += "天氣轉涼，有涼意，建議穿著長袖、針織衫，並搭配防風外套。";
  } else if (temp >= 12) {
    advice += "天氣寒冷，需要保暖，建議穿著毛衣、發熱衣、厚外套。";
  } else {
    advice += "極度寒冷(寒流)，請務必推薦羽絨衣、圍巾等重裝備保暖。";
  }

  // 降雨與濕度策略
  if (rainChance >= 60) {
    advice += " 降雨機率高，請強烈建議攜帶雨具，推薦防水鞋或雨靴，避免白鞋。";
  } else if (rainChance >= 30) {
    advice += " 可能有雨，建議攜帶摺疊傘。";
  }
  
  if (humidity >= 80 && temp < 18) {
    advice += " 濕冷天氣體感更冷，建議洋蔥式穿搭加強保暖。";
  }

  return advice;
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

// 📸 3. Pexels 搜尋 (修復圖庫消失問題)
const fetchPexelsImages = async (searchQuery: string): Promise<any[]> => {
  const PEXELS_API_KEY = getApiKey('VITE_PEXELS_API_KEY');
  if (!PEXELS_API_KEY || !searchQuery) return [];
  
  try {
    // V20 的優化搜尋詞，保留！
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
    const isKnownLocation = ['汐止', '泰山', '雙北', '新北'].some(l => displayLocation.includes(l));
    const searchLocation = isKnownLocation 
      ? `${location},New+Taipei+City,Taiwan`
      : `${location},Taiwan`;
      
    const response = await fetch(`https://wttr.in/${encodeURIComponent(searchLocation)}?format=j1`);
    if (!response.ok) throw new Error('Weather API Error');
    const data = await response.json();
    
    const targetDateIndex = targetDay === 'tomorrow' ? 1 : 0;
    const weatherData = data.weather[targetDateIndex]; 
    const displayTemp = weatherData.avgtempC; 

    return {
      temp_C: parseInt(displayTemp), 
      FeelsLikeC: parseInt(displayTemp) - 1, 
      humidity: parseInt(weatherData.hourly[4].humidity),
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

// 🚑 4. 強化版 Fallback Data (萬一真的失敗，顯示的內容也要豐富)
const FALLBACK_DATA: WeatherOutfitResponse = {
  weather: { location: "Taipei", temperature: 22, feels_like: 20, maxtempC: 24, mintempC: 20, humidity: "75%", precipitation: "30%", condition: "多雲" },
  outfit: {
    summary: "舒適休閒風格",
    reason: "天氣舒適但偶有雲層，建議穿著輕便舒適的衣物，適合日常活動。",
    tips: "早晚可能有涼意，建議攜帶一件薄外套備用。若有降雨機率，記得帶傘。",
    color_palette: ["米白", "海軍藍", "淺灰"],
    items: [
      { name: "薄針織上衣", color: "米白", material: "針織", type: "top" },
      { name: "直筒牛仔褲", color: "藍色", material: "丹寧", type: "pants" },
      { name: "休閒小白鞋", color: "白色", material: "帆布", type: "shoes" },
      { name: "帆布包", color: "米色", material: "帆布", type: "bag" },
      { name: "牛仔外套", color: "淺藍", material: "丹寧", type: "jacket" }
    ],
    visualPrompts: ["woman wearing white knit sweater and blue jeans street style"]
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
  
  // 如果沒有 Key，直接回傳豐富版 Fallback
  if (!GOOGLE_API_KEY) return { ...FALLBACK_DATA, weather: { ...FALLBACK_DATA.weather, location: displayLocation } };

  // 1. 先抓天氣
  const realWeather = await fetchRealWeather(location, displayLocation, targetDay);
  const exactDate = getDateString(targetDay);
  
  // 2. 生成智慧建議 (根據真實數據)
  let dynamicAdvice = "請根據天氣數據提供建議。";
  if (realWeather) {
    dynamicAdvice = generateSmartAdvice(
      realWeather.temp_C, 
      realWeather.chanceofrain, 
      realWeather.humidity
    );
  }
  
  const timeDescription = `${exactDate} (${targetDay === 'tomorrow' ? '明天' : '今天'}) ${timeOfDay === 'morning' ? '早上' : timeOfDay === 'afternoon' ? '下午' : '晚上'}`;
  
  const weatherInfo = realWeather 
    ? `預測日期 ${realWeather.date} 的天氣為：日均溫 ${realWeather.temp_C}°C, 濕度 ${realWeather.humidity}%, 降雨機率 ${realWeather.chanceofrain}%` 
    : '天氣資訊取得中';

  const prompt = `
    你是一位頂尖時尚造型師。請根據以下條件提供一套完整的穿搭建議。
    - 使用者: ${gender}, 風格 ${style}, 個人色彩: ${colorSeason}
    - 地點: ${displayLocation} (台灣)
    - 時間: ${timeDescription}
    - 真實天氣數據: ${weatherInfo}
    
    🔥 關鍵穿搭策略 (請務必遵守，這是根據真實氣候分析的):
    ${dynamicAdvice}

    請嚴格依照此 JSON 格式回傳：
    {
      "weather": { "location": "${displayLocation}", "temperature": 20, "feels_like": 18, "maxtempC": 22, "mintempC": 17, "humidity": "80%", "precipitation": "20%" },
      "outfit": {
        "summary": "一句話風格總結 (例如：多層次防雨穿搭)",
        "reason": "詳細穿搭理由 (請解釋為什麼這樣穿符合上述天氣策略，至少 30 字)",
        "tips": "實用小提醒 (例如：攜帶雨具、防曬、洋蔥式穿搭，至少 20 字)",
        "color_palette": ["顏色1", "顏色2", "顏色3"],
        "items": [
          {"name": "單品名", "color": "顏色", "material": "材質", "type": "top"},
          {"name": "單品名", "color": "顏色", "material": "材質", "type": "pants"},
          {"name": "單品名", "color": "顏色", "material": "材質", "type": "shoes"},
          {"name": "單品名", "color": "顏色", "material": "材質", "type": "bag"},
          {"name": "外套/配件", "color": "顏色", "material": "材質", "type": "jacket"} 
        ],
        "visualPrompts": ["給 Pexels 使用的英文搜尋關鍵字，必須包含 'outfit' 或 'wearing'，例如 'woman wearing beige trench coat and jeans street style'"]
      }
    }
    ⚠️ items 至少包含 top, pants, shoes。
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

    // 🔥 3. 關鍵修復：確保有圖片！
    const aiSearchQuery = parsedData.outfit?.visualPrompts?.[0] || `${style} ${gender} outfit`;
    const images = await fetchPexelsImages(aiSearchQuery);
    
    // 如果真的沒搜到圖，也還是回傳一個空陣列，不要讓整個程式掛掉
    parsedData.generatedImages = images && images.length > 0 ? images.slice(0, 3) : [];
    
    return parsedData;

  } catch (e) { 
    console.error('Gemini/Service 錯誤:', e);
    
    // 萬一發生錯誤，回傳豐富版 Fallback Data
    const safeData = { ...FALLBACK_DATA, targetDay };
    
    // 就算失敗，如果天氣有抓到，還是要把天氣填進去
    if (typeof realWeather !== 'undefined' && realWeather) {
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
