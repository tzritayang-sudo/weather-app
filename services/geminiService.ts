import { WeatherOutfitResponse, Gender, Style, ColorSeason, TimeOfDay, TargetDay } from '../types';

// 🔥 設定正確的模型名稱
const MODEL_NAME = "gemini-2.5-flash"; 

// 🎯 從環境變數讀取 API Key
const getApiKey = () => {
  const envKey = import.meta.env.VITE_GOOGLE_API_KEY;
  if (!envKey) {
     console.error("❌ 嚴重錯誤：找不到 VITE_GOOGLE_API_KEY，請檢查 .env 檔案");
     return "MISSING"; 
  }
  return envKey.trim();
}

export const getGeminiSuggestion = async (
  location: string,
  gender: Gender,
  style: Style,
  colorSeason: ColorSeason,
  targetDay: TargetDay,
  timeOfDay: TimeOfDay
): Promise<WeatherOutfitResponse> => {

  const genderStr = gender === Gender.Male ? '男士' : gender === Gender.Female ? '女士' : '中性';
  const styleStr = style === Style.Casual ? '休閒' : style === Style.Formal ? '正式上班/商務' : '運動健身';
  const dayLabel = targetDay === TargetDay.Today ? '今天' : targetDay === TargetDay.Tomorrow ? '明天' : '後天';
  const fullTimeContext = `${dayLabel} ${timeOfDay}`;

  // 為了讓 AI 更穩定，我們簡化 Prompt，並強調格式
  const prompt = `
  【角色】頂尖時尚造型師與氣象專家。
  【任務】根據以下資料回傳 JSON：
  - 地點：${location}
  - 時間：${fullTimeContext}
  - 使用者：${genderStr} / ${styleStr} / ${colorSeason}
  
  【必要欄位】
  1. weather (天氣分析)
  2. suggestion (穿搭建議)
  3. items (推薦單品清單)
  4. visualPrompts (3個用於生成圖片的英文提示詞)
  
  【嚴格規定】
  - 只回傳 JSON。
  - 不要使用 Markdown (不要寫 \`\`\`json)。
  - 不要有任何解釋文字。
  `;

  const activeKey = getApiKey();
  if (activeKey === "MISSING") {
      throw new Error("系統設定錯誤：找不到 Google API Key，請檢查 .env 檔案。");
  }

  const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL_NAME}:generateContent?key=${activeKey}`;

  console.log(`🚀 正在請求 AI (Model: ${MODEL_NAME})...`);

  try {
    const response = await fetch(apiUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        // System Instruction: 從源頭要求 AI 輸出純 JSON
        system_instruction: { 
            parts: [{ text: "You are a strict API endpoint. Output ONLY valid JSON. Do not use Markdown formatting." }] 
        },
        contents: [{ parts: [{ text: prompt }] }]
      })
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error("❌ Google API 錯誤:", errorData);
      throw new Error(`API 請求失敗 (${response.status}): ${errorData.error?.message || "未知錯誤"}`);
    }

    const data = await response.json();
    
    if (!data.candidates || data.candidates.length === 0) {
        throw new Error("AI 暫時無法提供建議 (安全性攔截或忙碌中)");
    }

    let text = data.candidates[0].content?.parts?.[0]?.text || "";
    
    console.log("📜 AI 原始回傳:", text); 

    // 🔥 強力清洗：移除所有 Markdown 標記與非 JSON 的雜訊
    // 1. 移除 ``````
    text = text.replace(/``````/g, "").trim();
    
    // 2. 只抓取最外層的大括號 { ... }
    const jsonStart = text.indexOf('{');
    const jsonEnd = text.lastIndexOf('}');
    
    if (jsonStart !== -1 && jsonEnd !== -1) {
        text = text.substring(jsonStart, jsonEnd + 1);
    } else {
        throw new Error("AI 回傳的內容不包含有效的 JSON 結構");
    }

    return JSON.parse(text) as WeatherOutfitResponse;

  } catch (e: any) {
    console.error("🛑 解析失敗:", e);
    
    if (e instanceof SyntaxError) {
        console.error("JSON 解析錯誤，嘗試修復前的文字:", e.message);
        throw new Error("AI 回傳了無效的格式，請再按一次「生成」試試看。");
    }
    throw e; 
  }
};
