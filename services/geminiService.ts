import { WeatherOutfitResponse, Gender, Style, ColorSeason, TimeOfDay, TargetDay } from '../types';

// 模型名稱
const MODEL_NAME = "gemini-2.5-flash"; 

const getApiKey = (keyName: string) => {
  const envKey = import.meta.env[keyName];
  if (!envKey) return null;
  return envKey.trim();
}

// Pexels 搜尋函式
async function fetchPexelsImages(query: string): Promise<string[]> {
    const pexelsKey = getApiKey("VITE_PEXELS_API_KEY");
    if (!pexelsKey) {
        console.warn("⚠️ 未設定 VITE_PEXELS_API_KEY，跳過圖片搜尋");
        return [];
    }

    try {
        // 我們把關鍵字稍微簡化，只取前幾個重要的字，避免搜尋字串太長導致 Pexels 找不到
        // 例如 "Bright Royal Blue Coat Street Style..." 這樣比較容易中
        const url = `https://api.pexels.com/v1/search?query=${encodeURIComponent(query)}&per_page=3&orientation=portrait`;
        
        const res = await fetch(url, { headers: { Authorization: pexelsKey } });
        if (!res.ok) return [];
        
        const data = await res.json();
        
        if (data.photos.length === 0) {
            console.log(`關鍵字 "${query}" 找不到圖，嘗試備案...`);
            return [];
        }

        return data.photos.map((photo: any) => photo.src.large2x || photo.src.medium);
    } catch (e) {
        console.error("Pexels 搜尋失敗:", e);
        return [];
    }
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

  // 🔥 這裡做了重要修改：強迫 AI 把顏色寫進搜尋關鍵字
  const prompt = `
  角色：時尚造型師。
  使用者：${genderStr}, 風格：${styleStr}, 色系：${colorSeason}。
  情境：${location} ${dayLabel}${timeOfDay}。
  
  任務：請回傳 JSON 格式的穿搭建議。

  【圖片搜尋關鍵字特別指令】
  在產生 "visualPrompts" 時，因為是用於圖庫搜尋，請務必包含 **具體的顏色名稱** (Specific Color Name) 與 **單品名稱**。
  
  舉例來說：
  - 如果是 Bright Winter，不要只寫 "Winter Coat"，要寫 "Royal Blue Winter Coat" 或 "Fuchsia Pink Sweater"。
  - 如果是 Soft Autumn，要寫 "Sage Green Cardigan" 或 "Terracotta Dress"。
  - 關鍵字結構建議："[Color] [Item] [Style] fashion"

  請回傳以下 JSON 結構：
  {
    "location": "${location}",
    "weather": {
      "location": "${location}",
      "temperature": "溫度", "feelsLike": "體感", "humidity": "濕度", "rainProb": "機率", "description": "簡述",
      "forecast": [
         { "day": "今天", "condition": "...", "high": "...", "low": "...", "rainProb": "..." },
         { "day": "明天", "condition": "...", "high": "...", "low": "...", "rainProb": "..." },
         { "day": "後天", "condition": "...", "high": "...", "low": "...", "rainProb": "..." }
      ]
    },
    "outfit": {
      "items": [
         { "item": "單品名", "color": "顏色", "reason": "...", "detail": "...", "icon": "tshirt" }
      ],
      "tips": "...",
      "colorPalette": ["#Hex1", "#Hex2", "#Hex3"],
      "colorDescription": "...",
      // 這裡 AI 會根據上面的指令，產生帶有顏色的關鍵字
      "visualPrompts": ["Crucial Color Item Style...", "Crucial Color Item Style...", "Crucial Color Item Style..."]
    },
    "generatedImages": [] 
  }
  `;

  // 1. 文字生成
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

    if (!response.ok) throw new Error("Google API 連線失敗");

    const data = await response.json();
    const rawText = data.candidates?.[0]?.content?.parts?.[0]?.text || "";
    parsedData = JSON.parse(repairJson(rawText));

  } catch (e) {
    console.error("AI 文字生成失敗:", e);
    throw e;
  }

  // 2. 圖片搜尋 (增強版)
  if (parsedData.outfit?.visualPrompts?.length > 0) {
      // 我們一次拿三個關鍵字去搜，增加命中率
      // 優先搜尋第一個關鍵字 (通常是最精準的)
      let images = await fetchPexelsImages(parsedData.outfit.visualPrompts[0]);
      
      // 如果第一個關鍵字找不到圖 (可能是顏色太冷門)，就用備用的關鍵字
      if (images.length === 0 && parsedData.outfit.visualPrompts[1]) {
          console.log("第一組關鍵字無結果，嘗試第二組...");
          images = await fetchPexelsImages(parsedData.outfit.visualPrompts[1]);
      }
      
      parsedData.generatedImages = images;
  }

  return parsedData;
};
