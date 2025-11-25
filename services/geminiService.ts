import { WeatherOutfitResponse, Gender, Style, ColorSeason, TimeOfDay, TargetDay } from '../types';
import { GoogleGenerativeAI } from '@google/generative-ai';

const MODEL_NAME = "gemini-2.5-flash";

const getApiKey = (keyName: string) => {
  const envKey = import.meta.env[keyName];
  return envKey ? envKey.trim() : null;
}

const getDateString = (targetDay: TargetDay): string => {
  const date = new Date();
  if (targetDay === 'tomorrow') {
    date.setDate(date.getDate() + 1);
  }
  return date.toISOString().split('T')[0];
};

// 🧠 智慧建議引擎：根據真實數據生成穿搭策略
const generateSmartAdvice = (temp: number, rainChance: number, humidity: number): string => {
  let advice = "";

  // 1. 溫度策略 (Temperature Strategy)
  if (temp >= 30) {
    advice += "極度炎熱，請務必推薦透氣、排汗、短袖衣物，避免多層次穿搭。";
  } else if (temp >= 26) {
    advice += "天氣悶熱，建議短袖或薄長袖，材質以棉麻為主。";
  } else if (temp >= 20) {
    advice += "舒適偏暖，適合薄長袖或短袖搭配薄外套，方便穿脫。";
  } else if (temp >= 16) {
    advice += "天氣轉涼，有涼意，建議穿著長袖、針織衫，並搭配防風外套。";
  } else if (temp >= 12) {
    advice += "天氣寒冷，需要保暖，建議穿著毛衣、發熱衣、厚外套或大衣。";
  } else {
    advice += "極度寒冷(寒流)，請務必推薦羽絨衣、圍巾、手套等重裝備保暖。";
  }

  // 2. 降雨策略 (Rain Strategy)
  if (rainChance >= 70) {
    advice += " 降雨機率極高，請強烈建議攜帶雨具，推薦穿著防水鞋、雨靴或深色耐髒褲子。";
  } else if (rainChance >= 40) {
    advice += " 可能有雨，建議攜帶摺疊傘，鞋子最好具備防潑水功能。";
  }

  // 3. 濕度策略 (Humidity Strategy)
  if (humidity >= 80 && temp > 25) {
    advice += " 濕度很高且悶熱，體感溫度會更高，請特別強調衣物的透氣性。";
  } else if (humidity >= 80 && temp < 18) {
    advice += " 濕冷天氣，體感溫度會比實際更低，請建議加強保暖，例如多穿一件內搭。";
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

const fetchPexelsImages = async (searchQuery: string): Promise<any[]> => {
  const PEXELS_API_KEY = getApiKey('VITE_PEXELS_API_KEY');
  if (!PEXELS_API_KEY || !searchQuery) return [];
  
  try {
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

const FALLBACK_DATA: WeatherOutfitResponse = {
  weather: { location: "Taipei", temperature: 20, feels_like: 18, maxtempC: 22, mintempC: 18, humidity: "80%", precipitation: "30%", condition: "陰短暫雨" },
  outfit: {
    summary: "天氣不穩定",
    reason: "建議攜帶雨具以備不時之需。",
    tips: "多層次穿搭是最好的選擇。",
    color_palette: ["深藍", "灰色", "白色"],
    items: [
      { name: "風衣外套", color: "深藍", material: "尼龍", type: "jacket" },
      { name: "棉質上衣", color: "白色", material: "棉", type: "top" },
      { name: "牛仔褲", color: "藍色", material: "丹寧", type: "pants" },
      { name: "休閒鞋", color: "灰色", material: "皮革", type: "shoes" }
    ],
    visualPrompts: ["casual outfit street style"]
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
  
  // 🔥 V22 核心：根據真實天氣數據，生成動態建議
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
    
    🔥 關鍵穿搭策略 (請務必遵守):
    ${dynamicAdvice}

    請嚴格依照此 JSON 格式回傳：
    {
      "weather": { "location": "${displayLocation}", "temperature": 20, "feels_like": 18, "maxtempC": 22, "mintempC": 17, "humidity": "80%", "precipitation": "20%" },
      "outfit": {
        "summary": "一句話風格總結",
        "reason": "詳細穿搭理由 (請解釋為什麼這樣穿符合上述天氣策略)",
        "tips": "實用小提醒 (例如：是否帶傘、防曬、洋蔥式穿搭)",
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
    return safeData;
  }
};
