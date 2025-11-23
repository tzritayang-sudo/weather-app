// 檔案位置: services/geminiService.ts

import { WeatherOutfitResponse, Gender, Style, ColorSeason, TimeOfDay, TargetDay } from '../types';

// 🔥 設定正確的模型名稱 (注意：這裡不要自己加 "models/")
const MODEL_NAME = "gemini-2.5-flash"; 

// 🎯 從環境變數讀取 API Key
const getApiKey = () => {
  // 嘗試讀取 VITE_ 開頭的變數 (適用於你的 Vite 專案)
  const envKey = import.meta.env.VITE_GOOGLE_API_KEY;
  
  if (!envKey) {
     console.error("❌ 嚴重錯誤：找不到 VITE_GOOGLE_API_KEY，請檢查 .env 檔案");
     // 回傳一個標記，讓後面可以拋出更具體的錯誤
     return "MISSING"; 
  }
  return envKey.trim();
}

export const getGeminiSuggestion = async (
  // 這裡移除了 apiKey 參數，因為我們直接從環境變數讀取，這樣比較安全
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

  const prompt = `
  你是一個頂尖的時尚造型師與氣象專家。請嚴格只回傳標準 JSON 格式，不要使用 Markdown 標記。
  【使用者資料】
  1. 地點：${location}
  2. 時間：${fullTimeContext}
  3. 性別：${genderStr}
  4. 風格：${styleStr}
  5. 色彩季型：${colorSeason}
  【任務】
  1. 分析天氣
  2. 提供穿搭建議
  3. 產生 3 組 visualPrompts (用於 AI 繪圖)
  請回傳純 JSON 字串。
  `;

  const activeKey = getApiKey();
  if (activeKey === "MISSING") {
      throw new Error("系統設定錯誤：找不到 Google API Key，請檢查 .env 檔案。");
  }

  // 🔥 建構正確的 API 網址
  const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL_NAME}:generateContent?key=${activeKey}`;

  console.log(`🚀 正在請求 AI...`);

  try {
    const response = await fetch(apiUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
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

    const text = data.candidates[0].content?.parts?.[0]?.text || "";
    
    // JSON 清洗：只抓取第一個 { 到最後一個 }
    const jsonMatch = text.match(/\{[\s\S]*\}/); 
    const cleanText = jsonMatch ? jsonMatch[0] : text;

    return JSON.parse(cleanText) as WeatherOutfitResponse;

  } catch (e: any) {
    console.error("🛑 錯誤:", e);
    // 如果是 JSON 解析失敗，給一個好懂的錯誤訊息
    if (e instanceof SyntaxError) {
        throw new Error("AI 回傳了無效的格式，請重試一次。");
    }
    throw e; 
  }
};
