import { GoogleGenerativeAI } from "@google/generative-ai";
import { WeatherOutfitResponse, Gender, Style, ColorSeason, TimeOfDay, TargetDay } from '../types';

// 🔥 直接在這裡寫死鑰匙，這是最暴力的解法 🔥
const HARDCODED_KEY = "AIzaSyAdO6hqF6O759LOwQMpffepbKDcCYcGUjI"; 

export const getGeminiSuggestion = async (
  apiKey: string, // 這裡雖然有傳參數，但我們下面直接無視它，用寫死的
  location: string,
  gender: Gender,
  style: Style,
  colorSeason: ColorSeason,
  targetDay: TargetDay,
  timeOfDay: TimeOfDay
): Promise<WeatherOutfitResponse> => {

  // 建立 AI 連線，直接用寫死的 Key
  const genAI = new GoogleGenerativeAI(HARDCODED_KEY);
  
  // 設定模型
  const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

  const genderStr = gender === Gender.Male ? '男士' : gender === Gender.Female ? '女士' : '中性';
  const styleStr = style === Style.Casual ? '休閒' : style === Style.Formal ? '正式上班/商務' : '運動健身';

  // Resolve Target Day String
  const dayLabel = targetDay === TargetDay.Today ? '今天' : targetDay === TargetDay.Tomorrow ? '明天' : '後天';
  const fullTimeContext = `${dayLabel} ${timeOfDay}`;

  const prompt = `
  你是一個頂尖的時尚造型師與氣象專家。

  【使用者資料】
  1. 地點：${location}。
  2. **目標穿搭時間：${fullTimeContext}** (使用者要穿出門的時間)。
  3. 性別：${genderStr}。
  4. 風格：${styleStr}。
  5. 色彩季型：${colorSeason}。

  【任務】
  1. 分析 ${location} 的天氣與體感溫度。
  2. **務必提供從「今天」開始的未來三天天氣預報 (今天、明天、後天)**。
  3. 針對「目標穿搭時間」設計一套「主要推薦穿搭」並填入 JSON 的 items 欄位。
  4. **關鍵任務**：請在 JSON 的 "visualPrompts" 欄位中，產生 **3 組截然不同** 的英文影像提示詞 (Prompts)，這將用於產生圖片：
     - **Style 1 (Main Look)**：與 items 欄位完全一致的標準搭配。
     - **Style 2 (Trendy)**：更時尚、大膽的變體。
     - **Style 3 (Relaxed)**：另一種氛圍的搭配。

  請以 JSON 格式回傳，不要有 Markdown 標記。
  `;

  const result = await model.generateContent(prompt);
  const response = await result.response;
  const text = response.text();
  
  // 清理 JSON 字串 (以防 AI 回傳了 markdown code block)
  const cleanText = text.replace(/```json/g, '').replace(/```/g, '').trim();

  return JSON.parse(cleanText) as WeatherOutfitResponse;
};
