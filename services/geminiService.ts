import { GoogleGenerativeAI } from "@google/generative-ai";
import { WeatherOutfitResponse, Gender, Style, ColorSeason, TimeOfDay, TargetDay } from '../types';

// 🔥 萬能鑰匙：直接寫死在這裡，保證讀得到 🔥
const FINAL_KEY = "AIzaSyAdO6hqF6O759LOwQMpffepbKDcCYcGUjI";

export const getGeminiSuggestion = async (
  apiKey: string, 
  location: string,
  gender: Gender,
  style: Style,
  colorSeason: ColorSeason,
  targetDay: TargetDay,
  timeOfDay: TimeOfDay
): Promise<WeatherOutfitResponse> => {

  // 1. 不管外面傳什麼鑰匙進來，我們先檢查有沒有寫死的鑰匙
  // 這樣就算 App.tsx 傳空值，這裡也能運作
  const activeKey = FINAL_KEY;

  if (!activeKey) {
      throw new Error("請檢查程式碼中的 API Key 設定");
  }

  // 2. 建立連線
  const genAI = new GoogleGenerativeAI(activeKey);
  
  // 3. 設定模型：改回最穩定的 'gemini-pro'
  // 這樣就算工具包版本舊，也絕對能跑！
  const model = genAI.getGenerativeModel({ model: "gemini-pro" });

  // 4. 準備提示詞參數
  const genderStr = gender === Gender.Male ? '男士' : gender === Gender.Female ? '女士' : '中性';
  const styleStr = style === Style.Casual ? '休閒' : style === Style.Formal ? '正式上班/商務' : '運動健身';
  const dayLabel = targetDay === TargetDay.Today ? '今天' : targetDay === TargetDay.Tomorrow ? '明天' : '後天';
  const fullTimeContext = `${dayLabel} ${timeOfDay}`;

  const prompt = `
  你是一個頂尖的時尚造型師與氣象專家。

  【使用者資料】
  1. 地點：${location}。
  2. 目標時間：${fullTimeContext}。
  3. 性別：${genderStr}。
  4. 風格：${styleStr}。
  5. 色彩季型：${colorSeason}。

  【任務】
  1. 分析該地點天氣。
  2. 設計一套穿搭建議，填入 JSON 的 items 欄位。
  3. 產生 3 組 visualPrompts (Style 1, Style 2, Style 3)。

  請直接回傳 JSON 格式。
  `;

  // 5. 發送請求
  try {
      const result = await model.generateContent(prompt);
      const response = await result.response;
      const text = response.text();
      
      // 清理可能多餘的符號
      const cleanText = text.replace(/```json/g, '').replace(/```/g, '').trim();
      return JSON.parse(cleanText) as WeatherOutfitResponse;
} catch (error: any) {
      console.error("Gemini API Error:", error);
      // 把真正的錯誤秀出來
      const rawError = error.message || JSON.stringify(error);
      throw new Error(`錯誤代碼: ${rawError}`);
  }
};
