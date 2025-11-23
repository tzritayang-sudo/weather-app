import { WeatherOutfitResponse, Gender, Style, ColorSeason, TimeOfDay, TargetDay } from '../types';

// 🔥 模型名稱固定為 2.5-flash
const MODEL_NAME = "gemini-2.5-flash"; 

// 🎯 安全地從環境變數讀取金鑰，避免公開
const getApiKey = () => {
  // 這會讀取 Vercel Environment Variables 裡設定的 VITE_GOOGLE_API_KEY
  const envKey = import.meta.env.VITE_GOOGLE_API_KEY;
  if (!envKey) {
     console.error("VITE_GOOGLE_API_KEY 環境變數未設定！");
     // 在開發模式下可以提供一個假的錯誤，避免頁面完全當機
     return "API_KEY_MISSING_FROM_VARS"; 
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

  const genderStr = gender === Gender.Male ? '男士' : gender === Gender.Female ? '女士' : '中性';
  const styleStr = style === Style.Casual ? '休閒' : style === Style.Formal ? '正式上班/商務' : '運動健身';
  const dayLabel = targetDay === TargetDay.Today ? '今天' : targetDay === TargetDay.Tomorrow ? '明天' : '後天';
  const fullTimeContext = `${dayLabel} ${timeOfDay}`;

  const prompt = `
  你是一個頂尖的時尚造型師與氣象專家。請嚴格只回傳 JSON 格式。
  【使用者資料】
  1. 地點：${location}。
  2. 目標時間：${fullTimeContext}。
  3. 性別：${genderStr}。
  4. 風格：${styleStr}。
  5. 色彩季型：${colorSeason}。
  【任務】
  1. 分析天氣。
  2. 提供穿搭建議 (items)。
  3. 產生 3 組 visualPrompts。
  請直接回傳 JSON 格式，不要包含 Markdown 標記 (如 \`\`\`json)。
  `;

  const activeKey = getApiKey();
  
  // 檢查金鑰是否成功讀取，否則在前端報錯
  if (activeKey === "API_KEY_MISSING_FROM_VARS") {
      throw new Error("系統錯誤：API Key 未在 Vercel 環境變數中設定。");
  }


  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${MODEL_NAME}:generateContent?key=${activeKey}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }]
      })
    }
  );

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.error?.message || "連線 Google 失敗。");
  }

  const data = await response.json();
  const text = data.candidates?.[0]?.content?.parts?.[0]?.text || "";
  
  // JSON 清道夫：提取第一個 { 到最後一個 }，解決 AI 格式不穩定的問題
  const jsonMatch = text.match(/\{[\s\S]*\}/); 
  const cleanText = jsonMatch ? jsonMatch[0] : text;

  try {
    return JSON.parse(cleanText) as WeatherOutfitResponse;
  } catch (e) {
    console.error("JSON 解析失敗，原始文字:", text);
    throw new Error("AI 回傳格式錯誤，請重試");
  }
};
