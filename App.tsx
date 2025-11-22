import React, { useState, useCallback } from 'react';
import { getGeminiSuggestion } from './services/geminiService';
import ResultDisplay from './components/ResultDisplay';
import { WeatherOutfitResponse, Gender, Style, ColorSeason, TimeOfDay, TargetDay } from './types';
import { RefreshIcon, UserIcon, BriefcaseIcon, CoffeeIcon, ActivityIcon, SearchIcon, ClockIcon, LocationIcon } from './components/Icons';

interface SelectorButtonProps {
  active: boolean;
  onClick: () => void;
  icon?: React.ElementType;
  label: string;
}

const SelectorButton: React.FC<SelectorButtonProps> = ({ 
  active, 
  onClick, 
  icon: Icon, 
  label 
}) => (
  <button
    onClick={onClick}
    className={`
      flex items-center justify-center gap-2 px-3 py-2 rounded-xl text-sm font-medium transition-all duration-300 flex-1 min-w-[70px]
      ${active 
        ? 'bg-slate-800 text-white shadow-md shadow-slate-200 scale-105' 
        : 'bg-white text-slate-500 hover:bg-slate-50 hover:text-slate-700 border border-slate-100 shadow-sm'
      }
    `}
  >
    {Icon && <Icon className={`w-4 h-4 ${active ? 'text-white' : 'text-slate-400'}`} />}
    {label}
  </button>
);

const PRESET_LOCATIONS = ["泰山", "汐止", "雙北通勤"];

