import { WeatherOutfitResponse, Gender, Style, ColorSeason, TimeOfDay, TargetDay } from '../types';

const MODEL_NAME = "gemini-2.5-flash"; 

const getApiKey = (keyName: string) => {
  const envKey = import.meta.env[keyName];
  if (!envKey) return null;
  return envKey.trim();
}

async function fetchPexelsImages(query: string): Promise<string[]> {
    const pexelsKey = getApiKey("VITE_PEXELS_API_KEY");
    if (!pexelsKey) return [];

    try {
        const randomPage = Math.floor(Math.random() * 5) + 1;
        let safeQuery = query;
        const lowerQ = query.toLowerCase();
        if (!lowerQ.includes("outfit") && !lowerQ.includes("fashion") && !lowerQ.includes("clothes")) {
             safeQuery = `${query} outfit`; 
        }
        const url = `https://api.pexels.com/v1/search?query=${encodeURIComponent(safeQuery)}&per_page=3&page=${randomPage}&orientation=portrait`;
        const res = await fetch(url, { headers: { Authorization: pexelsKey } });
        if (!res.ok) return [];
        const data = await res.json();
        
        if (data.photos.length === 0 && query.includes(" ")) {
            const shorter = query.split(" ").slice(1).join(" "); 
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

  // 🔥 12 色彩季型全攻略 (包含避雷區)
  const prompt = `
  角色：極度嚴格的色彩形象顧問。
  使用者：${genderStr}, 風格：${styleStr}。
  任務：針對「${colorSeason}」色彩季型，在「${location} ${dayLabel}${timeOfDay}」提供穿搭建議。

  【色彩資料庫：請嚴格遵守 ${colorSeason} 的規則，絕對禁止使用避雷色】

  ❄️ **WINTER (冬 - 冷/艷/深)**
  1. **Bright Winter (淨冬)**:
     - ✅ 推薦: Electric Blue, Hot Pink, Lemon Yellow, Emerald Green, Pine Green, Icy Grey, Pure White, Black. (高對比/鮮豔)
     - ❌ **禁止**: Olive Green, Mustard, Rust, Soft Pastels, Muted Earth Tones.
  2. **True Winter (冷冬)**:
     - ✅ 推薦: Holly Berry Red, Sapphire Blue, Royal Purple, Emerald, Charcoal, White, Black, Cool Grey. (正冷色)
     - ❌ **禁止**: Golden Brown, Orange, Warm Beige, Camel, Peach.
  3. **Dark Winter (深冬)**:
     - ✅ 推薦: Deep Teal, Burgundy, Midnight Blue, Dark Chocolate (Cool), Black, Charcoal, Deep Plum. (深沉濃郁)
     - ❌ **禁止**: Pale Pastels, Light Peach, Warm Orange, Light Beige.

  🍂 **AUTUMN (秋 - 暖/柔/深)**
  4. **Soft Autumn (柔秋)**:
     - ✅ 推薦: Sage Green, Dusty Pink, Oatmeal, Khaki, Warm Grey, Salmon, Olive, Butter Yellow. (低飽和/霧面)
     - ❌ **禁止**: Black, Bright Fuchsia, Electric Blue, Stark White.
  5. **True Autumn (暖秋)**:
     - ✅ 推薦: Mustard, Rust, Olive Green, Tomato Red, Golden Brown, Teal, Camel, Cream. (正暖色/大地色)
     - ❌ **禁止**: Pastel Pink, Blue-Grey, Black, Cool Berry.
  6. **Dark Autumn (深秋)**:
     - ✅ 推薦: Dark Olive, Terracotta, Dark Chocolate, Deep Forest Green, Burnt Orange, Maroon, Gold. (深沉溫暖)
     - ❌ **禁止**: Pale Pastels, Cool Grey, Hot Pink, Lilac.

  ☀️ **SPRING (春 - 暖/亮/清)**
  7. **Bright Spring (淨春)**:
     - ✅ 推薦: Bright Coral, Turquoise, Lime Green, Bright Yellow, Poppy Red, Warm Grey, Cream. (高彩度暖色)
     - ❌ **禁止**: Dusty colors, Muted Grey, Black, Burgundy.
  8. **True Spring (暖春)**:
     - ✅ 推薦: Golden Yellow, Peach, Salmon, Grass Green, Aqua, Camel, Ivory. (正暖亮色)
     - ❌ **禁止**: Black, Cool White, Dark Grey, Berry colors.
  9. **Light Spring (淺春)**:
     - ✅ 推薦: Pale Peach, Mint Green, Pale Yellow, Light Aqua, Ivory, Beige, Light Coral. (粉嫩暖色)
     - ❌ **禁止**: Black, Dark Brown, Burgundy, Navy.

  🌊 **SUMMER (夏 - 冷/柔/淺)**
  10. **Light Summer (淺夏)**:
     - ✅ 推薦: Powder Blue, Pale Pink, Lavender, Light Grey, Off-White, Mint, Sky Blue. (粉嫩冷色)
     - ❌ **禁止**: Black, Orange, Mustard, Dark Brown.
  11. **True Summer (冷夏)**:
     - ✅ 推薦: Raspberry, Soft Blue, Rose Pink, Grey Blue, Slate Grey, Cocoa (Cool), Soft White. (正冷柔色)
     - ❌ **禁止**: Orange, Gold, Rust, Yellow-Green.
  12. **Soft Summer (柔夏)**:
     - ✅ 推薦: Mauve, Dusty Blue, Grey Green, Charcoal Blue, Taupe, Soft White, Rose Brown. (帶灰調冷色)
     - ❌ **禁止**: Black, Bright Orange, Electric Blue, Stark White.

  【其他規則】
  1. 語言：JSON 所有描述文字必須用 **繁體中文**。
  2. 天氣建議：請提供 50-80 字的中文天氣叮嚀。
  3. Visual Prompts：請使用 **[準確色名] + [單品]** (例如 "Emerald Green Coat" 而非 "Green Coat")。

  請回傳 JSON:
  {
    "location": "${location}",
    "weather": {
      "location": "${location}",
      "temperature": "溫度", "feelsLike": "體感", "humidity": "濕度", "rainProb": "機率", "description": "簡述",
      "advice": "天氣叮嚀...",
      "forecast": [
         { "day": "今天", "condition": "...", "high": "...", "low": "...", "rainProb": "..." },
         { "day": "明天", "condition": "...", "high": "...", "low": "...", "rainProb": "..." },
         { "day": "後天", "condition": "...", "high": "...", "low": "...", "rainProb": "..." }
      ]
    },
    "outfit": {
      "items": [
         { "item": "單品名", "color": "色名", "reason": "理由", "detail": "細節", "icon": "tshirt" }
      ],
      "tips": "建議",
      "colorPalette": ["#Hex1", "#Hex2", "#Hex3"],
      "colorDescription": "配色說明",
      "visualPrompts": ["Specific Color Item", "Specific Color Item"]
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
    
    if (!parsedData.weather.advice && parsedData.weather.description) {
        parsedData.weather.advice = `目前天氣${parsedData.weather.description}，出門請留意天氣變化。`;
    }
  } catch (e) { throw e; }

  if (parsedData.outfit?.visualPrompts?.length > 0) {
      const [images1, images2] = await Promise.all([
          fetchPexelsImages(parsedData.outfit.visualPrompts[0]),
          fetchPexelsImages(parsedData.outfit.visualPrompts[1])
      ]);
      parsedData.generatedImages = [...images1.slice(0, 2), ...images2.slice(0, 1)];
      
      if (parsedData.generatedImages.length === 0) {
           const backupColor = parsedData.outfit.items[0].color; 
           parsedData.generatedImages = await fetchPexelsImages(`${backupColor} fashion outfit`);
      }
  }

  return parsedData;
};
