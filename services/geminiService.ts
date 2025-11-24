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
    const safeQuery = `${query} fashion street style -warm -beige -orange`;
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
    const today = data.weather[0];
    
    return {
      temp_C: parseInt(data.current_condition[0].temp_C),
      FeelsLikeC: parseInt(data.current_condition[0].FeelsLikeC),
      humidity: parseInt(data.current_condition[0].humidity),
      maxtempC: parseInt(today.maxtempC),
      mintempC: parseInt(today.mintempC),
      chanceofrain: parseInt(today.hourly[0].chanceofrain),
      condition: data.current_condition[0].weatherDesc[0].value
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
  let weatherInfo = realWeather ? `真實天氣: 現在 ${realWeather.temp_C}°C (高 ${realWeather.maxtempC}°C, 低 ${realWeather.mintempC}°C), 濕度 ${realWeather.humidity}%, 降雨率 ${realWeather.chanceofrain}%, 狀況 ${realWeather.condition}` : `模擬天氣`;

  const prompt = `
    你是一位專業時尚造型師。使用者：${gender}, 風格 ${style}, 個人色彩: ${colorSeason} (亮冬特點：高對比、鮮豔冷色，避免大地色)。
    時間：${targetDay} ${timeOfDay}。
    ${weatherInfo}

    請根據氣溫、濕度與降雨機率提供穿搭建議。
    回傳 JSON 格式：
    {
      "weather": { "location": "${location}", "temperature": 25, "feels_like": 28, "maxtempC": 30, "mintempC": 24, "humidity": "75%", "precipitation": "10%" },
      "outfit": {
        "summary": "繁體中文總結", 
        "reason": "根據氣溫與濕度的中文建議", 
        "tips": "中文提醒 (例如: 降雨機率高，記得帶傘)",
        "color_palette": ["寶石藍", "純白", "深黑", "鮮紅"],
        "items": [
          {"name": "寶石藍T恤", "color": "寶石藍", "material": "棉質", "reason": "顯白", "type": "top"},
          {"name": "黑色寬褲", "color": "黑色", "material": "西裝布", "reason": "修身", "type": "pants"},
          {"name": "白色球鞋", "color": "白色", "material": "皮革", "reason": "百搭", "type": "shoes"},
          {"name": "銀色腰包", "color": "銀色", "material": "金屬", "reason": "點綴", "type": "bag"}
        ],
        "visualPrompts": ["Royal blue and black fashion outfit high contrast street style"] 
      }
    }
    ⚠️ 嚴格要求：
    1. items 至少 4 件 (上衣、褲/裙、鞋、配件)。
    2. 每個 item 必須有 type 欄位，值為 'top', 'pants', 'skirt', 'dress', 'jacket', 'shoes', 'bag', 'accessory', 'umbrella' 其中之一。
    3. name 用繁體中文，並明確寫出單品類別 (例如「黑色寬褲」而非「黑色單品」)。
  `;

  try {
    const genAI = new GoogleGenerativeAI(GOOGLE_API_KEY);
    const model = genAI.getGenerativeModel({ model: MODEL_NAME });
    const result = await model.generateContent(prompt);
    const parsedData = JSON.parse(repairJson(result.response.text()));

    if (realWeather) {
        parsedData.weather = { 
          ...parsedData.weather,
          temperature: realWeather.temp_C, 
          feels_like: realWeather.FeelsLikeC,
          humidity: `${realWeather.humidity}%`,
          precipitation: `${realWeather.chanceofrain}%`,
          maxtempC: realWeather.maxtempC,
          mintempC: realWeather.mintempC,
        };
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