const App: React.FC = () => {
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<WeatherOutfitResponse | null>(null);

  // Personalization State
  const [location, setLocation] = useState<string>("雙北通勤");
  const [gender, setGender] = useState<Gender>(Gender.Female);
  const [style, setStyle] = useState<Style>(Style.Casual);
  const [colorSeason, setColorSeason] = useState<ColorSeason>(ColorSeason.BrightWinter);
  
  // Time Context State
  const [targetDay, setTargetDay] = useState<TargetDay>(TargetDay.Today);
  const [timeOfDay, setTimeOfDay] = useState<TimeOfDay>(TimeOfDay.Morning);

  const fetchData = useCallback(async () => {
    if (!location.trim()) return;
    
    setLoading(true);
    setError(null);
    try {
      const result = await getGeminiSuggestion(location, gender, style, colorSeason, targetDay, timeOfDay);
      setData(result);
    } catch (err) {
      let errorMsg = '發生未知錯誤';
      if (err instanceof Error) {
        errorMsg = err.message;
        // Help user identify missing API key issues
        if (errorMsg.includes("API Key") || errorMsg.includes("403")) {
           errorMsg = "API Key 設定錯誤或遺失。請檢查 Vercel 環境變數 (API_KEY)。";
        }
      }
      setError(errorMsg);
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [location, gender, style, colorSeason, targetDay, timeOfDay]);

  const handleLocationSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchData();
  };

  return (
    <div className="min-h-screen bg-[#FAFAFA] text-slate-800 font-sans pb-20">
      {/* Navbar-like Header */}
      <header className="bg-white/80 backdrop-blur-md border-b border-slate-100 sticky top-0 z-50">
        <div className="max-w-4xl mx-auto px-4 md:px-6 py-3 flex items-center justify-between">
          <h1 className="text-xl font-extrabold tracking-tight flex items-center gap-2 text-slate-900">
            <span className="w-7 h-7 bg-indigo-600 rounded-lg flex items-center justify-center text-white text-xs font-bold shadow-md">AI</span>
            穿搭氣象台
          </h1>
          <div className="flex items-center gap-4">
             <div className="text-xs font-medium text-slate-400 hidden md:flex items-center gap-2">
               <span className={`w-1.5 h-1.5 rounded-full ${loading ? 'bg-amber-400 animate-pulse' : 'bg-emerald-400'}`}></span>
               {loading ? '分析中...' : '就緒'}
             </div>
          </div>
        </div>
      </header>

      <div className="p-4 md:p-6 max-w-4xl mx-auto">
        
        {/* Control Panel */}
        <div className="mb-8 bg-white rounded-[2rem] shadow-xl shadow-slate-200/50 border border-slate-100 overflow-hidden relative">
          <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-indigo-50 to-purple-50 rounded-full blur-3xl -z-10 translate-x-1/3 -translate-y-1/3 opacity-60"></div>

          <div className="p-5 md:p-8 flex flex-col gap-6">
            
            {/* 1. Location & Date/Time */}
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-12 gap-5">
                {/* Location */}
                <div className="md:col-span-5 space-y-2">
                   <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest ml-1">目的地</label>
                   <form onSubmit={handleLocationSubmit} className="relative group">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <LocationIcon className="h-5 w-5 text-slate-400 group-focus-within:text-indigo-500 transition-colors" />
                    </div>
                    <input
                      type="text"
                      value={location}
                      onChange={(e) => setLocation(e.target.value)}
                      placeholder="輸入地點..."
                      className="block w-full pl-10 pr-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-base font-medium text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all shadow-inner"
                    />
                  </form>
                   <div className="flex flex-wrap gap-2 mt-2">
                    {PRESET_LOCATIONS.map((loc) => (
                      <button
                        key={loc}
                        onClick={() => setLocation(loc)}
                        className={`text-xs px-3 py-1.5 rounded-lg transition-colors border ${location === loc ? 'bg-indigo-50 border-indigo-100 text-indigo-600 font-bold' : 'bg-white border-slate-100 text-slate-500 hover:bg-slate-50'}`}
                      >
                        {loc}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Date Selector */}
                <div className="md:col-span-3 space-y-2">
                   <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest ml-1">哪一天？</label>
                   <div className="flex flex-col gap-2">
                      {Object.values(TargetDay).map((day) => (
                        <button
                          key={day}
                          onClick={() => setTargetDay(day)}
                          className={`px-3 py-2.5 rounded-xl text-sm font-medium transition-all border text-left
                            ${targetDay === day 
                              ? 'bg-slate-800 text-white border-slate-800 shadow-md' 
                              : 'bg-white text-slate-500 border-slate-100 hover:bg-slate-50'}
                          `}
                        >
                          {day.split('(')[1].replace(')','')} <span className="text-[10px] opacity-70 ml-1">{day.split(' ')[0]}</span>
                        </button>
                      ))}
                   </div>
                </div>

                {/* Time Selector */}
                <div className="md:col-span-4 space-y-2">
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest ml-1">哪個時段？</label>
                  <div className="bg-slate-50 p-1.5 rounded-2xl border border-slate-100 h-[140px] overflow-y-auto custom-scrollbar">
                     <div className="grid grid-cols-1 gap-1">
                        {Object.values(TimeOfDay).map((t) => (
                          <button
                            key={t}
                            onClick={() => setTimeOfDay(t)}
                            className={`text-xs py-2.5 rounded-lg transition-all text-left px-3 flex items-center justify-between ${timeOfDay === t ? 'bg-white text-indigo-600 font-bold shadow-sm border border-slate-100' : 'text-slate-500 hover:bg-slate-100'}`}
                          >
                            <span>{t.split('(')[1].replace(')','')}</span>
                            {timeOfDay === t && <ClockIcon className="w-3.5 h-3.5" />}
                          </button>
                        ))}
                     </div>
                  </div>
                </div>
              </div>
            </div>

            <hr className="border-slate-100" />

            {/* 2. Personalization Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
               <div className="space-y-4">
                   <div className="space-y-2">
                      <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest ml-1">您的性別</label>
                      <div className="flex gap-3">
                        <SelectorButton active={gender === Gender.Male} onClick={() => setGender(Gender.Male)} icon={UserIcon} label="男士" />
                        <SelectorButton active={gender === Gender.Female} onClick={() => setGender(Gender.Female)} icon={UserIcon} label="女士" />
                      </div>
                   </div>

                   <div className="space-y-2">
                      <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest ml-1">穿搭場合</label>
                      <div className="flex flex-wrap gap-2">
                        <SelectorButton active={style === Style.Casual} onClick={() => setStyle(Style.Casual)} icon={CoffeeIcon} label="休閒" />
                        <SelectorButton active={style === Style.Formal} onClick={() => setStyle(Style.Formal)} icon={BriefcaseIcon} label="正式" />
                        <SelectorButton active={style === Style.Sport} onClick={() => setStyle(Style.Sport)} icon={ActivityIcon} label="運動" />
                      </div>
                   </div>
               </div>

               {/* Color Season */}
               <div className="space-y-2">
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest ml-1 flex items-center gap-2">
                    <span>色彩季型</span>
                  </label>
                  <div className="bg-slate-50 p-1.5 rounded-xl border border-slate-100">
                    <select 
                      value={colorSeason}
                      onChange={(e) => setColorSeason(e.target.value as ColorSeason)}
                      className="w-full bg-white border border-slate-200 text-slate-700 text-sm rounded-lg focus:ring-indigo-500 focus:border-indigo-500 block p-2.5 shadow-sm"
                    >
                      <optgroup label="Winter (冬 - 冷冽/對比)">
                        <option value={ColorSeason.BrightWinter}>{ColorSeason.BrightWinter}</option>
                        <option value={ColorSeason.TrueWinter}>{ColorSeason.TrueWinter}</option>
                        <option value={ColorSeason.DarkWinter}>{ColorSeason.DarkWinter}</option>
                      </optgroup>
                      <optgroup label="Spring (春 - 活潑/明亮)">
                        <option value={ColorSeason.BrightSpring}>{ColorSeason.BrightSpring}</option>
                        <option value={ColorSeason.TrueSpring}>{ColorSeason.TrueSpring}</option>
                        <option value={ColorSeason.LightSpring}>{ColorSeason.LightSpring}</option>
                      </optgroup>
                      <optgroup label="Summer (夏 - 柔和/粉嫩)">
                        <option value={ColorSeason.LightSummer}>{ColorSeason.LightSummer}</option>
                        <option value={ColorSeason.TrueSummer}>{ColorSeason.TrueSummer}</option>
                        <option value={ColorSeason.SoftSummer}>{ColorSeason.SoftSummer}</option>
                      </optgroup>
                      <optgroup label="Autumn (秋 - 濃郁/溫暖)">
                        <option value={ColorSeason.SoftAutumn}>{ColorSeason.SoftAutumn}</option>
                        <option value={ColorSeason.TrueAutumn}>{ColorSeason.TrueAutumn}</option>
                        <option value={ColorSeason.DarkAutumn}>{ColorSeason.DarkAutumn}</option>
                      </optgroup>
                    </select>
                  </div>
               </div>
            </div>

            <button
              onClick={fetchData}
              disabled={loading}
              className="w-full mt-2 py-3.5 bg-slate-900 hover:bg-black text-white rounded-xl font-bold text-base shadow-xl shadow-slate-900/20 transition-all transform active:scale-[0.99] disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-3"
            >
              <RefreshIcon className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
              {loading ? '正在分析與生成...' : '生成專屬穿搭'}
            </button>

          </div>
        </div>

        <main className="animate-fade-in min-h-[200px]">
          {error && (
            <div className="p-6 bg-red-50 border border-red-100 text-red-600 rounded-2xl text-center shadow-sm">
              <p className="font-bold mb-1">請注意</p>
              <p className="text-sm opacity-80">{error}</p>
            </div>
          )}

          {!loading && !error && data && (
            <ResultDisplay data={data} />
          )}
          
          {loading && !data && (
             <div className="w-full space-y-6 animate-pulse">
                <div className="h-40 bg-slate-200/50 rounded-3xl"></div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                   <div className="h-64 bg-slate-200/50 rounded-2xl"></div>
                   <div className="h-64 bg-slate-200/50 rounded-2xl"></div>
                   <div className="h-64 bg-slate-200/50 rounded-2xl"></div>
                </div>
                <div className="h-56 bg-slate-200/50 rounded-2xl"></div>
             </div>
          )}
        </main>
      </div>
    </div>
  );
};

export default App;