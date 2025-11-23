import { WeatherOutfitResponse, Gender, Style, ColorSeason, TimeOfDay, TargetDay } from '../types';

// ⚠️⚠️⚠️ 這是你的真鑰匙，請確認它在這裡 ⚠️⚠️⚠️
const FINAL_KEY = "AIzaSyAAwDoWIrkVJppg9jmzvKMqNrfaka57JJY"; // 請確認引號內是你真正的鑰匙

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
  你是一個頂尖的時尚造型師與氣象專家。
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
  請直接回傳 JSON 格式。
  `;

  // 🔥 關鍵修改：改用 'gemini-2.5-flash'，這是目前最新、最可靠的模型 🔥
  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${FINAL_KEY}`,
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
    throw new Error(errorData.error?.message || "連線 Google 失敗");
  }

  const data = await response.json();
  const text = data.candidates?.[0]?.content?.parts?.[0]?.text || "";
  const cleanText = text.replace(/```json/g, '').replace(/```/g, '').trim();

  try {
    return JSON.parse(cleanText) as WeatherOutfitResponse;
  } catch (e) {
    console.error("解析失敗:", text);
    throw new Error("AI 回傳格式錯誤，請重試");
  }
};
