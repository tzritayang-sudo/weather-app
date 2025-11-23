import { WeatherOutfitResponse, Gender, Style, ColorSeason, TimeOfDay, TargetDay } from '../types';

const MODEL_NAME = "gemini-2.5-flash"; 

const getApiKey = (keyName: string) => {
  const envKey = import.meta.env[keyName];
  if (!envKey) return null;
  return envKey.trim();
}

// Pexels 搜尋 (保持隨機與備援機制)
async function fetchPexelsImages(query: string): Promise<string[]> {
    const pexelsKey = getApiKey("VITE_PEXELS_API_KEY");
    if (!pexelsKey) return [];

    try {
        const randomPage = Math.floor(Math.random() * 5) + 1;
        const url = `https://api.pexels.com/v1/search?query=${encodeURIComponent(query)}&per_page=3&page=${randomPage}&orientation=portrait`;
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

  const prompt = `
  角色：你的身分是「專業氣象主播」兼「時尚顧問」。
  使用者：${genderStr}, 風格：${styleStr}。
  任務：針對「${colorSeason}」色彩季型，在「${location} ${dayLabel}${timeOfDay}」提供建議。

  【重要規則】
  1. **語言**：JSON 中的所有描述性文字 (description, reason, tips, advice) 必須使用 **繁體中文**。
  2. **天氣建議 (advice)**：請提供一段 50-80 字的貼心叮嚀。
     - 提到體感溫度（如：風大會覺得冷）。
     - 提到降雨對策（如：帶傘、防水鞋）。
     - 提到穿脫方便性（如：室內外溫差）。

  【色彩資料庫 (僅供搜尋關鍵字使用，描述請用中文)】
  ❄️ WINTER: Electric Blue, Hot Pink, Icy Grey, Pine Green.
  🍂 AUTUMN: Sage Green, Rust, Mustard, Terracotta.
  ☀️ SPRING: Coral, Turquoise, Lime Green, Cream.
  🌊 SUMMER: Powder Blue, Lavender, Soft Grey, Mint.

  請回傳 JSON:
  {
    "location": "${location}",
    "weather": {
      "location": "${location}",
      "temperature": "溫度 (如 24°C)", 
      "feelsLike": "體感溫度", 
      "humidity": "濕度", 
      "rainProb": "降雨機率", 
      "description": "簡短天氣狀況 (如 多雲短暫雨)",
      
      // 🔥 新增：請在這裡寫一段詳細且溫暖的天氣叮嚀
      "advice": "這裡請寫一段溫暖的天氣建議，例如：今天雖然有陽光，但風勢較強，體感會比實際溫度低，建議帶件防風外套。若要騎車通勤，請務必注意保暖...",
      
      "forecast": [
         { "day": "今天", "condition": "天氣", "high": "高", "low": "低", "rainProb": "率" },
         { "day": "明天", "condition": "天氣", "high": "高", "low": "低", "rainProb": "率" },
         { "day": "後天", "condition": "天氣", "high": "高", "low": "低", "rainProb": "率" }
      ]
    },
    "outfit": {
      "items": [
         { "item": "單品中文名", "color": "顏色中文名", "reason": "推薦理由", "detail": "材質細節", "icon": "tshirt" }
      ],
      "tips": "整體造型建議 (中文)",
      "colorPalette": ["#Hex1", "#Hex2", "#Hex3"],
      "colorDescription": "配色靈感 (中文)",
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
    
    // 防呆：如果 AI 忘了給 advice 欄位，自己補一個
    if (!parsedData.weather.advice && parsedData.weather.description) {
        parsedData.weather.advice = `目前天氣為${parsedData.weather.description}，出門請留意天氣變化。`;
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
           parsedData.generatedImages = await fetchPexelsImages(`${backupColor} fashion`);
      }
  }

  return parsedData;
};
