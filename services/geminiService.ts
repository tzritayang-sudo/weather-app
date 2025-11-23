import { WeatherOutfitResponse, Gender, Style, ColorSeason, TimeOfDay, TargetDay } from '../types';

const MODEL_NAME = "gemini-2.5-flash"; 

const getApiKey = (keyName: string) => {
  const envKey = import.meta.env[keyName];
  if (!envKey) return null;
  return envKey.trim();
}

// 🔥 色彩翻譯機：把時尚色名轉成 Pexels 看得懂的簡單色名
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

// 🔥 Pexels 搜尋：加入翻譯與強制關鍵字
async function fetchPexelsImages(query: string): Promise<string[]> {
    const pexelsKey = getApiKey("VITE_PEXELS_API_KEY");
    if (!pexelsKey) return [];

    try {
        const randomPage = Math.floor(Math.random() * 5) + 1;
        
        // 1. 翻譯顏色
        let safeQuery = simplifyColorForSearch(query);
        
        // 2. 強制加上 outfit
        if (!safeQuery.includes("outfit") && !safeQuery.includes("fashion")) {
             safeQuery = `${safeQuery} outfit`; 
        }
        safeQuery += " street style"; // 增加街拍感

        const url = `https://api.pexels.com/v1/search?query=${encodeURIComponent(safeQuery)}&per_page=3&page=${randomPage}&orientation=portrait`;
        const res = await fetch(url, { headers: { Authorization: pexelsKey } });
        if (!res.ok) return [];
        const data = await res.json();
        
        // 降級搜尋備案
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
    if (firstBrace !== -1 && lastBrace !== -1) {
        fixed = fixed.substring(firstBrace, lastBrace + 1);
    }
    return fixed;
}

// 🔥 真實天氣修正：自動加上 ", Taiwan"
async function fetchRealWeather(location: string): Promise<string> {
    try {
        let searchLoc = location;
        // 聰明判斷：如果是中文且不含國家名，自動加上 Taiwan
        if (!searchLoc.includes("台灣") && !searchLoc.includes("Taiwan") && !searchLoc.includes("Japan") && !searchLoc.includes("Korea") && !searchLoc.includes("China")) {
             searchLoc = `${location}, Taiwan`; 
        }

        console.log(`🌍 查詢真實天氣: ${searchLoc}`);
        const res = await fetch(`https://wttr.in/${encodeURIComponent(searchLoc)}?format=j1`);
        if (!res.ok) return "";
        
        const data = await res.json();
        const current = data.current_condition[0];
        const areaName = data.nearest_area?.[0]?.areaName?.[0]?.value || location;

        return `
        【真實天氣數據】
        - 地點: ${areaName}
        - 氣溫: ${current.temp_C}°C (體感 ${current.FeelsLikeC}°C)
        - 濕度: ${current.humidity}%
        - 天氣: ${current.lang_zh_TW?.[0]?.value || current.weatherDesc?.[0]?.value}
        (請依照此數據建議穿搭)
        `;
    } catch (e) {
        console.warn("無法取得真實天氣");
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
  if (!googleKey) throw new Error("系統錯誤：找不到 API Key");

  const genderStr = gender === Gender.Male ? '男士' : gender === Gender.Female ? '女士' : '中性';
  const styleStr = style === Style.Casual ? '休閒' : style === Style.Formal ? '正式' : '運動';
  const dayLabel = targetDay === TargetDay.Today ? '今天' : targetDay === TargetDay.Tomorrow ? '明天' : '後天';

  // 1. 抓真實天氣
  const realWeather = await fetchRealWeather(location);

  // 2. Prompt (包含 12 季型規則)
  const prompt = `
  角色：嚴格的色彩形象顧問。
  使用者：${genderStr}, 風格：${styleStr}。
  任務：針對「${colorSeason}」色彩季型，在「${location} ${dayLabel}${timeOfDay}」提供穿搭。
  ${realWeather}

  【色彩規則：嚴格遵守 ${colorSeason}，避開禁忌色】
  
  ❄️ **WINTER**
  - Bright Winter: ✅ Electric Blue, Hot Pink, Icy Grey, Royal Blue. ❌ Olive, Mustard, Rust.
  - True Winter: ✅ Holly Berry Red, Sapphire Blue, White, Black. ❌ Golden Brown, Orange.
  - Dark Winter: ✅ Deep Teal, Burgundy, Midnight Blue. ❌ Light Peach, Warm Orange.

  🍂 **AUTUMN**
  - Soft Autumn: ✅ Sage Green, Dusty Pink, Oatmeal, Khaki. ❌ Black, Bright Fuchsia.
  - True Autumn: ✅ Mustard, Rust, Olive Green, Tomato Red. ❌ Pastel Pink, Blue-Grey.
  - Dark Autumn: ✅ Dark Olive, Terracotta, Dark Chocolate. ❌ Pale Pastels, Hot Pink.

  ☀️ **SPRING**
  - Bright Spring: ✅ Bright Coral, Turquoise, Lime Green. ❌ Dusty colors, Grey.
  - True Spring: ✅ Golden Yellow, Peach, Salmon, Grass Green. ❌ Black, Berry colors.
  - Light Spring: ✅ Pale Peach, Mint Green, Ivory. ❌ Black, Dark Brown.

  🌊 **SUMMER**
  - Light Summer: ✅ Powder Blue, Pale Pink, Lavender. ❌ Black, Orange.
  - True Summer: ✅ Raspberry, Soft Blue, Rose Pink. ❌ Orange, Gold.
  - Soft Summer: ✅ Mauve, Dusty Blue, Grey Green. ❌ Bright Orange, Electric Blue.

  【指令】
  1. Visual Prompts：請只產生 **[英文色名] + [單品]** (例如 "Electric Blue Coat")。
  2. 語言：繁體中文。

  回傳 JSON:
  {
    "location": "${location}",
    "weather": {
      "location": "${location}", "temperature": "溫度", "feelsLike": "體感", "humidity": "濕度", "rainProb": "機率", "description": "簡述", "advice": "叮嚀",
      "forecast": []
    },
    "outfit": {
      "items": [{ "item": "單品", "color": "色", "reason": "理", "detail": "細", "icon": "tshirt" }],
      "tips": "議", "colorPalette": [], "colorDescription": "述",
      "visualPrompts": ["Color Item", "Color Item"]
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
    
    if (!parsedData.weather.advice) parsedData.weather.advice = `目前天氣${parsedData.weather.description}。`;

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
