import { WeatherOutfitResponse, Gender, Style, ColorSeason, TimeOfDay, TargetDay } from '../types';

// 🔥 模型名稱
const MODEL_NAME = "gemini-2.5-flash"; 

// 🎯 從環境變數讀取 API Key
const getApiKey = () => {
  const envKey = import.meta.env.VITE_GOOGLE_API_KEY;
  if (!envKey) return "MISSING"; 
  return envKey.trim();
}

// 🔧 JSON 修復小幫手：專門處理 AI 缺括號、多逗號的問題
function repairJson(jsonString: string): string {
    let fixed = jsonString.trim();
    // 移除 Markdown
    fixed = fixed.replace(/``````/g, "");
    // 移除可能的前綴廢話
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

  const activeKey = getApiKey();
  if (activeKey === "MISSING") {
      throw new Error("系統錯誤：找不到 API Key，請檢查 .env 檔案。");
  }

  const genderStr = gender === Gender.Male ? '男士' : gender === Gender.Female ? '女士' : '中性';
  const styleStr = style === Style.Casual ? '休閒' : style === Style.Formal ? '正式' : '運動';
  const dayLabel = targetDay === TargetDay.Today ? '今天' : targetDay === TargetDay.Tomorrow ? '明天' : '後天';

  // 📝 簡化後的 Prompt，減少 AI 困惑
  const prompt = `
  分析 ${location} 在 ${dayLabel}${timeOfDay} 的天氣。
  使用者：${genderStr}, 風格：${styleStr}, 色系：${colorSeason}。
  
  請回傳一個 JSON 物件，包含以下欄位：
  {
    "weather": { "temperature": "數值", "condition": "天氣狀況", "rainChance": "降雨機率", "humidity": "濕度", "wind": "風速", "uvIndex": "紫外線", "advice": "天氣建議" },
    "suggestion": { "title": "穿搭標題", "description": "穿搭說明", "colorPalette": ["顏色1", "顏色2"] },
    "items": [{ "category": "類別", "name": "單品名稱", "reason": "推薦理由" }],
    "visualPrompts": ["英文提示詞1", "英文提示詞2", "英文提示詞3"]
  }
  `;

  const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL_NAME}:generateContent?key=${activeKey}`;

  console.log("🚀 發送請求中...");

  try {
    const response = await fetch(apiUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        // 🔥 關鍵修正：開啟 JSON Mode (application/json)
        // 這會強制 AI 輸出完美的 JSON，不會有廢話
        generationConfig: {
            response_mime_type: "application/json"
        }
      })
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error("API Error:", errorData);
      throw new Error(`Google API 拒絕連線 (${response.status})`);
    }

    const data = await response.json();
    
    // 檢查是否被安全過濾
    if (data.promptFeedback?.blockReason) {
        throw new Error(`內容被 Google 攔截: ${data.promptFeedback.blockReason}`);
    }

    if (!data.candidates || data.candidates.length === 0) {
        throw new Error("AI 沒有回傳任何內容，請重試。");
    }

    const rawText = data.candidates[0].content?.parts?.[0]?.text || "";
    console.log("AI 回傳:", rawText); // F12 可以看到完整內容

    // 嘗試解析
    try {
        const cleanJson = repairJson(rawText);
        return JSON.parse(cleanJson) as WeatherOutfitResponse;
    } catch (parseError) {
        console.error("JSON 解析失敗:", parseError);
        throw new Error("AI 產生的格式有誤，請再試一次 (Parsing Error)");
    }

  } catch (e: any) {
    console.error("最終錯誤:", e);
    throw e; // 拋出錯誤讓 App.tsx 處理 (顯示紅框框)
  }
};
