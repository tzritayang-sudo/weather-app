import { WeatherOutfitResponse, Gender, Style, ColorSeason, TimeOfDay, TargetDay } from '../types';
import { GoogleGenerativeAI } from '@google/generative-ai';

const MODEL_NAME = "gemini-2.5-flash";

const getApiKey = (keyName: string) => {
  const envKey = import.meta.env[keyName];
  if (!envKey) return null;
  return envKey.trim();
}

const fetchPexelsImages = async (query: string) => {
  const PEXELS_API_KEY = getApiKey('VITE_PEXELS_API_KEY');
  if (!PEXELS_API_KEY) return [];
  try {
    const safeQuery = `${query} outfit street style high quality -warm -beige -orange -sepia`;
    const url = `https://api.pexels.com/v1/search?query=${encodeURIComponent(safeQuery)}&per_page=3&orientation=portrait`;
    const response = await fetch(url, { headers: { Authorization: PEXELS_API_KEY } });
    if (!response.ok) return [];
    const data = await response.json();
    return data.photos.map((photo: any) => ({
      id: photo.id, url: photo.url, src: { medium: photo.src.medium, large: photo.src.large }, alt: photo.alt || query
    }));
  } catch (error) { return []; }
};

const fetchRealWeather = async (location: string) => {
  try {
    const searchLocation = location.includes('Taiwan') ? location : `${location}, Taiwan`;
    const response = await fetch(`https://wttr.in/${encodeURIComponent(searchLocation)}?format=j1`);
    if (!response.ok) throw new Error('Weather API Error');
    const data = await response.json();
    const current = data.current_condition[0];
    return {
      temp: parseInt(current.temp_C), condition: current.weatherDesc[0].value, humidity: parseInt(current.humidity),
      feelsLike: parseInt(current.FeelsLikeC), precip: current.precipMM > 0 ? `${current.precipMM}mm` : '0%'
    };
  } catch (e) { return null; }
};

const repairJson = (jsonString: string) => {
    let clean = jsonString.replace(/``````/g, '').trim();
    const firstBrace = clean.indexOf('{');
    const lastBrace = clean.lastIndexOf('}');
    if (firstBrace !== -1 && lastBrace !== -1) clean = clean.substring(firstBrace, lastBrace + 1);
    return clean;
};

export const getGeminiSuggestion = async (
  location: string, gender: Gender, style: Style, colorSeason: ColorSeason, timeOfDay: TimeOfDay, targetDay: TargetDay
): Promise<WeatherOutfitResponse> => {
  const GOOGLE_API_KEY = getApiKey('VITE_GOOGLE_API_KEY');
  if (!GOOGLE_API_KEY) throw new Error("Missing Google API Key");

  const realWeather = await fetchRealWeather(location);
  // 🔥 把濕度放入 Prompt 讓 AI 分析
  let weatherInfo = realWeather 
    ? `真實天氣: 氣溫 ${realWeather.temp}°C, 體感 ${realWeather.feelsLike}°C, 濕度 ${realWeather.humidity}%, 狀況 ${realWeather.condition}`
    : `模擬天氣`;

  const prompt = `
    你是一位專業時尚造型師。使用者：${gender}, 風格 ${style}, 個人色彩: ${colorSeason} (亮冬特點：高對比、鮮豔冷色，避免大地色)。
    時間：${targetDay} ${timeOfDay}。
    ${weatherInfo}

    請根據氣溫與濕度提供穿搭建議：
    1. 若濕度高 (>70%)，建議穿著透氣材質(棉麻、排汗)。
    2. 若風大或氣溫低，建議多層次穿搭。
    
    請回傳 JSON 格式：
    {
      "weather": { "location": "${location}", "temperature": 25, "condition": "晴天", "humidity": "75%", "precipitation": "0%", "feels_like": 28 },
      "outfit": {
        "summary": "繁體中文總結",
        "reason": "根據氣溫與濕度的繁體中文詳細建議 (例如: 今天濕度較高，建議穿著透氣...)",
        "tips": "繁體中文貼心提醒",
        "color_palette": ["寶石藍", "純白", "深黑", "鮮紅"],
        "items": [
          {"name": "單品名稱", "color": "顏色", "material": "材質(如棉、羊毛)", "reason": "為何選擇此材質(如透氣、保暖)"},
          {"name": "單品名稱", "color": "顏色", "material": "材質", "reason": "原因"},
          {"name": "單品名稱", "color": "顏色", "material": "材質", "reason": "原因"},
          {"name": "單品名稱", "color": "顏色", "material": "材質", "reason": "原因"}
        ],
        "visualPrompts": ["Royal blue and black fashion outfit high contrast street style"] 
      }
    }
    ⚠️ 嚴格要求：items 至少包含 4 個單品。items.name 必須是繁體中文。
  `;

  try {
    const genAI = new GoogleGenerativeAI(GOOGLE_API_KEY);
    const model = genAI.getGenerativeModel({ model: MODEL_NAME });
    const result = await model.generateContent(prompt);
    const parsedData = JSON.parse(repairJson(result.response.text()));

    if (realWeather) {
        parsedData.weather = { ...parsedData.weather, temperature: realWeather.temp, humidity: `${realWeather.humidity}%`, feels_like: realWeather.feelsLike, precipitation: realWeather.precip };
    }

    if (parsedData.outfit?.visualPrompts?.length > 0) {
        const [images1, images2] = await Promise.all([
            fetchPexelsImages(parsedData.outfit.visualPrompts[0]),
            fetchPexelsImages(`winter color type fashion ${gender} royal blue black high contrast`)
        ]);
        parsedData.generatedImages = [...images1, ...images2].slice(0, 3);
    }
    return parsedData;
  } catch (e) { throw e; }
};