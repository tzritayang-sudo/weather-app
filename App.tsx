import React, { useState, useCallback, useEffect } from 'react';
import { getGeminiSuggestion } from './services/geminiService';
import ResultDisplay from './components/ResultDisplay';
import { WeatherOutfitResponse, Gender, Style, ColorSeason, TimeOfDay, TargetDay } from './types';
import { MapPin, Shirt, Palette, Clock, Loader2, User, Sparkles, Sun, Moon, Trash2 } from 'lucide-react';

type SavedLocation = { label: string; query: string };

function App() {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<WeatherOutfitResponse | null>(null);
  const [displayLocation, setDisplayLocation] = useState('泰山'); 
  const [apiLocation, setApiLocation] = useState('Taishan, Taiwan');
  const [gender, setGender] = useState<Gender>('Female');
  const [style, setStyle] = useState<Style>('Casual');
  const [colorSeason, setColorSeason] = useState<ColorSeason>('Bright Winter (淨冬/亮冬)');
  const [targetDay, setTargetDay] = useState<TargetDay>('today');
  const [timeOfDay, setTimeOfDay] = useState<TimeOfDay>('current');
  const [savedLocations, setSavedLocations] = useState<SavedLocation[]>([]);
  const [isDarkMode, setIsDarkMode] = useState(true);

  useEffect(() => {
    const raw = localStorage.getItem('ai-outfit-v3');
    if (raw) {
      try {
        const s = JSON.parse(raw);
        if (s.displayLocation) { setDisplayLocation(s.displayLocation); setApiLocation(s.apiLocation || s.displayLocation); }
        if (s.gender) setGender(s.gender);
        if (s.style) setStyle(s.style);
        if (s.colorSeason) setColorSeason(s.colorSeason);
        if (Array.isArray(s.savedLocations)) setSavedLocations(s.savedLocations);
        if (typeof s.isDarkMode === 'boolean') setIsDarkMode(s.isDarkMode);
      } catch {}
    }
  }, []);

  useEffect(() => {
    localStorage.setItem('ai-outfit-v3', JSON.stringify({ displayLocation, apiLocation, gender, style, colorSeason, savedLocations, isDarkMode }));
  }, [displayLocation, apiLocation, gender, style, colorSeason, savedLocations, isDarkMode]);

  const handleInputChange = (val: string) => {
    setDisplayLocation(val);
    setApiLocation(val.includes('泰山') || val.toLowerCase().includes('taishan') ? 'Taishan, Taiwan' : val);
  };

  const handleQuickLocation = (name: string, query: string) => {
    setDisplayLocation(name);
    setApiLocation(query);
  };

  const addCustomLocation = () => {
    if (!displayLocation.trim() || savedLocations.some(l => l.label === displayLocation.trim())) return;
    setSavedLocations(prev => [...prev, { label: displayLocation.trim(), query: apiLocation }].slice(-5));
  };

  const removeLocation = (label: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setSavedLocations(prev => prev.filter(l => l.label !== label));
  };

  const calculateCurrentTimeOfDay = (): TimeOfDay => {
    const hour = new Date().getHours();
    return hour >= 5 && hour < 12 ? 'morning' : hour >= 12 && hour < 18 ? 'afternoon' : 'evening';
  };

  const handleGenerate = useCallback(async () => {
    setLoading(true); setResult(null);
    try {
      const actualTimeOfDay = timeOfDay === 'current' ? calculateCurrentTimeOfDay() : timeOfDay;
      const actualTargetDay = timeOfDay === 'current' ? 'today' : targetDay;
      const data = await getGeminiSuggestion(apiLocation, displayLocation, gender, style, colorSeason, actualTimeOfDay, actualTargetDay);
      setResult(data);
    } catch { alert('AI 暫時忙碌中，請稍後再試！'); }
    finally { setLoading(false); }
  }, [apiLocation, displayLocation, gender, style, colorSeason, timeOfDay, targetDay]);

  const handleRetry = () => setResult(null);

  const seasons: ColorSeason[] = ['Bright Winter (淨冬/亮冬)', 'True Winter (正冬)', 'Dark Winter (深冬)', 'Light Spring (淨春)', 'True Spring (正春)', 'Bright Spring (亮春)', 'Light Summer (淨夏)', 'True Summer (正夏)', 'Muted Summer (柔夏)', 'Soft Autumn (柔秋)', 'True Autumn (正秋)', 'Dark Autumn (深秋)'];

  const bg = isDarkMode ? 'bg-slate-900' : 'bg-slate-50';
  const text = isDarkMode ? 'text-slate-100' : 'text-slate-900';
  const textSub = isDarkMode ? 'text-slate-400' : 'text-slate-600';
  const card = isDarkMode ? 'bg-slate-800/50 border-slate-700' : 'bg-white border-slate-200 shadow-sm';
  const input = isDarkMode ? 'bg-slate-800/50 border-slate-700 text-white' : 'bg-white border-slate-300 text-slate-900';

  return (
    <div className={`min-h-screen font-sans pb-10 transition-colors ${bg} ${text}`}>
      <div className="max-w-md mx-auto min-h-screen flex flex-col">
        
        <header className="pt-8 pb-4 px-6 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className={`p-3 rounded-2xl ${isDarkMode ? 'bg-blue-500/10 ring-1 ring-blue-500/20' : 'bg-blue-100'}`}>
              <Shirt className={`w-8 h-8 ${isDarkMode ? 'text-blue-400' : 'text-blue-600'}`} />
            </div>
            <h1 className={`text-3xl font-bold ${text}`}>AI 穿搭</h1>
          </div>
          <button onClick={() => setIsDarkMode(!isDarkMode)} className={`p-3 rounded-full transition ${isDarkMode ? 'bg-slate-800 text-yellow-400' : 'bg-white text-slate-600 shadow border border-slate-200'}`}>
            {isDarkMode ? <Sun size={20} /> : <Moon size={20} />}
          </button>
        </header>

        <main className="flex-1 px-6 py-4 space-y-8">
          {result || loading ? (
            <ResultDisplay data={result!} loading={loading} onRetry={handleRetry} displayLocation={displayLocation} isDarkMode={isDarkMode} />
          ) : (
            <div className="space-y-8">
              
              <div className="space-y-3">
                <label className={`flex items-center text-sm font-bold uppercase tracking-wider ml-1 ${textSub}`}>
                  <MapPin size={16} className="mr-2 text-blue-500" /> 地點
                </label>
                <div className="relative">
                  <input type="text" value={displayLocation} onChange={(e) => handleInputChange(e.target.value)} className={`w-full text-lg rounded-2xl px-5 py-4 focus:ring-2 focus:ring-blue-500 outline-none border ${input}`} placeholder="輸入城市..." />
                  <div className="absolute right-2 top-1/2 -translate-y-1/2 flex gap-1 overflow-x-auto max-w-[65%]">
                     {['泰山', '汐止', '雙北'].map(n => <button key={n} onClick={() => handleQuickLocation(n, n === '雙北' ? 'Taipei' : n)} className={`text-xs px-3 py-1.5 rounded-xl border whitespace-nowrap ${isDarkMode ? 'bg-slate-700/50 border-slate-600 text-slate-300' : 'bg-slate-100 border-slate-200 text-slate-600'}`}>{n}</button>)}
                     {savedLocations.map((loc, i) => <div key={i} className="relative flex items-center"><button onClick={() => handleQuickLocation(loc.label, loc.query)} className={`text-xs pl-3 pr-6 py-1.5 rounded-xl border ${isDarkMode ? 'bg-blue-900/30 border-blue-700/30 text-blue-200' : 'bg-blue-50 border-blue-200 text-blue-700'}`}>{loc.label}</button><button onClick={(e) => removeLocation(loc.label, e)} className="absolute right-1 text-red-400 hover:text-red-500"><Trash2 size={10} /></button></div>)}
                     <button onClick={addCustomLocation} className={`w-7 h-7 flex items-center justify-center rounded-full border ${isDarkMode ? 'bg-slate-800 border-slate-600 text-slate-400' : 'bg-white border-slate-300 text-slate-500'}`}>+</button>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-5">
                <div className="space-y-3">
                  <label className={`flex items-center text-sm font-bold uppercase ml-1 ${textSub}`}><User size={16} className="mr-2 text-indigo-500" /> 性別</label>
                  <div className={`flex gap-1 p-1 rounded-2xl border ${card}`}>
                    {(['Female', 'Male'] as Gender[]).map(g => <button key={g} onClick={() => setGender(g)} className={`flex-1 py-3 rounded-xl text-base font-semibold transition ${gender === g ? 'bg-indigo-500 text-white shadow' : 'text-slate-400'}`}>{g === 'Female' ? '女生' : '男生'}</button>)}
                  </div>
                </div>
                <div className="space-y-3">
                  <label className={`flex items-center text-sm font-bold uppercase ml-1 ${textSub}`}><Sparkles size={16} className="mr-2 text-amber-500" /> 風格</label>
                  <div className="flex flex-col gap-2">
                    {(['Casual', 'Formal', 'Sport'] as Style[]).map(s => <button key={s} onClick={() => setStyle(s)} className={`py-2.5 rounded-xl text-sm font-medium border transition ${style === s ? (isDarkMode ? 'bg-amber-500/20 border-amber-500/50 text-amber-300' : 'bg-amber-50 border-amber-300 text-amber-700') : (isDarkMode ? 'bg-slate-800/50 border-slate-700 text-slate-400' : 'bg-white border-slate-200 text-slate-600')}`}>{s === 'Casual' ? '休閒' : s === 'Formal' ? '正式' : '運動'}</button>)}
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                <label className={`flex items-center text-sm font-bold uppercase ml-1 ${textSub}`}><Palette size={16} className="mr-2 text-pink-500" /> 個人色彩</label>
                <select value={colorSeason} onChange={(e) => setColorSeason(e.target.value as ColorSeason)} className={`w-full text-base rounded-2xl px-5 py-4 border focus:ring-2 focus:ring-pink-500 outline-none ${input}`}>
                  {seasons.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>

              <div className="space-y-3">
                <label className={`flex items-center text-sm font-bold uppercase ml-1 ${textSub}`}><Clock size={16} className="mr-2 text-green-500" /> 時間</label>
                <div className="grid grid-cols-4 gap-2">
                   <button onClick={() => { setTimeOfDay('current'); setTargetDay('today'); }} className={`py-3 rounded-2xl text-sm border transition ${timeOfDay === 'current' ? (isDarkMode ? 'bg-green-500/20 border-green-500/50 text-green-300' : 'bg-green-50 border-green-300 text-green-700') : (isDarkMode ? 'bg-slate-800/50 border-slate-700 text-slate-400' : 'bg-white border-slate-200 text-slate-600')}`}>🚀 現在</button>
                   {(['morning', 'afternoon', 'evening'] as TimeOfDay[]).map(t => <button key={t} onClick={() => setTimeOfDay(t)} className={`py-3 rounded-2xl text-sm border transition ${timeOfDay === t ? (isDarkMode ? 'bg-blue-500/20 border-blue-500/50 text-blue-300' : 'bg-blue-50 border-blue-300 text-blue-700') : (isDarkMode ? 'bg-slate-800/50 border-slate-700 text-slate-400' : 'bg-white border-slate-200 text-slate-600')}`}>{t === 'morning' ? '早上' : t === 'afternoon' ? '下午' : '晚上'}</button>)}
                </div>
                {timeOfDay !== 'current' && <div className="flex justify-center gap-3 pt-2">{(['today', 'tomorrow'] as TargetDay[]).map(d => <button key={d} onClick={() => setTargetDay(d)} className={`text-sm px-5 py-1.5 rounded-full ${targetDay === d ? (isDarkMode ? 'bg-slate-700 text-white' : 'bg-slate-200 text-slate-800') : 'text-slate-400'}`}>{d === 'today' ? '今天' : '明天'}</button>)}</div>}
              </div>

              <button onClick={handleGenerate} disabled={loading} className="w-full py-5 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-2xl font-bold text-white text-xl shadow-xl hover:scale-[1.01] transition disabled:opacity-50">{loading ? <Loader2 className="animate-spin mx-auto" /> : '✨ 取得穿搭建議'}</button>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
export default App;