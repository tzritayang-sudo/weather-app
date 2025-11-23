import { WeatherOutfitResponse, Gender, Style, ColorSeason, TimeOfDay, TargetDay } from '../types';

// 🔥 鎖定最穩定的 1.5-flash (如果這還不行，請改回您"本來還可以"那時候用的模型名稱)
const MODEL_NAME = "gemini-2.5-flash"; 

const getApiKey = (keyName: string) => {
  const envKey = import.meta.env[keyName];
  if (!envKey) return null;
  return envKey.trim();
}

// ... (保留 simplifyColorForSearch) ...
function simplifyColorForSearch(query: string): string {
    const map: Record<string, string> = { "electric blue": "royal blue", "hot pink": "bright pink", "icy grey": "light grey", "pine green": "dark green", "emerald green": "dark green", "mustard": "yellow", "rust": "orange brown", "terracotta": "brown orange", "sage green": "light green", "oatmeal": "beige", "taupe": "brown grey", "mauve": "purple grey", "burgundy": "dark red", "teal": "blue green" };
    let simpleQuery = query.toLowerCase();
    Object.keys(map).forEach(key => { if (simpleQuery.includes(key)) simpleQuery = simpleQuery.replace(key, map[key]); });
    return simpleQuery;
}

// ... (保留 fetchPexelsImages) ...
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

// ... (保留 repairJson) ...
function repairJson(jsonString: string): string {
    let fixed = jsonString.trim();
    fixed = fixed.replace(/``````/g, "");
    const firstBrace = fixed.indexOf('{');
    const lastBrace = fixed.lastIndexOf('}');
    if (firstBrace !== -1 && lastBrace !== -1) fixed = fixed.substring(firstBrace, lastBrace + 1);
    return fixed;
}

// 🔥 簡化版 fetchRealWeather (移除可能會導致問題的 timeout/controller)
async function fetchRealWeather(location: string): Promise<string> {
    try {
        let searchLoc = location;
        if (!searchLoc.includes("台灣") && !searchLoc.includes("Taiwan") && !searchLoc.includes("Japan") && !searchLoc.includes("Korea") && !searchLoc.includes("China")) {
             searchLoc = `${location}, Taiwan`; 
        }
        const res = await fetch(`https://wttr.in/${encodeURIComponent(searchLoc)}?format=j1`);
        if (!res.ok) return ""; 
        const data = await res.json();
        const current = data.current_condition?.[0];
        if (!current) return "";

        const temp = current.temp_C || "25";
        const feelsLike = current.FeelsLikeC || temp;
        const humidity = current.humidity || "70";
        const weatherDesc = current.lang_zh_TW?.[0]?.value || current.weatherDesc?.[0]?.value || "";
        const areaName = data.nearest_area?.[0]?.areaName?.[0]?.value || location;
        const rainProb = data.weather?.[0]?.hourly?.[0]?.chanceofrain || "0";

        return `
        【真實天氣】
        地點:${areaName}, 氣溫:${temp}°C, 體感:${feelsLike}°C, 濕度:${humidity}%, 天氣:${weatherDesc}, 降雨:${rainProb}%
        (請務必填入 humidity)
        `;
    } catch (e) { return ""; }
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
  
  const realWeather = await fetchRealWeather(location);

  // 🔥 簡化版 Prompt：只保留最核心指令，避免 API 拒絕
  const prompt = `
  角色：專業穿搭顧問。
  使用者：${genderStr}, 風格：${styleStr}。
  任務：針對「${colorSeason}」提供穿搭。
  ${realWeather}

  【穿搭要求】
  1. 若濕度>80%，建議透氣或防風材質。
  2. **Icon 選擇**：請準確選擇單品對應的英文圖示 key，例如：
     - 褲子 -> "pants"
     - 裙子 -> "skirt"
     - 外套 -> "jacket"
     - 鞋子 -> "sneakers" 或 "boots"
     - 包包 -> "bag"

  【回傳 JSON】
  {
    "location": "...",
    "weather": {
       "temperature": "...", "feelsLike": "...", "humidity": "...", "rainProb": "...", "description": "...", "advice": "..."
    },
    "outfit": {
      "items": [
         { "item": "單品名稱", "color": "顏色", "reason": "...", "detail": "...", "icon": "t-shirt" }
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

    if (!response.ok) throw new Error(`API Fail: ${response.status}`); // 這裡如果報錯，就是模型名稱不對

    const data = await response.json();
    const rawText = data.candidates?.[0]?.content?.parts?.[0]?.text || "";
    parsedData = JSON.parse(repairJson(rawText));
    if (!parsedData.weather.advice) parsedData.weather.advice = `天氣${parsedData.weather.description}。`;
  } catch (e) { throw e; }

  // ... (Pexels 圖片邏輯) ...
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
