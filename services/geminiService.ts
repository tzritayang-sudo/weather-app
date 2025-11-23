import { WeatherOutfitResponse, Gender, Style, ColorSeason, TimeOfDay, TargetDay } from '../types';

// 🔥 模型名稱
const MODEL_NAME = "gemini-2.5-flash"; 

// 🎯 從環境變數讀取 API Key
const getApiKey = () => {
  const envKey = import.meta.env.VITE_GOOGLE_API_KEY;
  if (!envKey) return "MISSING"; 
  return envKey.trim();
}

// 🔧 JSON 修復小幫手
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
      throw new Error("系統錯誤：找不到 API Key，請檢查 .env 檔案。");
  }

  const genderStr = gender === Gender.Male ? '男士' : gender === Gender.Female ? '女士' : '中性';
  const styleStr = style === Style.Casual ? '休閒' : style === Style.Formal ? '正式' : '運動';
  const dayLabel = targetDay === TargetDay.Today ? '今天' : targetDay === TargetDay.Tomorrow ? '明天' : '後天';

  // 🔥 關鍵修正：讓 Prompt 完全對應你的 types.ts 結構
  // 我們給 AI 一個「範本」，叫它照著填空
  const prompt = `
  分析地點：${location}，時間：${dayLabel}${timeOfDay}。
  使用者：${genderStr}, 風格：${styleStr}, 色季：${colorSeason}。
  
  請嚴格依照以下 JSON 結構回傳，不要修改欄位名稱：
  {
    "location": "${location}",
    "weather": {
      "location": "${location}",
      "temperature": "攝氏溫度 (例如 25°C)",
      "feelsLike": "體感溫度",
      "humidity": "濕度",
      "rainProb": "降雨機率",
      "description": "天氣狀況描述",
      "forecast": [
        { "day": "今天", "condition": "晴", "high": "30°C", "low": "25°C", "rainProb": "10%" },
        { "day": "明天", "condition": "多雲", "high": "28°C", "low": "24°C", "rainProb": "20%" },
        { "day": "後天", "condition": "雨", "high": "26°C", "low": "23°C", "rainProb": "60%" }
      ]
    },
    "outfit": {
      "items": [
        { "item": "上衣名稱", "color": "推薦顏色", "reason": "推薦理由", "icon": "tshirt" },
        { "item": "下著名稱", "color": "推薦顏色", "reason": "推薦理由", "icon": "pants" },
        { "item": "配件名稱", "color": "推薦顏色", "reason": "推薦理由", "icon": "scarf" }
      ],
      "tips": "整體的穿搭建議與風格描述",
      "colorPalette": ["#HexCode1", "#HexCode2", "#HexCode3"],
      "colorDescription": "配色靈感說明",
      "visualPrompts": ["High quality fashion photography of...", "Cinematic shot of...", "Studio lighting..."]
    }
  }
  `;

  const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL_NAME}:generateContent?key=${activeKey}`;

  console.log("🚀 發送請求中...");

  try {
    const response = await fetch(apiUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: {
            response_mime_type: "application/json" // 強制 JSON 模式
        }
      })
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(`API Error: ${errorData.error?.message || response.statusText}`);
    }

    const data = await response.json();
    
    if (!data.candidates || data.candidates.length === 0) {
        throw new Error("AI 沒有回傳內容");
    }

    const rawText = data.candidates[0].content?.parts?.[0]?.text || "";
    console.log("AI Output:", rawText);

    const cleanJson = repairJson(rawText);
    const parsedData = JSON.parse(cleanJson);

    // 最後檢查：確認有沒有漏掉必要的 weather 或 outfit 欄位
    if (!parsedData.weather || !parsedData.outfit) {
        throw new Error("AI 回傳格式缺少必要欄位 (weather 或 outfit)");
    }

    return parsedData as WeatherOutfitResponse;

  } catch (e: any) {
    console.error("Service Error:", e);
    throw e;
  }
};
