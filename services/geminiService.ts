import { WeatherOutfitResponse, Gender, Style, ColorSeason, TimeOfDay, TargetDay } from '../types';

const MODEL_NAME = "gemini-2.5-flash"; 

const getApiKey = (keyName: string) => {
  const envKey = import.meta.env[keyName];
  if (!envKey) return null;
  return envKey.trim();
}

// Pexels 搜尋 (保持隨機性)
async function fetchPexelsImages(query: string): Promise<string[]> {
    const pexelsKey = getApiKey("VITE_PEXELS_API_KEY");
    if (!pexelsKey) return [];

    try {
        const randomPage = Math.floor(Math.random() * 5) + 1; // 增加隨機範圍到 5 頁
        const url = `https://api.pexels.com/v1/search?query=${encodeURIComponent(query)}&per_page=3&page=${randomPage}&orientation=portrait`;
        const res = await fetch(url, { headers: { Authorization: pexelsKey } });
        if (!res.ok) return [];
        const data = await res.json();
        
        // 找不到就縮短關鍵字重試
        if (data.photos.length === 0 && query.includes(" ")) {
            const shorter = query.split(" ").slice(1).join(" "); // 試著去掉第一個字(通常是顏色形容詞)
            return fetchPexelsImages(shorter);
        }
        return data.photos.map((photo: any) => photo.src.large2x || photo.src.medium);
    } catch (e) { return []; }
}

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

  const googleKey = getApiKey("VITE_GOOGLE_API_KEY");
  if (!googleKey) throw new Error("系統錯誤：找不到 VITE_GOOGLE_API_KEY");

  const genderStr = gender === Gender.Male ? '男士' : gender === Gender.Female ? '女士' : '中性';
  const styleStr = style === Style.Casual ? '休閒' : style === Style.Formal ? '正式' : '運動';
  const dayLabel = targetDay === TargetDay.Today ? '今天' : targetDay === TargetDay.Tomorrow ? '明天' : '後天';

  // 🔥 12 色彩季型詳細定義庫 (Embed Knowledge Base)
  // 這裡包含了每個季型的核心色、強調色與避雷區，讓 AI 選擇更精準
  const prompt = `
  角色：頂尖色彩形象顧問。
  使用者：${genderStr}, 風格：${styleStr}。
  **核心任務：針對「${colorSeason}」色彩季型，在「${location} ${dayLabel}${timeOfDay}」的天氣下提供穿搭。**

  【色彩資料庫：請嚴格從下方清單挑選對應 ${colorSeason} 的顏色】
  
  ❄️ **WINTER (冬 - 冷/艷/深)**
  - **Bright Winter (淨冬)**: Electric Blue, Hot Pink, Lemon Yellow, Icy Grey, Pure White, Black, Emerald Green, Royal Purple. (高對比、鮮豔)
  - **True Winter (冷冬)**: Holly Berry Red, Pine Green, Sapphire Blue, Charcoal, White, Black, Cool Grey, Plum. (正冷色)
  - **Dark Winter (深冬)**: Deep Teal, Burgundy, Midnight Blue, Dark Chocolate (Cool), Black, Charcoal, Deep Plum. (深沉濃郁)

  🍂 **AUTUMN (秋 - 暖/柔/深)**
  - **Soft Autumn (柔秋)**: Sage Green, Dusty Pink, Oatmeal, Khaki, Warm Grey, Salmon, Olive, Butter Yellow. (低飽和、霧面)
  - **True Autumn (暖秋)**: Mustard, Rust, Olive Green, Tomato Red, Golden Brown, Teal, Camel, Cream. (正暖色、大地色)
  - **Dark Autumn (深秋)**: Dark Olive, Terracotta, Dark Chocolate, Deep Forest Green, Burnt Orange, Maroon, Gold. (深沉溫暖)

  ☀️ **SPRING (春 - 暖/亮/清)**
  - **Bright Spring (淨春)**: Bright Coral, Turquoise, Lime Green, Bright Yellow, Poppy Red, Warm Grey, Cream. (高彩度暖色)
  - **True Spring (暖春)**: Golden Yellow, Peach, Salmon, Grass Green, Aqua, Camel, Ivory. (正暖亮色)
  - **Light Spring (淺春)**: Pale Peach, Mint Green, Pale Yellow, Light Aqua, Ivory, Beige, Light Coral. (粉嫩暖色)

  🌊 **SUMMER (夏 - 冷/柔/淺)**
  - **Light Summer (淺夏)**: Powder Blue, Pale Pink, Lavender, Light Grey, Off-White, Mint, Sky Blue. (粉嫩冷色)
  - **True Summer (冷夏)**: Raspberry, Soft Blue, Rose Pink, Grey Blue, Slate Grey, Cocoa (Cool), Soft White. (正冷柔色)
  - **Soft Summer (柔夏)**: Mauve, Dusty Blue, Grey Green, Charcoal Blue, Taupe, Soft White, Rose Brown. (帶灰調冷色)

  【生成規則】
  1. **Visual Prompts (關鍵)**: 生成搜尋關鍵字時，必須使用上述資料庫中的 **"具體色名" + "單品"**。
     - ✅ 正確: "Sage Green Sweater" (柔秋), "Electric Blue Coat" (淨冬)
     - ❌ 錯誤: "Green Sweater", "Blue Coat" (太籠統，搜不到好圖)
  2. **Items**: 推薦單品時，請描述該顏色的具體名稱 (例如寫「鼠尾草綠」而不是「綠色」)。

  請回傳 JSON:
  {
    "location": "${location}",
    "weather": {
      "location": "${location}",
      "temperature": "溫度", "feelsLike": "體感", "humidity": "濕度", "rainProb": "機率", "description": "簡述",
      "forecast": [
         { "day": "今天", "condition": "...", "high": "...", "low": "...", "rainProb": "..." },
         { "day": "明天", "condition": "...", "high": "...", "low": "...", "rainProb": "..." },
         { "day": "後天", "condition": "...", "high": "...", "low": "...", "rainProb": "..." }
      ]
    },
    "outfit": {
      "items": [
         { "item": "單品名", "color": "精確色名", "reason": "...", "detail": "...", "icon": "tshirt" }
      ],
      "tips": "...",
      "colorPalette": ["#Hex1", "#Hex2", "#Hex3"],
      "colorDescription": "...",
      "visualPrompts": ["Specific Color Item", "Specific Color Item", "Specific Color Item"]
    },
    "generatedImages": [] 
  }
  `;

  const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL_NAME}:generateContent?key=${googleKey}`;
  let parsedData: WeatherOutfitResponse;

  try {
    const response = await fetch(apiUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: { response_mime_type: "application/json" }
      })
    });

    if (!response.ok) throw new Error("API Fail");
    const data = await response.json();
    const rawText = data.candidates?.[0]?.content?.parts?.[0]?.text || "";
    parsedData = JSON.parse(repairJson(rawText));
  } catch (e) { throw e; }

  // 搜尋圖片
  if (parsedData.outfit?.visualPrompts?.length > 0) {
      const prompt1 = parsedData.outfit.visualPrompts[0]; 
      const prompt2 = parsedData.outfit.visualPrompts[1]; 
      
      // 同時搜尋兩個關鍵字，確保畫面豐富
      const [images1, images2] = await Promise.all([
          fetchPexelsImages(prompt1),
          fetchPexelsImages(prompt2)
      ]);
      
      parsedData.generatedImages = [...images1.slice(0, 2), ...images2.slice(0, 1)];
      
      // 如果沒圖，用更寬泛的關鍵字補救 (例如只搜顏色)
      if (parsedData.generatedImages.length === 0) {
           const backupColor = parsedData.outfit.items[0].color; // 拿第一件單品的顏色
           parsedData.generatedImages = await fetchPexelsImages(`${backupColor} fashion`);
      }
  }

  return parsedData;
};
