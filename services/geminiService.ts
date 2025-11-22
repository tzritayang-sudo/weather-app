import { GoogleGenAI } from "@google/genai";
import { WeatherOutfitResponse, Gender, Style, ColorSeason, TimeOfDay, TargetDay } from '../types';

export const getGeminiSuggestion = async (
  apiKey: string,
  location: string, 
  gender: Gender, 
  style: Style, 
  colorSeason: ColorSeason,
  targetDay: TargetDay,
  timeOfDay: TimeOfDay
): Promise<WeatherOutfitResponse> => {
  
  if (!apiKey) {
    throw new Error("請先於設定中輸入您的 Google Gemini API Key");
  }

  const ai = new GoogleGenAI({ apiKey });

  const genderStr = gender === Gender.Male ? '男士' : gender === Gender.Female ? '女士' : '中性';
  const styleStr = style === Style.Casual ? '休閒' : style === Style.Formal ? '正式上班/商務' : '運動健身';
  
  // Resolve Target Day String
  const dayLabel = targetDay === TargetDay.Today ? '今天' : targetDay === TargetDay.Tomorrow ? '明天' : '後天';
  const fullTimeContext = `${dayLabel} ${timeOfDay}`;

  const prompt = `
    你是一個頂尖的時尚造型師與氣象專家。
    
    【使用者資料】
    1. 地點：${location} (請預測 ${location} **${fullTimeContext}** 的天氣)。
    2. **目標時間：${fullTimeContext}** (使用者要穿出門的時間)。
    3. 性別：${genderStr}。
    4. 風格：${styleStr}。
    5. 色彩季型：${colorSeason}。

    【任務】
    1. 分析天氣與體感溫度。
    2. 設計一套「主要推薦穿搭」並填入 JSON 的 items 欄位。
    3. **關鍵任務**：請在 JSON 的 "visualPrompts" 欄位中，產生 **3 組截然不同** 的英文影像提示詞 (Prompts)，這將用於生成三張不同風格的穿搭圖供使用者選擇：
       - **Style 1 (Main)**: 與 items 欄位完全一致的標準搭配。
       - **Style 2 (Fashion/Trendy)**: 同樣符合天氣，但更時尚、大膽、更有設計感的變體 (例如：不同的外套剪裁、更時髦的配件、多層次穿搭)。
       - **Style 3 (Vibe/Relaxed)**: 另一種氛圍的搭配 (例如：若 Style 1 是褲裝，這裡可嘗試裙裝或寬褲，或是不同的材質運用)。

    【色彩季型邏輯】
    請嚴格根據 ${colorSeason} 挑選顏色。

    請回傳 **純 JSON**，格式如下：
    {
      "location": "${location}",
      "weather": {
        "location": "${location}",
        "temperature": "25°C",
        "feelsLike": "27°C",
        "humidity": "70%",
        "rainProb": "30%",
        "description": "天氣簡述",
        "forecast": [
          { "day": "${dayLabel}", "condition": "...", "high": "...", "low": "...", "rainProb": "..." },
          ...
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
           "Full body shot of ${genderStr} wearing [Describe Main Look details]...",
           "Full body shot of ${genderStr} wearing [Describe Trendy Look details]...",
           "Full body shot of ${genderStr} wearing [Describe Alternative Look details]..."
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
            `Full body fashion photo, ${genderStr}, wearing ${itemsDesc}, ${styleStr} style, street photography.`,
            `Full body fashion photo, ${genderStr}, wearing ${itemsDesc}, but make it more high-fashion editorial, dynamic pose.`,
            `Full body fashion photo, ${genderStr}, wearing ${itemsDesc}, minimalist and chic vibe.`
         ];
      }

      // Append common high-quality keywords to all prompts
      const enhancedPrompts = prompts.map(p => 
        `${p}. Location: ${location} street. Lighting: ${timeOfDay === TimeOfDay.Night ? 'Cinematic night city lights' : 'Natural soft daylight'}. 8k resolution, photorealistic, fashion magazine style, masterpiece.`
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