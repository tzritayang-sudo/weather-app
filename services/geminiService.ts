import { WeatherOutfitResponse, Gender, Style, ColorSeason, TimeOfDay, TargetDay } from '../types';

// 🔥 修正 1: 設定正確的 2025 年模型名稱
const MODEL_NAME = "gemini-2.5-flash"; 

// 🎯 安全地從環境變數讀取金鑰
const getApiKey = () => {
  // 嘗試讀取常見的環境變數名稱，相容 Vercel/Vite
  const envKey = import.meta.env.VITE_GOOGLE_API_KEY || process.env.NEXT_PUBLIC_GOOGLE_API_KEY;
  
  if (!envKey) {
     console.error("❌ 嚴重錯誤：未找到 VITE_GOOGLE_API_KEY 或 NEXT_PUBLIC_GOOGLE_API_KEY");
     return "API_KEY_MISSING"; 
  }
  return envKey.trim();
}

export const getGeminiSuggestion = async (
  apiKey: string, 
  location: string,
  gender: Gender,
  style: Style,
  colorSeason: ColorSeason,
  targetDay: TargetDay,
  timeOfDay: TimeOfDay
): Promise<WeatherOutfitResponse> => {

  // 1. 準備提示詞參數
  const genderStr = gender === Gender.Male ? '男士' : gender === Gender.Female ? '女士' : '中性';
  const styleStr = style === Style.Casual ? '休閒' : style === Style.Formal ? '正式上班/商務' : '運動健身';
  const dayLabel = targetDay === TargetDay.Today ? '今天' : targetDay === TargetDay.Tomorrow ? '明天' : '後天';
  const fullTimeContext = `${dayLabel} ${timeOfDay}`;

  const prompt = `
  你是一個頂尖的時尚造型師與氣象專家。請嚴格只回傳標準 JSON 格式，不要使用 Markdown。
  【使用者資料】
  1. 地點：${location}。
  2. 目標時間：${fullTimeContext}。
  3. 性別：${genderStr}。
  4. 風格：${styleStr}。
  5. 色彩季型：${colorSeason}。
  【任務】
  1. 分析該地區該時段天氣。
  2. 提供穿搭建議 (items)。
  3. 產生 3 組 visualPrompts 用於生成圖片。
  請回傳純 JSON 字串。
  `;

  // 2. 取得並檢查 API Key
  const activeKey = getApiKey();
  if (activeKey === "API_KEY_MISSING") {
      // 拋出明確錯誤，避免白畫面
      throw new Error("系統設定錯誤：找不到 Google API Key，請檢查 .env 檔案。");
  }

  // 🔥 修正 2: 建構正確的 API 網址，防止 models/ 重複
  // 如果 MODEL_NAME 已經包含 "models/" 則不重複添加，否則補上
  const finalModelName = MODEL_NAME.startsWith("models/") ? MODEL_NAME : `models/${MODEL_NAME}`;
  const apiUrl = `https://generativelanguage.googleapis.com/v1beta/${finalModelName}:generateContent?key=${activeKey}`;

  console.log(`🚀 正在請求 AI: ${finalModelName}...`);

  try {
    // 3. 發送請求
    const response = await fetch(apiUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }]
      })
    });

    // 🔥 修正 3: 詳細錯誤處理，防止 fetch 失敗導致白畫面
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: { message: "無法解析錯誤詳情" } }));
      console.error("❌ Google API 回傳錯誤:", errorData);
      
      // 判斷是否為常見的模型不存在錯誤
      if (response.status === 404) {
        throw new Error(`模型錯誤 (404): 找不到模型 '${MODEL_NAME}'，請確認名稱是否正確。`);
      }
      throw new Error(`AI 請求失敗 (${response.status}): ${errorData.error?.message}`);
    }

    // 4. 解析回傳資料
    const data = await response.json();
    
    // 🔥 修正 4: 檢查 candidates 是否存在，防止 "undefined" 錯誤
    if (!data.candidates || data.candidates.length === 0) {
        console.warn("⚠️ AI 回傳了空內容 (可能是安全過濾):", data);
        if (data.promptFeedback) {
            throw new Error(`AI 拒絕回答: 安全性攔截 (${JSON.stringify(data.promptFeedback)})`);
        }
        throw new Error("AI 暫時無法提供建議，請稍後再試。");
    }

    const text = data.candidates[0].content?.parts?.[0]?.text || "";
    
    // 5. JSON 清洗與解析
    const jsonMatch = text.match(/\{[\s\S]*\}/); 
    const cleanText = jsonMatch ? jsonMatch[0] : text;

    return JSON.parse(cleanText) as WeatherOutfitResponse;

  } catch (e: any) {
    // 🔥 修正 5: 捕捉所有錯誤並印出，方便 F12 除錯
    console.error("🛑 處理穿搭建議時發生例外:", e);
    
    // 如果是 JSON 解析錯誤，提供更友善的訊息
    if (e instanceof SyntaxError) {
        throw new Error("AI 回傳了無效的格式，請重試一次。");
    }
    
    throw e; // 將錯誤往上拋，讓 UI 顯示錯誤訊息
  }
};
