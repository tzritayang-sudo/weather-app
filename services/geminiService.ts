import { WeatherOutfitResponse, Gender, Style, ColorSeason, TimeOfDay, TargetDay } from '../types';
import { GoogleGenerativeAI } from '@google/generative-ai';

const MODEL_NAME = "gemini-2.5-flash";
const getApiKey = (keyName: string) => { const envKey = import.meta.env[keyName]; return envKey ? envKey.trim() : null; }

const fetchPexelsImages = async (query: string) => {
  const PEXELS_API_KEY = getApiKey('VITE_PEXELS_API_KEY');
  if (!PEXELS_API_KEY) return [];
  try {
    const response = await fetch(`https://api.pexels.com/v1/search?query=${encodeURIComponent(query + ' fashion')}&per_page=3&orientation=portrait`, { headers: { Authorization: PEXELS_API_KEY } });
    if (!response.ok) return [];
    const data = await response.json();
    return data.photos.map((p: any) => ({ id: p.id, url: p.url, src: { medium: p.src.medium, large: p.src.large }, alt: p.alt }));
  } catch { return []; }
};

const fetchRealWeather = async (location: string) => {
  try {
    const searchLocation = location.includes('Taiwan') ? location : `${location}, Taiwan`;
    const response = await fetch(`https://wttr.in/${encodeURIComponent(searchLocation)}?format=j1`);
    if (!response.ok) throw new Error();
    const data = await response.json();
    return { temp_C: parseInt(data.current_condition[0].temp_C), FeelsLikeC: parseInt(data.current_condition[0].FeelsLikeC), humidity: parseInt(data.current_condition[0].humidity), maxtempC: parseInt(data.weather[0].maxtempC), mintempC: parseInt(data.weather[0].mintempC), chanceofrain: parseInt(data.weather[0].hourly[0].chanceofrain), condition: data.current_condition[0].weatherDesc[0].value };
  } catch { return null; }
};

const repairJson = (jsonString: string) => {
  let clean = jsonString.replace(/``````/g, '').trim();
  const first = clean.indexOf('{'), last = clean.lastIndexOf('}');
  return (first !== -1 && last !== -1) ? clean.substring(first, last + 1) : clean;
};

export const getGeminiSuggestion = async (location: string, displayLocation: string, gender: Gender, style: Style, colorSeason: ColorSeason, timeOfDay: TimeOfDay, targetDay: TargetDay): Promise<WeatherOutfitResponse> => {
  const GOOGLE_API_KEY = getApiKey('VITE_GOOGLE_API_KEY');
  if (!GOOGLE_API_KEY) throw new Error("Missing API Key");

  const realWeather = await fetchRealWeather(location);
  const weatherInfo = realWeather ? `現在${realWeather.temp_C}°C, 高${realWeather.maxtempC}°C 低${realWeather.mintempC}°C, 濕度${realWeather.humidity}%, 降雨${realWeather.chanceofrain}%` : '';
  const prompt = `你是時尚造型師。使用者：${gender}, ${style}風格, ${colorSeason}。時間：${targetDay} ${timeOfDay}。${weatherInfo}
回傳JSON: {"weather":{"location":"${location}","temperature":25,"feels_like":28,"maxtempC":30,"mintempC":24,"humidity":"75%","precipitation":"10%"},"outfit":{"summary":"總結","reason":"建議","tips":"提醒","color_palette":["寶石藍","純白","深黑","鮮紅"],"items":[{"name":"寶石藍T恤","color":"寶石藍","material":"棉質","type":"top"},{"name":"黑色寬褲","color":"黑色","material":"西裝布","type":"pants"},{"name":"白色球鞋","color":"白色","material":"皮革","type":"shoes"},{"name":"銀色腰包","color":"銀色","material":"金屬","type":"bag"}],"visualPrompts":["fashion"]}}
⚠️ items需4件以上，必須有type(top/pants/shoes/bag/jacket)`;

  try {
    const genAI = new GoogleGenerativeAI(GOOGLE_API_KEY);
    const result = await genAI.getGenerativeModel({ model: MODEL_NAME }).generateContent(prompt);
    const parsedData = JSON.parse(repairJson(result.response.text()));
    if (realWeather) parsedData.weather = { location: displayLocation, temperature: realWeather.temp_C, feels_like: realWeather.FeelsLikeC, humidity: `${realWeather.humidity}%`, precipitation: `${realWeather.chanceofrain}%`, maxtempC: realWeather.maxtempC, mintempC: realWeather.mintempC };
    if (parsedData.outfit?.visualPrompts?.length > 0) { const images = await fetchPexelsImages(parsedData.outfit.visualPrompts[0]); parsedData.generatedImages = images.slice(0, 3); }
    return parsedData;
  } catch (e) { throw e; }
};