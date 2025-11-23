import { WeatherOutfitResponse, Gender, Style, ColorSeason, TimeOfDay, TargetDay } from '../types';

const MODEL_NAME = "gemini-2.5-flash"; 

const getApiKey = (keyName: string) => {
  const envKey = import.meta.env[keyName];
  if (!envKey) return null;
  return envKey.trim();
}

function simplifyColorForSearch(query: string): string {
    const map: Record<string, string> = { "electric blue": "royal blue", "hot pink": "bright pink", "icy grey": "light grey", "pine green": "dark green", "emerald green": "dark green", "mustard": "yellow", "rust": "orange brown", "terracotta": "brown orange", "sage green": "light green", "oatmeal": "beige", "taupe": "brown grey", "mauve": "purple grey", "burgundy": "dark red", "teal": "blue green" };
    let simpleQuery = query.toLowerCase();
    Object.keys(map).forEach(key => { if (simpleQuery.includes(key)) simpleQuery = simpleQuery.replace(key, map[key]); });
    return simpleQuery;
}

async function fetchPexelsImages(query: string): Promise<string[]> {
    const pexelsKey = getApiKey("VITE_PEXELS_API_KEY");
    if (!pexelsKey) return [];
    try {
        const randomPage = Math.floor(Math.random() * 5) + 1;
        let safeQuery = simplifyColorForSearch(query);
        if (!safeQuery.includes("outfit") && !safeQuery.includes("fashion")) safeQuery = `${safeQuery} outfit`; 
        safeQuery += " street style";
        const url = `https://api.pexels.com/v1/search?query=${encodeURIComponent(safeQuery)}&per_page=3&page=${randomPage}&orientation=portrait`;
        const res = await fetch(url, { headers: { Authorization: pexelsKey } });
        if (!res.ok) return [];
        const data = await res.json();
        if (data.photos.length === 0) {
            const colorOnly = safeQuery.split(" ").slice(0, 2).join(" ") + " outfit";
            const retryUrl = `https://api.pexels.com/v1/search?query=${encodeURIComponent(colorOnly)}&per_page=3&orientation=portrait`;
            const retryRes = await fetch(retryUrl, { headers: { Authorization: pexelsKey } });
            const retryData = await retryRes.json();
            return retryData.photos.map((photo: any) => photo.src.large2x || photo.src.medium);
        }
        return data.photos.map((photo: any) => photo.src.large2x || photo.src.medium);
    } catch (e) { return []; }
}

function repairJson(jsonString: string): string {
    let fixed = jsonString.trim();
    fixed = fixed.replace(/``````/g, "");
    const firstBrace = fixed.indexOf('{');
    const lastBrace = fixed.lastIndexOf('}');
    if (firstBrace !== -1 && lastBrace !== -1) fixed = fixed.substring(firstBrace, lastBrace + 1);
    return fixed;
}

async function fetchRealWeather(location: string): Promise<string> {
    try {
        let searchLoc = location;
        if (!searchLoc.includes("台灣") && !searchLoc.includes("Taiwan") && !searchLoc.includes("Japan") && !searchLoc.includes("Korea") && !searchLoc.includes("China")) {
             searchLoc = `${location}, Taiwan`; 
        }
        
        const res = await fetch(`https://wttr.in/${encodeURIComponent(searchLoc)}?format=j1`);
        
        if (!res.ok) {
            console.warn("Weather API returned status:", res.status);
            return ""; // 如果 API 掛了，優雅降級，讓 AI 自己猜
        }
        
        const data = await res.json();
        
        // 🔥 防呆保護：確保所有屬性都存在再讀取
        const current = data.current_condition?.[0];
        if (!current) return "";

        const temp = current.temp_C || "25";
        const feelsLike = current.FeelsLikeC || temp;
        const humidity = current.humidity || "70";
        const weatherDesc = current.lang_zh_TW?.[0]?.value || current.weatherDesc?.[0]?.value || "多雲";
        
        // 嘗試取得區域名稱，若失敗則回傳原搜尋地點
        const areaName = data.nearest_area?.[0]?.areaName?.[0]?.value || location;
        
        // 嘗試取得降雨機率
        const rainProb = data.weather?.[0]?.hourly?.[0]?.chanceofrain || "0";

        return `
        【真實天氣】
        - 地點: ${areaName}
        - 氣溫: ${temp}°C
        - 體感: ${feelsLike}°C
        - 濕度: ${humidity}%
        - 天氣: ${weatherDesc}
        - 降雨機率: ${rainProb}%
        (請務必根據濕度調整建議，並將數值填入 weather.humidity)
        `;
    } catch (e) { 
        console.error("Weather fetch error:", e);
        return ""; // 發生任何錯誤都回傳空字串，不要讓整個流程掛掉
    }
}

