import { WeatherOutfitResponse, Gender, Style, ColorSeason, TimeOfDay, TargetDay } from '../types';

const MODEL_NAME = "gemini-2.5-flash"; 

const getApiKey = (keyName: string) => {
  const envKey = import.meta.env[keyName];
  if (!envKey) return null;
  return envKey.trim();
}

// 🔥 Pexels 搜尋優化版：強制加上 "outfit" 避免搜到風景圖
async function fetchPexelsImages(query: string): Promise<string[]> {
    const pexelsKey = getApiKey("VITE_PEXELS_API_KEY");
    if (!pexelsKey) return [];

    try {
        // 增加隨機頁數，避免每次都看到一樣的圖
        const randomPage = Math.floor(Math.random() * 5) + 1;
        
        // 🛡️ 防呆機制：如果關鍵字裡沒有 "outfit" 或 "fashion"，強制加上去
        // 這樣 "Sage Green" 就會變成 "Sage Green outfit"，確保搜到衣服
        let safeQuery = query;
        const lowerQ = query.toLowerCase();
        if (!lowerQ.includes("outfit") && !lowerQ.includes("fashion") && !lowerQ.includes("clothes") && !lowerQ.includes("style")) {
             safeQuery = `${query} outfit`; 
        }

        const url = `https://api.pexels.com/v1/search?query=${encodeURIComponent(safeQuery)}&per_page=3&page=${randomPage}&orientation=portrait`;
        const res = await fetch(url, { headers: { Authorization: pexelsKey } });
        if (!res.ok) return [];
        const data = await res.json();
        
        // 如果找不到，嘗試縮短關鍵字重試 (例如去掉太冷門的形容詞)
        if (data.photos.length === 0 && query.includes(" ")) {
            const shorter = query.split(" ").slice(1).join(" "); 
            return fetchPexelsImages(shorter); // 遞迴重試
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

export const getGeminiSuggestion = async (
  location: string,
  gender: Gender,
  style: Style,
  colorSeason: ColorSeason,
  targetDay: TargetDay,
  timeOfDay: TimeOfDay
): Promise<WeatherOutfitResponse> => {

  const googleKey = getApiKey("VITE_GOOGLE_API_KEY");
  if (!googleKey) throw new Error("系統錯誤：找不到 VITE_GOOGLE_API_KEY");

  const genderStr = gender === Gender.Male ? '男士' : gender === Gender.Female ? '女士' : '中性';
  const styleStr = style === Style.Casual ? '休閒' : style === Style.Formal ? '正式' : '運動';
  const dayLabel = targetDay === TargetDay.Today ? '今天' : targetDay === TargetDay.Tomorrow ? '明天' : '後天';

  // 12 色彩季型詳細定義庫 (讓 AI 選色更精準)
  const prompt = `
  角色：專業氣象主播兼時尚顧問。
  使用者：${genderStr}, 風格：${styleStr}。
  任務：針對「${colorSeason}」色彩季型，在「${location} ${dayLabel}${timeOfDay}」提供穿搭建議。

  【重要規則】
  1. **語言**：JSON 所有描述文字 (description, tips, advice) 必須用 **繁體中文**。
  2. **天氣建議 (advice)**：請提供一段 50-80 字的溫暖叮嚀 (例如：體感溫度、是否帶傘、洋蔥式穿法)。
  3. **Visual Prompts**：生成搜尋關鍵字時，請使用 **[具體色名] + [單品]** (例如 "Sage Green Sweater")，不要寫長句子。

  【色彩資料庫 - 請從這裡選色】
  ❄️ WINTER: Electric Blue, Hot Pink, Icy Grey, Pine Green, Royal Blue, Black, White.
  🍂 AUTUMN: Sage Green, Rust, Mustard, Terracotta, Olive, Cream, Brown.
  ☀️ SPRING: Coral, Turquoise, Lime Green, Cream, Bright Yellow, Warm Grey.
  🌊 SUMMER: Powder Blue, Lavender, Soft Grey, Mint, Rose Pink, Cocoa.

  請回傳 JSON:
  {
    "location": "${location}",
    "weather": {
      "location": "${location}",
      "temperature": "溫度", "feelsLike": "體感", "humidity": "濕度", "rainProb": "機率", "description": "簡述",
      "advice": "這裡寫詳細的天氣叮嚀...",
      "forecast": [
         { "day": "今天", "condition": "...", "high": "...", "low": "...", "rainProb": "..." },
         { "day": "明天", "condition": "...", "high": "...", "low": "...", "rainProb": "..." },
         { "day": "後天", "condition": "...", "high": "...", "low": "...", "rainProb": "..." }
      ]
    },
    "outfit": {
      "items": [
         { "item": "單品名", "color": "色名", "reason": "理由", "detail": "細節", "icon": "tshirt" }
      ],
      "tips": "整體建議",
      "colorPalette": ["#Hex1", "#Hex2", "#Hex3"],
      "colorDescription": "配色說明",
      "visualPrompts": ["Specific Color Item", "Specific Color Item"]
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
    
    if (!parsedData.weather.advice && parsedData.weather.description) {
        parsedData.weather.advice = `目前天氣${parsedData.weather.description}，請留意氣溫變化。`;
    }

  } catch (e) { throw e; }

  // 平行搜尋圖片
  if (parsedData.outfit?.visualPrompts?.length > 0) {
      const [images1, images2] = await Promise.all([
          fetchPexelsImages(parsedData.outfit.visualPrompts[0]),
          fetchPexelsImages(parsedData.outfit.visualPrompts[1])
      ]);
      parsedData.generatedImages = [...images1.slice(0, 2), ...images2.slice(0, 1)];
      
      // 備用搜尋
      if (parsedData.generatedImages.length === 0) {
           const backupColor = parsedData.outfit.items[0].color; 
           parsedData.generatedImages = await fetchPexelsImages(`${backupColor} fashion outfit`);
      }
  }

  return parsedData;
};
