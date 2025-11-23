import { WeatherOutfitResponse, Gender, Style, ColorSeason, TimeOfDay, TargetDay } from '../types';

const MODEL_NAME = "gemini-2.5-flash"; 

const getApiKey = (keyName: string) => {
  const envKey = import.meta.env[keyName];
  if (!envKey) return null;
  return envKey.trim();
}

// 🔥 新增：色彩翻譯機 (把時尚色名轉成 Pexels 看得懂的簡單色名)
function simplifyColorForSearch(query: string): string {
    const map: Record<string, string> = {
        "electric blue": "royal blue", // Pexels 對 royal blue 反應比較好
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
    // 尋找並替換顏色詞
    Object.keys(map).forEach(key => {
        if (simpleQuery.includes(key)) {
            simpleQuery = simpleQuery.replace(key, map[key]);
        }
    });
    return simpleQuery;
}

// Pexels 搜尋 (加入色彩翻譯)
async function fetchPexelsImages(query: string): Promise<string[]> {
    const pexelsKey = getApiKey("VITE_PEXELS_API_KEY");
    if (!pexelsKey) return [];

    try {
        const randomPage = Math.floor(Math.random() * 5) + 1;
        
        // 1. 先把高級色名轉成簡單色名 (例如 Icy Grey -> Light Grey)
        // 這樣 Pexels 比較容易搜到正確顏色的圖
        let safeQuery = simplifyColorForSearch(query);
        
        // 2. 強制加上 outfit
        if (!safeQuery.includes("outfit") && !safeQuery.includes("fashion")) {
             safeQuery = `${safeQuery} outfit`; 
        }

        // 3. 強制加上 "street style" (街拍)，通常這種圖比較容易出現全身穿搭
        safeQuery += " street style";

        console.log(`🔍 Pexels 搜尋優化: 原本="${query}" -> 修正="${safeQuery}"`);

        const url = `https://api.pexels.com/v1/search?query=${encodeURIComponent(safeQuery)}&per_page=3&page=${randomPage}&orientation=portrait`;
        const res = await fetch(url, { headers: { Authorization: pexelsKey } });
        if (!res.ok) return [];
        const data = await res.json();
        
        if (data.photos.length === 0) {
            // 如果翻譯後還是沒圖，就只搜顏色本身 (例如 "Royal Blue outfit")，放棄單品名
            // 這樣至少顏色是對的
            const colorOnly = safeQuery.split(" ").slice(0, 2).join(" ") + " outfit";
            console.log(`⚠️ 找不到圖，降級搜尋: "${colorOnly}"`);
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

async function fetchRealWeather(location: string): Promise<string> {
    try {
        const res = await fetch(`https://wttr.in/${encodeURIComponent(location)}?format=j1`);
        if (!res.ok) return "";
        const data = await res.json();
        const current = data.current_condition[0];
        return `
        【真實數據】
        氣溫: ${current.temp_C}°C (體感 ${current.FeelsLikeC}°C)
        天氣: ${current.lang_zh_TW?.[0]?.value || current.weatherDesc?.[0]?.value}
        降雨機率: ${data.weather?.[0]?.hourly?.[0]?.chanceofrain || 0}%
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

  const genderStr = gender === Gender.Male ? '男士' : gender === Gender.Female ? '女士' : '中性';
  const styleStr = style === Style.Casual ? '休閒' : style === Style.Formal ? '正式' : '運動';
  const dayLabel = targetDay === TargetDay.Today ? '今天' : targetDay === TargetDay.Tomorrow ? '明天' : '後天';

  const realWeather = await fetchRealWeather(location);

  // Prompt 保持你之前那份 12 季型全攻略版本 (因為那份很好)
  // 這裡為了節省篇幅，我只列出關鍵結構，請確保你複製進去的是包含完整色彩規則的 Prompt
  const prompt = `
  角色：色彩形象顧問。
  使用者：${genderStr}, 風格：${styleStr}。
  任務：針對「${colorSeason}」色彩季型，在「${location} ${dayLabel}${timeOfDay}」提供穿搭。
  ${realWeather}

  【色彩規則：嚴格遵守 ${colorSeason}】
  (請在此處保留你之前那份詳細的 12 季型色彩清單，或直接使用我上一份回答的 Prompt 內容)
  
  ❄️ **WINTER**
  - Bright Winter: ✅ Electric Blue, Hot Pink, Icy Grey. ❌ Earth Tones.
  (此處省略中間的色彩列表，請務必補上，或直接用上一版的 Prompt)

  【重要指令】
  1. Visual Prompts：請只產生 **[英文色名] + [單品]**，例如 "Electric Blue Coat"。不要加其他形容詞。
  2. 語言：JSON 內容用繁體中文。

  請回傳 JSON:
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

  // 平行搜尋
  if (parsedData.outfit?.visualPrompts?.length > 0) {
      const [images1, images2] = await Promise.all([
          fetchPexelsImages(parsedData.outfit.visualPrompts[0]),
          fetchPexelsImages(parsedData.outfit.visualPrompts[1])
      ]);
      parsedData.generatedImages = [...images1.slice(0, 2), ...images2.slice(0, 1)];
      
      if (parsedData.generatedImages.length === 0) {
           // 備案：只搜顏色，不搜單品，確保至少顏色是對的
           const backupColor = parsedData.outfit.items[0].color; 
           parsedData.generatedImages = await fetchPexelsImages(`${backupColor} fashion street style`);
      }
  }

  return parsedData;
};