export const getGeminiSuggestion = async (
  location: string,
  gender: Gender,
  style: Style,
  colorSeason: ColorSeason,
  targetDay: TargetDay,
  timeOfDay: TimeOfDay
): Promise<WeatherOutfitResponse> => {

  const googleKey = getApiKey("VITE_GOOGLE_API_KEY");
  if (!googleKey) throw new Error("API Key Missing");

  const genderStr = gender === Gender.Male ? '男士' : '女士';
  const styleStr = style === Style.Casual ? '休閒' : '正式';
  const dayLabel = targetDay === TargetDay.Today ? '今天' : '明天';

  const realWeather = await fetchRealWeather(location);

  const prompt = `
  角色：專業氣象色彩顧問。
  使用者：${genderStr}, 風格：${styleStr}。
  任務：針對「${colorSeason}」，在「${location} ${dayLabel}${timeOfDay}」提供穿搭。
  ${realWeather}

  【濕度穿搭邏輯】
  1. 濕度高 (>80%) 且熱：推薦亞麻、排汗材質，避免厚棉。
  2. 濕度高 (>80%) 且冷：體感會更冷，需防風防水，建議洋蔥式穿法。
  3. 乾燥：注意保濕，可選親膚棉質。

  【圖示選擇 (icon)】
  請從清單選擇最合適的 icon key：
  "t-shirt", "shirt", "sweater", "hoodie", "jacket", "coat", "pants", "shorts", "skirt", "dress", 
  "sneakers", "boots", "formal-shoes", "sandals", "bag", "umbrella", "hat", "scarf", "glasses", "watch"

  【回傳 JSON】
  {
    "location": "...",
    "weather": {
      "temperature": "...", "feelsLike": "...", "humidity": "85%", "rainProb": "...", "description": "...", "advice": "..."
    },
    "outfit": {
      "items": [
         { "item": "單品", "color": "顏色", "reason": "...", "detail": "...", "icon": "t-shirt" }
      ],
      "tips": "...",
      "colorPalette": ["色1", "色2"],
      "colorDescription": "...",
      "visualPrompts": ["Color Item"]
    },
    "generatedImages": []
  }
  `;

  const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL_NAME}:generateContent?key=${googleKey}`;
  let parsedData: WeatherOutfitResponse;

  try {
    const response = await fetch(apiUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: { response_mime_type: "application/json" }
      })
    });
    if (!response.ok) throw new Error("API Fail");
    const data = await response.json();
    const rawText = data.candidates?.[0]?.content?.parts?.[0]?.text || "";
    parsedData = JSON.parse(repairJson(rawText));
    if (!parsedData.weather.advice) parsedData.weather.advice = `天氣${parsedData.weather.description}。`;
  } catch (e) { throw e; }

  if (parsedData.outfit?.visualPrompts?.length > 0) {
      const [images1, images2] = await Promise.all([
          fetchPexelsImages(parsedData.outfit.visualPrompts[0]),
          fetchPexelsImages(parsedData.outfit.visualPrompts[1])
      ]);
      parsedData.generatedImages = [...images1.slice(0, 2), ...images2.slice(0, 1)];
      if (parsedData.generatedImages.length === 0) {
           const backupColor = parsedData.outfit.items[0].color; 
           parsedData.generatedImages = await fetchPexelsImages(`${backupColor} fashion`);
      }
  }
  return parsedData;
};
