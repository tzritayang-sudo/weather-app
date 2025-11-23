import { WeatherOutfitResponse, Gender, Style, ColorSeason, TimeOfDay, TargetDay } from '../types';

// 🔥 恢復您指定的版本 (既然您確定這個之前可以)
const MODEL_NAME = "gemini-2.5-flash"; 

const getApiKey = (keyName: string) => {
  const envKey = import.meta.env[keyName];
  if (!envKey) return null;
  return envKey.trim();
}

// 色彩翻譯機
function simplifyColorForSearch(query: string): string {
    const map: Record<string, string> = {
        "electric blue": "royal blue",
        "hot pink": "bright pink",
        "icy grey": "light grey",
        "pine green": "dark green",
        "emerald green": "dark green",
        "mustard": "yellow",
        "rust": "orange brown",
        "terracotta": "brown orange",
        "sage green": "light green",
        "oatmeal": "beige",
        "taupe": "brown grey",
        "mauve": "purple grey",
        "burgundy": "dark red",
        "teal": "blue green"
    };
    let simpleQuery = query.toLowerCase();
    Object.keys(map).forEach(key => {
        if (simpleQuery.includes(key)) {
            simpleQuery = simpleQuery.replace(key, map[key]);
        }
    });
    return simpleQuery;
}

// Pexels 搜尋
async function fetchPexelsImages(query: string): Promise<string[]> {
    const pexelsKey = getApiKey("VITE_PEXELS_API_KEY");
    if (!pexelsKey) return [];

    try {
        const randomPage = Math.floor(Math.random() * 5) + 1;
        let safeQuery = simplifyColorForSearch(query);
        if (!safeQuery.includes("outfit") && !safeQuery.includes("fashion")) {
             safeQuery = `${safeQuery} outfit`; 
        }
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

// JSON 修復
function repairJson(jsonString: string): string {
    let fixed = jsonString.trim();
    fixed = fixed.replace(/``````/g, "");
    const firstBrace = fixed.indexOf('{');
    const lastBrace = fixed.lastIndexOf('}');
    if (firstBrace !== -1 && lastBrace !== -1) {
        fixed = fixed.substring(firstBrace, lastBrace + 1);
    }
    return fixed;
}

// 真實天氣 (包含濕度)
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

        const areaName = data.nearest_area?.[0]?.areaName?.[0]?.value || location;
        const humidity = current.humidity || "70"; // 抓取濕度

        return `
        【真實天氣數據】
        - 地點: ${areaName}
        - 氣溫: ${current.temp_C}°C (體感 ${current.FeelsLikeC}°C)
        - 濕度: ${humidity}%
        - 天氣: ${current.lang_zh_TW?.[0]?.value || current.weatherDesc?.[0]?.value}
        (請將濕度填入 JSON 的 weather.humidity，並根據濕度調整穿搭)
        `;
    } catch (e) {
        return "";
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
  // 使用您原本的錯誤訊息，確保 UI 顯示正常
  if (!googleKey) throw new Error("系統錯誤：找不到 API Key");

  const genderStr = gender === Gender.Male ? '男士' : '女士';
  const styleStr = style === Style.Casual ? '休閒' : '正式';
  const dayLabel = targetDay === TargetDay.Today ? '今天' : '明天';

  const realWeather = await fetchRealWeather(location);

  // 🔥 Prompt 整合：保留您的色彩規則 + 加入我的圖示/濕度邏輯
  const prompt = `
  角色：嚴格的色彩形象顧問。
  使用者：${genderStr}, 風格：${styleStr}。
  任務：針對「${colorSeason}」，在「${location} ${dayLabel}${timeOfDay}」提供穿搭。
  ${realWeather}

  【濕度穿搭邏輯】
  1. 濕度 > 80% 且熱：推薦亞麻、排汗材質。
  2. 濕度 > 80% 且冷：需防風防水，建議洋蔥式穿法。

  【圖示選擇 (Icon)】
  請為 items[].icon 選擇最準確的 key (勿全部用 t-shirt)：
  "t-shirt", "shirt", "sweater", "hoodie", "jacket", "coat", "pants", "shorts", "skirt", "dress", 
  "sneakers", "boots", "formal-shoes", "sandals", "bag", "umbrella", "hat", "scarf", "glasses", "watch"

  【色彩規則：嚴格遵守 ${colorSeason}】
  (請依照 12 季型規則推薦顏色)

  【回傳 JSON】
  {
    "location": "${location}",
    "weather": {
      "temperature": "...", "feelsLike": "...", "humidity": "...", "rainProb": "...", "description": "...", "advice": "..."
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

    if (!response.ok) throw new Error(`API Fail: ${response.status}`);
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
           parsedData.generatedImages = await fetchPexelsImages(`${backupColor} fashion outfit`);
      }
  }

  return parsedData;
};
