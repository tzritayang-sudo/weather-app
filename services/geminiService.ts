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
        // 搜尋 Pexels，限制找 3 張圖，直式構圖 (portrait) 比較適合手機看
        const url = `https://api.pexels.com/v1/search?query=${encodeURIComponent(query)}&per_page=3&orientation=portrait`;
        const res = await fetch(url, {
            headers: { Authorization: pexelsKey }
        });
        
        if (!res.ok) return [];
        
        const data = await res.json();
        // 回傳圖片網址 (src.medium 比較省流量)
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

  const prompt = `
  角色：時尚造型師。
  任務：針對 ${location} ${dayLabel}${timeOfDay} 的天氣，為 ${genderStr} (${styleStr}, ${colorSeason}) 提供穿搭。
  
  請嚴格依照此 JSON 結構回傳：
  {
    "location": "${location}",
    "weather": {
      "location": "${location}",
      "temperature": "溫度", "feelsLike": "體感", "humidity": "濕度", "rainProb": "降雨率", "description": "天氣簡述",
      "forecast": [
         { "day": "今天", "condition": "天氣", "high": "高", "low": "低", "rainProb": "率" },
         { "day": "明天", "condition": "天氣", "high": "高", "low": "低", "rainProb": "率" },
         { "day": "後天", "condition": "天氣", "high": "高", "low": "低", "rainProb": "率" }
      ]
    },
    "outfit": {
      "items": [
         { "item": "單品", "color": "色", "reason": "理由", "detail": "細節", "icon": "tshirt" }
      ],
      "tips": "建議",
      "colorPalette": ["#Hex1", "#Hex2", "#Hex3"],
      "colorDescription": "配色說明",
      // 關鍵：請提供 3 個適合在圖庫搜尋的英文關鍵字
      "visualPrompts": [
         "Korean street fashion winter female coat", 
         "Minimalist beige sweater outfit men",
         "Casual denim look summer"
      ]
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

  // 2. 圖片搜尋 (自動接上 Pexels)
  if (parsedData.outfit?.visualPrompts?.length > 0) {
      console.log("🔍 正在搜尋圖片:", parsedData.outfit.visualPrompts[0]);
      // 拿第一個最精準的 Prompt 去找圖
      const images = await fetchPexelsImages(parsedData.outfit.visualPrompts[0]);
      
      // 如果第一組關鍵字找不到，試試看第二組
      if (images.length === 0 && parsedData.outfit.visualPrompts[1]) {
          const images2 = await fetchPexelsImages(parsedData.outfit.visualPrompts[1]);
          parsedData.generatedImages = images2;
      } else {
          parsedData.generatedImages = images;
      }
  }

  return parsedData;
};
