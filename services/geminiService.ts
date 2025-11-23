import { WeatherOutfitResponse, Gender, Style, ColorSeason, TimeOfDay, TargetDay } from '../types';

// 🔥 改用最通用的 gemini-pro，這幾乎不可能 404
const MODEL_NAME = "gemini-pro"; 

const getApiKey = (keyName: string) => {
  const envKey = import.meta.env[keyName];
  if (!envKey) return null;
  return envKey.trim();
}

async function fetchPexelsImages(query: string): Promise<string[]> {
    const pexelsKey = getApiKey("VITE_PEXELS_API_KEY");
    if (!pexelsKey) return [];
    try {
        const url = `https://api.pexels.com/v1/search?query=${encodeURIComponent(query + " outfit")}&per_page=3&orientation=portrait`;
        const res = await fetch(url, { headers: { Authorization: pexelsKey } });
        if (!res.ok) return [];
        const data = await res.json();
        return data.photos.map((photo: any) => photo.src.large2x || photo.src.medium);
    } catch (e) { return []; }
}

function repairJson(jsonString: string): string {
    let fixed = jsonString.trim();
    fixed = fixed.replace(/``````/g, "");
    const firstBrace = fixed.indexOf('{');
    const lastBrace = fixed.lastIndexOf('}');
    if (firstBrace !== -1 && lastBrace !== -1) fixed = fixed.substring(firstBrace, lastBrace + 1);
    return fixed;
}

async function fetchRealWeather(location: string): Promise<string> {
    try {
        // 簡單直接抓取，不加太多判斷
        const res = await fetch(`https://wttr.in/${encodeURIComponent(location)}?format=j1`);
        if (!res.ok) return "";
        const data = await res.json();
        const current = data.current_condition?.[0];
        if (!current) return "";

        const humidity = current.humidity || "70";
        return `地點:${location}, 氣溫:${current.temp_C}°C, 濕度:${humidity}%, 天氣:${current.weatherDesc?.[0]?.value}`;
    } catch (e) { return ""; }
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
  if (!googleKey) throw new Error("API Key Missing");

  const genderStr = gender === Gender.Male ? '男士' : '女士';
  const styleStr = style === Style.Casual ? '休閒' : '正式';
  
  const realWeather = await fetchRealWeather(location);

  const prompt = `
  角色：穿搭顧問。
  使用者：${genderStr}, 風格：${styleStr}。
  任務：針對「${colorSeason}」提供穿搭。
  ${realWeather}

  【要求】
  1. 濕度高時推薦透氣材質。
  2. Icon 請準確選擇：t-shirt, shirt, pants, skirt, dress, coat, jacket, sneakers, boots, bag。

  【回傳 JSON】
  {
    "location": "${location}",
    "weather": {
       "temperature": "...", "feelsLike": "...", "humidity": "...", "rainProb": "...", "description": "...", "advice": "..."
    },
    "outfit": {
      "items": [
         { "item": "單品", "color": "顏色", "reason": "...", "detail": "...", "icon": "t-shirt" }
      ],
      "tips": "...",
      "colorPalette": ["色1", "色2"],
      "colorDescription": "...",
      "visualPrompts": ["Color Item"]
    },
    "generatedImages": []
  }
  `;

  // 標準 v1beta 接口
  const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL_NAME}:generateContent?key=${googleKey}`;
  
  try {
    const response = await fetch(apiUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: { response_mime_type: "application/json" }
      })
    });

    if (!response.ok) throw new Error(`API Fail: ${response.status}`); // 如果這裡還是 404，那真的是見鬼了

    const data = await response.json();
    const rawText = data.candidates?.[0]?.content?.parts?.[0]?.text || "";
    const parsedData = JSON.parse(repairJson(rawText));
    
    if (parsedData.outfit?.visualPrompts?.length > 0) {
        const images = await fetchPexelsImages(parsedData.outfit.visualPrompts[0]);
        parsedData.generatedImages = images.slice(0, 3);
    }
    
    return parsedData;

  } catch (e) { throw e; }
};
