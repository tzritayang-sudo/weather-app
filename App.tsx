import React, { useState, useCallback, useEffect } from 'react';
import { getGeminiSuggestion } from './services/geminiService';
import ResultDisplay from './components/ResultDisplay';
import { WeatherOutfitResponse, Gender, Style, ColorSeason, TimeOfDay, TargetDay } from './types';
import { MapPin, Palette, Clock, Loader2, User, Sparkles, Sun, Moon, X } from 'lucide-react';

type SavedLocation = { label: string; query: string };

function App() {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<WeatherOutfitResponse | null>(null);
  const [displayLocation, setDisplayLocation] = useState('汐止');
  const [apiLocation, setApiLocation] = useState('Xizhi, Taiwan');
  const [gender, setGender] = useState<Gender>('Female');
  const [style, setStyle] = useState<Style>('Casual');
  const [colorSeason, setColorSeason] = useState<ColorSeason>('Bright Winter (淨冬/亮冬)');
  const [targetDay, setTargetDay] = useState<TargetDay>('today');
  const [timeOfDay, setTimeOfDay] = useState<TimeOfDay>('current');
  const [savedLocations, setSavedLocations] = useState<SavedLocation[]>([]);
  const [isDarkMode, setIsDarkMode] = useState(true);

  useEffect(() => {
    const raw = localStorage.getItem('ai-outfit-v7');
    if (!raw) return;
    try {
      const s = JSON.parse(raw);
      if (s.displayLocation) { setDisplayLocation(s.displayLocation); setApiLocation(s.apiLocation || s.displayLocation); }
      if (s.gender) setGender(s.gender);
      if (s.style) setStyle(s.style);
      if (s.colorSeason) setColorSeason(s.colorSeason);
      if (Array.isArray(s.savedLocations)) setSavedLocations(s.savedLocations);
      if (typeof s.isDarkMode === 'boolean') setIsDarkMode(s.isDarkMode);
    } catch {}
  }, []);

  useEffect(() => {
    localStorage.setItem('ai-outfit-v7', JSON.stringify({ displayLocation, apiLocation, gender, style, colorSeason, savedLocations, isDarkMode }));
  }, [displayLocation, apiLocation, gender, style, colorSeason, savedLocations, isDarkMode]);

  const handleInputChange = (val: string) => {
    setDisplayLocation(val);
    setApiLocation(val.includes('汐止') ? 'Xizhi, Taiwan' : val.includes('泰山') ? 'Taishan, Taiwan' : val.includes('雙北') ? 'Taipei, Taiwan' : val);
  };

  const handleQuickLocation = (name: string, query: string) => { setDisplayLocation(name); setApiLocation(query); };

  const addCustomLocation = () => {
    const label = displayLocation.trim();
    if (!label || savedLocations.some(l => l.label === label)) return;
    setSavedLocations(prev => [...prev, { label, query: apiLocation }].slice(-5));
  };

  const removeLocation = (label: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setSavedLocations(prev => prev.filter(l => l.label !== label));
  };

  const calcTime = (): TimeOfDay => {
    const h = new Date().getHours();
    return h >= 5 && h < 12 ? 'morning' : h >= 12 && h < 18 ? 'afternoon' : 'evening';
  };

  const handleGenerate = useCallback(async () => {
    setLoading(true); setResult(null);
    try {
      const data = await getGeminiSuggestion(apiLocation, displayLocation, gender, style, colorSeason, timeOfDay === 'current' ? calcTime() : timeOfDay, timeOfDay === 'current' ? 'today' : targetDay);
      setResult(data);
    } catch { alert('AI 忙碌中，請稍後！'); } finally { setLoading(false); }
  }, [apiLocation, displayLocation, gender, style, colorSeason, timeOfDay, targetDay]);

  const seasons: ColorSeason[] = ['Bright Winter (淨冬/亮冬)', 'True Winter (正冬)', 'Dark Winter (深冬)', 'Light Spring (淨春)', 'True Spring (正春)', 'Bright Spring (亮春)', 'Light Summer (淨夏)', 'True Summer (正夏)', 'Muted Summer (柔夏)', 'Soft Autumn (柔秋)', 'True Autumn (正秋)', 'Dark Autumn (深秋)'];

  // 🔥 高級簡約變數 (Premium Minimal)
  const bg = isDarkMode ? 'bg-slate-950' : 'bg-gray-50';
  const text = isDarkMode ? 'text-white' : 'text-gray-900';
  const textSub = isDarkMode ? 'text-slate-400' : 'text-gray-500';
  
  // 玻璃擬態邊框與背景
  const card = isDarkMode 
    ? 'bg-slate-900/50 border border-white/10 backdrop-blur-md' 
    : 'bg-white/80 border border-gray-200/80 backdrop-blur-md shadow-sm';
    
  const input = isDarkMode 
    ? 'bg-slate-900 border-white/10 text-white placeholder-slate-600' 
    : 'bg-white border-gray-200 text-gray-900 placeholder-gray-400';

  const btnBase = `rounded-2xl border transition-all duration-300 flex items-center justify-center backdrop-blur-sm`;
  const btnActive = isDarkMode 
    ? 'bg-white text-slate-950 border-white font-semibold' 
    : 'bg-slate-900 text-white border-slate-900 font-semibold';
  
  const btnInactive = isDarkMode 
    ? 'bg-white/5 text-slate-400 border-white/5 hover:bg-white/10' 
    : 'bg-white text-gray-500 border-gray-200 hover:bg-gray-50';

  return (
    <div className={`min-h-screen font-sans pb-10 transition-colors duration-500 ${bg} ${text}`}>
      <div className="max-w-md mx-auto min-h-screen flex flex-col">
        <header className="pt-8 pb-2 px-6 flex justify-end">
          <button onClick={() => setIsDarkMode(!isDarkMode)} className={`p-3 rounded-full transition border ${isDarkMode ? 'bg-slate-900 text-yellow-400 border-slate-800' : 'bg-white text-slate-600 border-gray-200'}`}>
            {isDarkMode ? <Sun size={20} /> : <Moon size={20} />}
          </button>
        </header>

        <main className="flex-1 px-6 py-4 space-y-10">
          {result || loading ? (
            <ResultDisplay data={result!} loading={loading} onRetry={() => setResult(null)} displayLocation={displayLocation} isDarkMode={isDarkMode} />
          ) : (
            <div className="space-y-10 animate-fade-in">
              <div className="space-y-4">
                <label className={`flex items-center text-xs font-bold tracking-[0.15em] ml-1 uppercase ${textSub}`}><MapPin size={14} className="mr-2" /> Location</label>
                <div className="relative">
                  <input type="text" value={displayLocation} onChange={(e) => handleInputChange(e.target.value)} className={`w-full text-lg px-6 py-5 outline-none rounded-3xl ${input}`} placeholder="輸入城市..." />
                  <div className="absolute right-3 top-1/2 -translate-y-1/2 flex gap-2 overflow-x-auto max-w-[60%] no-scrollbar">
                     {['汐止', '泰山', '雙北'].map(n => <button key={n} onClick={() => handleQuickLocation(n, n === '雙北' ? 'Taipei' : n)} className={`text-xs px-3 py-1.5 rounded-full border whitespace-nowrap transition ${isDarkMode ? 'border-white/10 text-slate-300 hover:bg-white/5' : 'border-gray-200 text-gray-600 hover:bg-gray-50'}`}>{n}</button>)}
                     <button onClick={addCustomLocation} className={`w-7 h-7 flex items-center justify-center rounded-full border ${isDarkMode ? 'border-white/10 text-slate-400' : 'border-gray-200 text-gray-400'}`}>+</button>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-4">
                  <label className={`flex items-center text-xs font-bold tracking-[0.15em] ml-1 uppercase ${textSub}`}><User size={14} className="mr-2" /> Gender</label>
                  <div className={`flex gap-1 p-1.5 rounded-3xl ${card}`}>
                    {(['Female', 'Male'] as Gender[]).map(g => <button key={g} onClick={() => setGender(g)} className={`flex-1 py-3.5 rounded-2xl text-sm font-medium transition-all ${gender === g ? (isDarkMode ? 'bg-slate-800 text-white shadow-sm' : 'bg-slate-100 text-slate-900') : 'text-slate-400 hover:text-slate-500'}`}>{g === 'Female' ? '女生' : '男生'}</button>)}
                  </div>
                </div>
                <div className="space-y-4">
                  <label className={`flex items-center text-xs font-bold tracking-[0.15em] ml-1 uppercase ${textSub}`}><Sparkles size={14} className="mr-2" /> Style</label>
                  <div className="flex flex-col gap-2.5">
                    {(['Casual', 'Formal', 'Sport'] as Style[]).map(s => <button key={s} onClick={() => setStyle(s)} className={`py-3.5 px-5 text-sm rounded-2xl border transition-all flex justify-between items-center ${style === s ? (isDarkMode ? 'bg-white/10 border-white/20 text-white' : 'bg-slate-900 text-white border-slate-900') : (isDarkMode ? 'bg-transparent border-white/10 text-slate-400 hover:bg-white/5' : 'bg-white border-gray-200 text-gray-500 hover:bg-gray-50')}`}>{s === 'Casual' ? '休閒' : s === 'Formal' ? '正式' : '運動'} {style === s && <div className="w-1.5 h-1.5 rounded-full bg-current"/>}</button>)}
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <label className={`flex items-center text-xs font-bold tracking-[0.15em] ml-1 uppercase ${textSub}`}><Palette size={14} className="mr-2" /> Season</label>
                <select value={colorSeason} onChange={(e) => setColorSeason(e.target.value as ColorSeason)} className={`w-full text-base px-6 py-5 border outline-none rounded-3xl appearance-none ${input}`}>
                  {seasons.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>

              <div className="space-y-4">
                <label className={`flex items-center text-xs font-bold tracking-[0.15em] ml-1 uppercase ${textSub}`}><Clock size={14} className="mr-2" /> Time</label>
                <div className="grid grid-cols-4 gap-2.5">
                   <button onClick={() => { setTimeOfDay('current'); setTargetDay('today'); }} className={`py-3.5 text-xs font-medium ${btnBase} ${timeOfDay === 'current' ? btnActive : btnInactive}`}>🚀 現在</button>
                   {(['morning', 'afternoon', 'evening'] as TimeOfDay[]).map(t => <button key={t} onClick={() => setTimeOfDay(t)} className={`py-3.5 text-xs font-medium ${btnBase} ${timeOfDay === t ? btnActive : btnInactive}`}>{t === 'morning' ? '早上' : t === 'afternoon' ? '下午' : '晚上'}</button>)}
                </div>
                {timeOfDay !== 'current' && <div className="flex justify-center gap-3 pt-1">{(['today', 'tomorrow'] as TargetDay[]).map(d => <button key={d} onClick={() => setTargetDay(d)} className={`text-xs px-6 py-2 rounded-full transition-colors border ${targetDay === d ? (isDarkMode ? 'bg-white text-slate-900 border-white' : 'bg-slate-900 text-white border-slate-900') : (isDarkMode ? 'border-white/10 text-slate-500' : 'border-gray-200 text-gray-400')}`}>{d === 'today' ? '今天' : '明天'}</button>)}</div>}
              </div>

              <button onClick={handleGenerate} disabled={loading} className={`w-full py-5 rounded-3xl font-bold text-lg shadow-xl hover:scale-[1.01] hover:shadow-2xl transition-all duration-300 disabled:opacity-50 ${isDarkMode ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white' : 'bg-slate-900 text-white'}`}>{loading ? <Loader2 className="animate-spin mx-auto" /> : '生成穿搭建議'}</button>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
export default App;