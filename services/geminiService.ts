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

const generateSmartAdvice = (temp: number, rainChance: number, humidity: number): string => {
  let advice = "";
  if (temp >= 30) advice += "極熱，推薦涼感透氣材質。";
  else if (temp >= 26) advice += "悶熱，建議短袖或薄長袖。";
  else if (temp >= 20) advice += "舒適，薄長袖或短袖配薄外套。";
  else if (temp >= 16) advice += "轉涼，建議長袖、針織衫加防風外套。";
  else if (temp >= 12) advice += "寒冷，一定要穿厚外套或羽絨衣。";
  else advice += "寒流等級，務必保暖。";

  if (rainChance >= 60) advice += " 高機率下雨，推薦防水鞋或雨靴。";
  else if (rainChance >= 30) advice += " 可能下雨，建議隨身攜帶折疊傘。";
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
    // 極簡化，但這次 query 裡會包含顏色
    const finalQuery = `${searchQuery} outfit`;
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
    summary: "防風保暖公式：防水風衣 + 亮色發熱衣", 
    reason: "汐止濕冷，建議外層穿深藍防水風衣擋雨抗風。

內搭寶藍色發熱衣保暖。進室內脫外套後，亮色內搭依然有型。",
    tips: "🌧️ 【天氣重點】汐止濕冷，降雨機率高，外層防風防水是關鍵。

🧥 【穿搭實戰】內搭寶藍色發熱衣保暖，進室內脫外套後，亮色內搭依然有型。

🚇 【通勤細節】雨天建議穿深色褲防髒，搭配切爾西雨靴更時尚。務必攜帶折疊傘！",
    color_palette: ["米白", "海軍藍", "淺灰"],
    items: [
      { name: "高領發熱衣", color: "寶藍", material: "機能布", type: "top" },
      { name: "直筒牛仔褲", color: "深藍", material: "丹寧", type: "pants" },
      { name: "切爾西雨靴", color: "黑色", material: "橡膠", type: "shoes" },
      { name: "尼龍後背包", color: "黑色", material: "尼龍", type: "bag" },
      { name: "防水風衣", color: "深藍", material: "尼龍", type: "jacket" }
    ],
    // 🔥 Fallback 也要符合 Bright Winter
    visualPrompts: ["woman wearing navy trench coat and blue jeans street style"]
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
    你是一位專業的個人造型顧問。請為使用者提供一份「實用與時尚兼具」的穿搭建議。

    現況資料：
    - 使用者: ${gender}, 風格 ${style}, 個人色彩: ${colorSeason}
    - 地點: ${displayLocation}
    - 時間: ${timeDescription}
    - 天氣數據: ${weatherInfo}
    - 關鍵策略: ${dynamicAdvice}

    請依照此 JSON 格式回傳 (請務必在 tips 欄位中使用 '\
\
' 來換行)：
    {
      "weather": { "location": "${displayLocation}", "temperature": 20, "feels_like": 18, "maxtempC": 22, "mintempC": 17, "humidity": "80%", "precipitation": "20%" },
      "outfit": {
        "summary": "【穿搭公式】(例如：防水風衣 + 亮色發熱衣 + 雨靴)", 
        "reason": "簡短帶過即可",
        "tips": "🌧️ 【天氣重點】汐止濕冷，降雨機率高...\
\
🧥 【穿搭實戰】內搭選用${colorSeason}色系點亮造型...\
\
🚇 【通勤細節】雨天建議穿深色褲防髒...",
        "color_palette": ["顏色1", "顏色2", "顏色3"],
        "items": [
          {"name": "具體單品 (如：高領發熱衣)", "color": "顏色", "material": "材質", "type": "top"},
          {"name": "具體單品 (如：深色直筒褲)", "color": "顏色", "material": "材質", "type": "pants"},
          {"name": "具體單品 (如：切爾西雨靴)", "color": "顏色", "material": "材質", "type": "shoes"},
          {"name": "具體單品 (如：尼龍後背包)", "color": "顏色", "material": "材質", "type": "bag"},
          {"name": "外套/配件 (如：長版風衣)", "color": "顏色", "material": "材質", "type": "jacket"} 
        ],
        // 🔥 V33 修正：強制在搜尋關鍵字中加入具體顏色
        "visualPrompts": ["請給我一組英文關鍵字，格式為：'性別 + 具體顏色 + 主要單品 + 風格'。例如：'woman navy trench coat street style' 或 'woman bright blue sweater street style'。請務必選用符合 ${colorSeason} 的顏色。"]
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
        parsedData.weather = { ...parsedData.weather, ...realWeather, humidity: `${realWeather.humidity}%`, precipitation: `${realWeather.chanceofrain}%` };
    }
    parsedData.targetDay = targetDay;

    const aiSearchQuery = parsedData.outfit?.visualPrompts?.[0] || `${style} ${gender} outfit`;
    const images = await fetchPexelsImages(aiSearchQuery);
    parsedData.generatedImages = images && images.length > 0 ? images.slice(0, 3) : [];
    
    return parsedData;

  } catch (e) { 
    console.error('Gemini 錯誤:', e);
    const safeData = { ...FALLBACK_DATA, targetDay };
    // ...
    return safeData;
  }
};