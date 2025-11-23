import { WeatherOutfitResponse, Gender, Style, ColorSeason, TimeOfDay, TargetDay } from '../types';

// 注意：如果你沒有安裝 @google/generative-ai，請執行 npm install @google/generative-ai
// 這裡我們改回用 fetch 原生呼叫，這樣你就不需要煩惱 SDK 版本問題，保證能跑
const MODEL_NAME = "gemini-2.5-flash"; 

const getApiKey = () => {
  // 🔥 修正 1: 改回 Vite 專用的環境變數寫法
  const envKey = import.meta.env.VITE_GOOGLE_API_KEY;
  if (!envKey) return "MISSING"; 
  return envKey.trim();
}

// JSON 清洗工具
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

  const activeKey = getApiKey();
  if (activeKey === "MISSING") {
      throw new Error("系統錯誤：找不到 VITE_GOOGLE_API_KEY，請檢查 .env 檔案");
  }

  const genderStr = gender === Gender.Male ? '男士' : gender === Gender.Female ? '女士' : '中性';
  const styleStr = style === Style.Casual ? '休閒' : style === Style.Formal ? '正式上班/商務' : '運動健身';
  const dayLabel = targetDay === TargetDay.Today ? '今天' : targetDay === TargetDay.Tomorrow ? '明天' : '後天';
  const fullTimeContext = `${dayLabel} ${timeOfDay}`;

  // 🔥 這是你剛剛貼的很棒的 Prompt，我原封不動保留
  const prompt = `
    你是一個頂尖的時尚造型師與氣象專家。
    
    【使用者資料】
    1. 地點：${location}。
    2. **目標穿搭時間：${fullTimeContext}**。
    3. 性別：${genderStr}。
    4. 風格：${styleStr}。
    5. 色彩季型：${colorSeason}。

    【任務】
    1. 分析天氣，務必提供今天、明天、後天三日預報。
    2. 針對目標時間提供穿搭建議 (items)。
    3. 提供 3 組不同風格的視覺提示詞 (visualPrompts)。

    【輸出格式】
    請回傳純 JSON，不要 Markdown：
    {
      "location": "${location}",
      "weather": {
        "location": "${location}",
        "temperature": "溫度",
        "feelsLike": "體感",
        "humidity": "濕度",
        "rainProb": "機率",
        "description": "天氣簡述",
        "forecast": [
          { "day": "今天", "condition": "天氣", "high": "高溫", "low": "低溫", "rainProb": "機率" },
          { "day": "明天", "condition": "天氣", "high": "高溫", "low": "低溫", "rainProb": "機率" },
          { "day": "後天", "condition": "天氣", "high": "高溫", "low": "低溫", "rainProb": "機率" }
        ]
      },
      "outfit": {
        "items": [
          { 
            "item": "單品名", 
            "color": "色", 
            "reason": "理由", 
            "detail": "細節", 
            "icon": "請選其一: [tshirt, pants, jacket, shoes, accessory, bag, hat]" 
          }
        ],
        "tips": "建議",
        "colorPalette": ["#Hex1", "#Hex2", "#Hex3"],
        "colorDescription": "配色說明",
        "visualPrompts": ["Look 1...", "Look 2...", "Look 3..."]
      },
      "generatedImages": []
    }
  `;

  // 1. 呼叫 Gemini 產生文字建議 (JSON)
  console.log("🚀 正在生成文字建議...");
  const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL_NAME}:generateContent?key=${activeKey}`;
  
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

    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      throw new Error(`Text API Error: ${err.error?.message || response.statusText}`);
    }

    const data = await response.json();
    const rawText = data.candidates?.[0]?.content?.parts?.[0]?.text || "";
    if (!rawText) throw new Error("AI 無回應");

    const cleanJson = repairJson(rawText);
    parsedData = JSON.parse(cleanJson);

  } catch (e) {
    console.error("文字生成失敗:", e);
    throw e;
  }

  // 2. 嘗試生成圖片 (可選功能)
  // 🔥 注意：免費 API Key 通常無法使用 gemini-2.5-flash-image
  // 為了避免整個程式掛掉，我們把這段包在 try-catch 裡，失敗就算了
  try {
      console.log("🎨 嘗試生成圖片 (若 API 不支援將跳過)...");
      
      // 如果你的 Key 不支援生圖，這裡會自動失敗並跳過，不會讓畫面變白
      // 目前大部分免費 Key 都不支援 imagen，所以我們暫時不做這段，以免你一直看到錯誤
      // 如果你確定你的 Key 有權限，可以把下面註解打開
      
      /* 
      const imagePrompt = parsedData.outfit.visualPrompts[0] || `Fashion photo of ${genderStr} in ${location}`;
      const imgApiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-pro-vision:generateContent?key=${activeKey}`; // 注意模型名稱
      // ... 生圖邏輯 ...
      */
      
      // 目前我們先回傳空陣列，確保文字功能正常
      parsedData.generatedImages = [];

  } catch (imgError) {
      console.warn("圖片生成失敗 (可能是權限問題):", imgError);
      parsedData.generatedImages = []; // 失敗也沒關係，至少文字有出來
  }

  return parsedData;
};
