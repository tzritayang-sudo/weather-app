export interface DailyForecast {
  day: string;
  condition: string;
  high: string;
  low: string;
  rainProb: string;
}

export interface WeatherInfo {
  location: string;
  temperature: string;
  feelsLike: string;
  humidity: string;
  rainProb: string;
  description: string;
  forecast: DailyForecast[];
}

export interface OutfitItem {
  item: string;
  color: string;
  reason: string;
  detail?: string;
  icon: string;
}

export interface OutfitRecommendation {
  items: OutfitItem[];
  tips: string;
  colorPalette: string[];
  colorDescription: string;
  visualPrompts: string[]; // New field for distinct image descriptions
}

export interface WeatherOutfitResponse {
  location: string;
  weather: WeatherInfo;
  outfit: OutfitRecommendation;
  generatedImages?: string[]; 
}

export enum Gender {
  Male = "Male",
  Female = "Female",
  Neutral = "Neutral"
}

export enum Style {
  Casual = "Casual",
  Formal = "Formal",
  Sport = "Sport"
}

export enum TargetDay {
  Today = "Today (今天)",
  Tomorrow = "Tomorrow (明天)",
  DayAfterTomorrow = "DayAfter (後天)"
}

export enum TimeOfDay {
  Morning = "Morning (早晨)",
  Afternoon = "Afternoon (午後)",
  Evening = "Evening (傍晚)",
  Night = "Night (深夜)"
}

// 12 Seasonal Color Analysis
export enum ColorSeason {
  // Spring
  BrightSpring = "Bright Spring (淨春)",
  TrueSpring = "True Spring (暖春)",
  LightSpring = "Light Spring (淺春)",
  // Summer
  LightSummer = "Light Summer (淺夏)",
  TrueSummer = "True Summer (冷夏)",
  SoftSummer = "Soft Summer (柔夏)",
  // Autumn
  SoftAutumn = "Soft Autumn (柔秋)",
  TrueAutumn = "True Autumn (暖秋)",
  DarkAutumn = "Dark Autumn (深秋)",
  // Winter
  DarkWinter = "Dark Winter (深冬)",
  TrueWinter = "True Winter (冷冬)",
  BrightWinter = "Bright Winter (淨冬/亮冬)"
}