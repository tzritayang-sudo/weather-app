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
        if (!res.ok) return "";
        const data = await res.json();
        const current = data.current_condition[0];
        const areaName = data.nearest_area?.[0]?.areaName?.[0]?.value || location;
        return `
        【真實天氣】
        - 地點: ${areaName}
        - 氣溫: ${current.temp_C}°C (體感 ${current.FeelsLikeC}°C)
        - 天氣: ${current.lang_zh_TW?.[0]?.value || current.weatherDesc?.[0]?.value}
        - 降雨機率: ${data.weather?.[0]?.hourly?.[0]?.chanceofrain || 0}%
        (請務必根據此數據生成 weather 欄位)
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
  const dayLabel = targetDay === TargetDay.Today ? '今天' : '明天';

  const realWeather = await fetchRealWeather(location);

  // 🔥 最終版 Prompt (加入圖示選擇清單)
  const prompt = `
  角色：專業色彩顧問。
  使用者：${genderStr}, 風格：${styleStr}。
  任務：針對「${colorSeason}」，在「${location} ${dayLabel}${timeOfDay}」提供穿搭。
  ${realWeather}

  【圖示選擇 (icon)】
  請從以下清單為每個單品選擇最適合的圖示 key：
  "t-shirt", "shirt", "sweater", "hoodie", "jacket", "coat", "pants", "shorts", "skirt", "dress", 
  "sneakers", "boots", "formal-shoes", "sandals", "bag", "umbrella", "hat", "scarf", "glasses", "watch"

  【色彩規則：嚴格遵守 ${colorSeason}，避開禁忌色】
  (此處省略色彩資料庫，因為你之前的版本已經很完整)

  【回傳 JSON 格式】
  {
    "location": "...",
    "weather": { ... },
    "outfit": {
      "items": [
         { 
           "item": "單品名 (例如：高腰棉麻寬褲)", 
           "color": "色名 (例如：米白)", 
           "reason": "...", 
           "detail": "...", 
           "icon": "pants" // <-- 請根據上方清單選擇最適合的圖示！
         }
      ],
      "tips": "...",
      "colorPalette": ["色名1", "色名2"],
      "colorDescription": "...",
      "visualPrompts": ["Color Item1", "Color Item2"]
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
