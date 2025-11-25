import { WeatherOutfitResponse, Gender, Style, ColorSeason, TimeOfDay, TargetDay } from '../types';
import { GoogleGenerativeAI } from '@google/generative-ai';

const MODEL_NAME = "gemini-2.5-flash";

const getApiKey = (keyName: string) => {
  const envKey = import.meta.env[keyName];
  return envKey ? envKey.trim() : null;
}

// 1. 日期計算 (保持精準)
const getDateString = (targetDay: TargetDay): string => {
  const date = new Date();
  if (targetDay === 'tomorrow') {
    date.setDate(date.getDate() + 1);
  }
  return date.toISOString().split('T')[0];
};

// 2. 智慧建議引擎 (保持 V22 的數據判斷，這是準確度的核心)
const generateSmartAdvice = (temp: number, rainChance: number, humidity: number): string => {
  let advice = "";

  // 溫度策略
  if (temp >= 30) advice += "極度炎熱，務必推薦透氣短袖。";
  else if (temp >= 26) advice += "悶熱，建議短袖或薄長袖。";
  else if (temp >= 20) advice += "舒適，薄長袖或短袖配薄外套。";
  else if (temp >= 16) advice += "轉涼，建議長袖、針織衫加防風外套。";
  else if (temp >= 12) advice += "寒冷，建議毛衣、發熱衣、厚外套。";
  else advice += "寒流等級，務必推薦羽絨衣、圍巾保暖。";

  // 降雨策略
  if (rainChance >= 60) advice += " 高機率下雨，強烈建議雨具、防水鞋、深色褲子。";
  else if (rainChance >= 30) advice += " 可能有雨，建議帶傘。";
  
  return advice;
};

// 3. 天氣翻譯 (保持不變)
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

// 4. Pexels 搜尋 (優化關鍵字，確保圖片精準)
const fetchPexelsImages = async (searchQuery: string): Promise<any[]> => {
  const PEXELS_API_KEY = getApiKey('VITE_PEXELS_API_KEY');
  if (!PEXELS_API_KEY || !searchQuery) return [];
  
  try {
    // 加上 "outfit" 確保是穿搭照
    const finalQuery = `${searchQuery} outfit full body fashion -landscape -building`;
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

const FALLBACK_DATA: WeatherOutfitResponse = {
  weather: { location: "Taipei", temperature: 22, feels_like: 20, maxtempC: 24, mintempC: 20, humidity: "75%", precipitation: "30%", condition: "多雲" },
  outfit: {
    summary: "舒適休閒風：薄針織 + 牛仔褲", 
    reason: "明天氣溫舒適但早晚偏涼，薄針織衫透氣又保暖，搭配牛仔褲俐落有型。",
    tips: "帶件薄外套以備不時之需，怕冷可加圍巾。",
    color_palette: ["米白", "海軍藍", "淺灰"],
    items: [
      { name: "薄針織上衣", color: "米白", material: "針織", type: "top" },
      { name: "直筒牛仔褲", color: "藍色", material: "丹寧", type: "pants" },
      { name: "休閒小白鞋", color: "白色", material: "帆布", type: "shoes" },
      { name: "帆布包", color: "米色", material: "帆布", type: "bag" }
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
  if (!GOOGLE_API_KEY) return { ...FALLBACK_DATA, weather: { ...FALLBACK_DATA.weather, location: displayLocation } };

  const realWeather = await fetchRealWeather(location, displayLocation, targetDay);
  const exactDate = getDateString(targetDay);
  
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
    你是一位專業時尚顧問。使用者想知道明天怎麼穿最剛好。
    
    現況資料：
    - 使用者: ${gender}, 風格 ${style}, 個人色彩: ${colorSeason}
    - 地點: ${displayLocation}
    - 時間: ${timeDescription}
    - 天氣數據: ${weatherInfo}
    - 關鍵天氣策略: ${dynamicAdvice}

    請依照此 JSON 格式回傳 (請提供具體且實用的建議)：
    {
      "weather": { "location": "${displayLocation}", "temperature": 20, "feels_like": 18, "maxtempC": 22, "mintempC": 17, "humidity": "80%", "precipitation": "20%" },
      "outfit": {
        "summary": "一句話風格總結 (例如：簡約保暖風格)", 
        "reason": "請解釋『為什麼這樣穿最舒服』，包含對溫度、降雨的應對 (例如：這樣穿早上出門不冷，中午也不會太悶，且鞋子防潑水不怕小雨)",
        "tips": "請列出『必備配件』或『注意事項』 (例如：務必攜帶折疊傘、建議洋蔥式穿搭)",
        "color_palette": ["顏色1", "顏色2", "顏色3"],
        "items": [
          {"name": "具體單品名 (如：高領發熱衣)", "color": "顏色", "material": "材質", "type": "top"},
          {"name": "具體單品名 (如：九分直筒褲)", "color": "顏色", "material": "材質", "type": "pants"},
          {"name": "具體單品名 (如：防水休閒鞋)", "color": "顏色", "material": "材質", "type": "shoes"},
          {"name": "具體單品名", "color": "顏色", "material": "材質", "type": "bag"},
          {"name": "外套/配件", "color": "顏色", "material": "材質", "type": "jacket"} 
        ],
        "visualPrompts": ["給 Pexels 的精確指令，包含具體單品名稱，例如 'woman wearing beige trench coat and black trousers street style'"]
      }
    }
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
    parsedData.generatedImages = images && images.length > 0 ? images.slice(0, 3) : [];
    
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
