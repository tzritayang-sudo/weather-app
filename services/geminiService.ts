import { GoogleGenAI } from "@google/genai";
import { WeatherOutfitResponse, Gender, Style, ColorSeason, TimeOfDay, TargetDay } from '../types';

export const getGeminiSuggestion = async (
  location: string, 
  gender: Gender, 
  style: Style, 
  colorSeason: ColorSeason,
  targetDay: TargetDay,
  timeOfDay: TimeOfDay
): Promise<WeatherOutfitResponse> => {
  
  // Security Check: Ensure API Key is loaded from environment variables
  if (!process.env.API_KEY) {
    throw new Error("API Key is missing. Please check your environment variables (API_KEY).");
  }

  // Use process.env.API_KEY exclusively as per guidelines
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

  const genderStr = gender === Gender.Male ? '男士' : gender === Gender.Female ? '女士' : '中性';
  const styleStr = style === Style.Casual ? '休閒' : style === Style.Formal ? '正式上班/商務' : '運動健身';
  
  // Resolve Target Day String for context, but forecast is always Today+3
  const dayLabel = targetDay === TargetDay.Today ? '今天' : targetDay === TargetDay.Tomorrow ? '明天' : '後天';
  const fullTimeContext = `${dayLabel} ${timeOfDay}`;

  const prompt = `
    你是一個頂尖的時尚造型師與氣象專家。
    
    【使用者資料】
    1. 地點：${location}。
    2. **目標穿搭時間：${fullTimeContext}** (這是使用者要穿出門的時間，請針對此時間點做穿搭建議)。
    3. 性別：${genderStr}。
    4. 風格：${styleStr}。
    5. 色彩季型：${colorSeason}。

    【任務】
    1. 分析 ${location} 的天氣。
    2. **天氣預報要求 (重要)**：無論使用者的目標時間為何，請務必提供 **「今天」、「明天」、「後天」** 這連續三天的天氣簡報。
    3. 針對「目標穿搭時間」設計一套「主要推薦穿搭」並填入 JSON 的 items 欄位。
    4. **視覺風格 (Visual Prompts)**：請在 "visualPrompts" 欄位產生 3 組英文提示詞，分別對應三種不同氛圍，用於生成圖片：
       - **Look 1 (Standard)**: 忠實呈現 items 欄位的標準穿搭。
       - **Look 2 (Trendy/Chic)**: 使用相同單品，但採用更時尚、街拍感的穿法或剪裁 (High-fashion editorial)。
       - **Look 3 (Relaxed/Vibe)**: 較為放鬆、強調氛圍感的呈現方式 (Relaxed mood)。

    【色彩季型邏輯】
    請嚴格根據 ${colorSeason} 挑選顏色。

    請回傳 **純 JSON**，格式如下：
    {
      "location": "${location}",
      "weather": {
        "location": "${location}",
        "temperature": "目標時間氣溫 (例如 25°C)",
        "feelsLike": "目標時間體感 (例如 27°C)",
        "humidity": "濕度",
        "rainProb": "降雨率",
        "description": "針對目標時間的天氣簡述",
        "forecast": [
          { "day": "今天", "condition": "...", "high": "...", "low": "...", "rainProb": "..." },
          { "day": "明天", "condition": "...", "high": "...", "low": "...", "rainProb": "..." },
          { "day": "後天", "condition": "...", "high": "...", "low": "...", "rainProb": "..." }
        ]
      },
      "outfit": {
        "colorDescription": "配色說明...",
        "colorPalette": ["#Hex1", "#Hex2", "#Hex3", "#Hex4", "#Hex5"],
        "items": [
          { "item": "單品名稱", "icon": "icon_key", "color": "顏色", "reason": "原因" }
        ],
        "tips": "造型建議",
        "visualPrompts": [
           "Full body shot, standard look...",
           "Full body shot, trendy editorial look...",
           "Full body shot, relaxed vibe..."
        ]
      }
    }
  `;

  try {
    // 1. Get Text/JSON Response
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: {
        responseMimeType: 'application/json'
      }
    });

    const text = response.text;
    if (!text) throw new Error("No response from AI");

    const cleanText = text.replace(/```json/g, '').replace(/```/g, '').trim();
    const data = JSON.parse(cleanText) as WeatherOutfitResponse;

    // 2. Generate 3 Images based on DISTINCT prompts
    try {
      // Default prompts if AI fails to generate visualPrompts
      let prompts = data.outfit.visualPrompts;
      
      if (!prompts || prompts.length < 3) {
         const itemsDesc = data.outfit.items.map(i => `${i.color} ${i.item}`).join(', ');
         prompts = [
            `Full body fashion photo, ${genderStr}, wearing ${itemsDesc}, ${styleStr} style, standard catalog pose, clear lighting.`,
            `Full body fashion photo, ${genderStr}, wearing ${itemsDesc}, high-fashion street style, dynamic movement, editorial lighting.`,
            `Full body fashion photo, ${genderStr}, wearing ${itemsDesc}, soft artistic vibe, relaxed posture, atmospheric lighting.`
         ];
      }

      // Append common high-quality keywords to all prompts
      const enhancedPrompts = prompts.map(p => 
        `${p}. Location: ${location} outdoor/city. Lighting: ${timeOfDay === TimeOfDay.Night ? 'Night city bokeh' : 'Natural daylight'}. 8k resolution, photorealistic, masterpiece, detailed textures.`
      );

      // Parallel generation
      const imagePromises = enhancedPrompts.map(p => 
        ai.models.generateContent({
          model: 'gemini-2.5-flash-image',
          contents: { parts: [{ text: p }] }
        })
      );

      const imageResponses = await Promise.all(imagePromises);
      
      data.generatedImages = [];
      
      for (const imgResp of imageResponses) {
         for (const part of imgResp.candidates?.[0]?.content?.parts || []) {
            if (part.inlineData) {
              data.generatedImages.push(`data:image/png;base64,${part.inlineData.data}`);
              break; 
            }
         }
      }

    } catch (imgError) {
      console.error("Image generation failed:", imgError);
    }

    return data;

  } catch (error) {
    console.error("Gemini API Error:", error);
    throw error;
  }
};
