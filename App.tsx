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
    const raw = localStorage.getItem('ai-outfit-v6');
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
    localStorage.setItem('ai-outfit-v6', JSON.stringify({ displayLocation, apiLocation, gender, style, colorSeason, savedLocations, isDarkMode }));
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

  // 極簡風格變數
  const bg = isDarkMode ? 'bg-[#0f172a]' : 'bg-[#f8fafc]'; // 深藍黑 vs 極淺灰
  const text = isDarkMode ? 'text-slate-100' : 'text-slate-800';
  const textSub = isDarkMode ? 'text-slate-400' : 'text-slate-500';
  // 移除陰影，改用邊框 (Flat Design)
  const card = isDarkMode ? 'bg-slate-800/40 border-slate-700' : 'bg-white border-slate-200';
  const input = isDarkMode ? 'bg-slate-800/40 border-slate-700 text-white' : 'bg-white border-slate-300 text-slate-900';
  const btnBase = `rounded-2xl border transition-all duration-200 flex items-center justify-center`;
  const btnActive = isDarkMode ? 'bg-slate-700 text-white border-slate-600' : 'bg-slate-800 text-white border-slate-800';
  const btnInactive = isDarkMode ? 'text-slate-400 border-transparent hover:bg-slate-800' : 'text-slate-500 border-transparent hover:bg-slate-100';

  return (
    <div className={`min-h-screen font-sans pb-10 transition-colors ${bg} ${text}`}>
      <div className="max-w-md mx-auto min-h-screen flex flex-col">
        <header className="pt-6 pb-2 px-6 flex justify-end">
          <button onClick={() => setIsDarkMode(!isDarkMode)} className={`p-3 rounded-full transition border ${isDarkMode ? 'bg-slate-800 text-yellow-400 border-slate-700' : 'bg-white text-slate-600 border-slate-200'}`}>
            {isDarkMode ? <Sun size={20} /> : <Moon size={20} />}
          </button>
        </header>

        <main className="flex-1 px-6 py-4 space-y-8">
          {result || loading ? (
            <ResultDisplay data={result!} loading={loading} onRetry={() => setResult(null)} displayLocation={displayLocation} isDarkMode={isDarkMode} />
          ) : (
            <div className="space-y-8">
              <div className="space-y-3">
                <label className={`flex items-center text-sm font-bold tracking-wider ml-1 ${textSub}`}><MapPin size={16} className="mr-2" /> 地點</label>
                <div className="relative">
                  <input type="text" value={displayLocation} onChange={(e) => handleInputChange(e.target.value)} className={`w-full text-lg px-5 py-4 border outline-none rounded-2xl ${input}`} placeholder="輸入城市..." />
                  <div className="absolute right-2 top-1/2 -translate-y-1/2 flex gap-1 overflow-x-auto max-w-[65%] no-scrollbar">
                     {['汐止', '泰山', '雙北'].map(n => <button key={n} onClick={() => handleQuickLocation(n, n === '雙北' ? 'Taipei' : n)} className={`text-xs px-3 py-1.5 rounded-xl border whitespace-nowrap ${isDarkMode ? 'bg-slate-800/50 border-slate-600 text-slate-300' : 'bg-slate-50 border-slate-200 text-slate-600'}`}>{n}</button>)}
                     {savedLocations.map((loc, i) => <div key={i} className="relative flex items-center"><button onClick={() => handleQuickLocation(loc.label, loc.query)} className={`text-xs pl-3 pr-6 py-1.5 rounded-xl border ${isDarkMode ? 'bg-blue-900/20 border-blue-800 text-blue-200' : 'bg-blue-50 border-blue-200 text-blue-700'}`}>{loc.label}</button><button onClick={(e) => removeLocation(loc.label, e)} className="absolute right-1 text-red-400 hover:text-red-500"><X size={12} /></button></div>)}
                     <button onClick={addCustomLocation} className={`w-7 h-7 flex items-center justify-center rounded-full border ${isDarkMode ? 'bg-slate-800 border-slate-600 text-slate-400' : 'bg-white border-slate-300 text-slate-500'}`}>+</button>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-5">
                <div className="space-y-3">
                  <label className={`flex items-center text-sm font-bold ml-1 ${textSub}`}><User size={16} className="mr-2" /> 性別</label>
                  <div className={`flex gap-1 p-1 rounded-2xl border ${card}`}>
                    {(['Female', 'Male'] as Gender[]).map(g => <button key={g} onClick={() => setGender(g)} className={`flex-1 py-3 ${btnBase} ${gender === g ? btnActive : btnInactive}`}>{g === 'Female' ? '女生' : '男生'}</button>)}
                  </div>
                </div>
                <div className="space-y-3">
                  <label className={`flex items-center text-sm font-bold ml-1 ${textSub}`}><Sparkles size={16} className="mr-2" /> 風格</label>
                  <div className="flex flex-col gap-2">
                    {(['Casual', 'Formal', 'Sport'] as Style[]).map(s => <button key={s} onClick={() => setStyle(s)} className={`py-3 px-4 text-sm ${btnBase} justify-between ${style === s ? btnActive : (isDarkMode ? 'bg-slate-800/30 border-slate-700 text-slate-400' : 'bg-white border-slate-200 text-slate-600')}`}>{s === 'Casual' ? '休閒' : s === 'Formal' ? '正式' : '運動'} {style === s && '✓'}</button>)}
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                <label className={`flex items-center text-sm font-bold ml-1 ${textSub}`}><Palette size={16} className="mr-2" /> 個人色彩</label>
                <select value={colorSeason} onChange={(e) => setColorSeason(e.target.value as ColorSeason)} className={`w-full text-base px-5 py-4 border outline-none rounded-2xl ${input}`}>
                  {seasons.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>

              <div className="space-y-3">
                <label className={`flex items-center text-sm font-bold ml-1 ${textSub}`}><Clock size={16} className="mr-2" /> 時間</label>
                <div className="grid grid-cols-4 gap-2">
                   <button onClick={() => { setTimeOfDay('current'); setTargetDay('today'); }} className={`py-3 text-sm ${btnBase} ${timeOfDay === 'current' ? btnActive : (isDarkMode ? 'bg-slate-800/30 border-slate-700 text-slate-400' : 'bg-white border-slate-200 text-slate-600')}`}>🚀 現在</button>
                   {(['morning', 'afternoon', 'evening'] as TimeOfDay[]).map(t => <button key={t} onClick={() => setTimeOfDay(t)} className={`py-3 text-sm ${btnBase} ${timeOfDay === t ? btnActive : (isDarkMode ? 'bg-slate-800/30 border-slate-700 text-slate-400' : 'bg-white border-slate-200 text-slate-600')}`}>{t === 'morning' ? '早上' : t === 'afternoon' ? '下午' : '晚上'}</button>)}
                </div>
                {timeOfDay !== 'current' && <div className="flex justify-center gap-3 pt-2">{(['today', 'tomorrow'] as TargetDay[]).map(d => <button key={d} onClick={() => setTargetDay(d)} className={`text-sm px-5 py-1.5 rounded-full transition-colors ${targetDay === d ? btnActive : (isDarkMode ? 'text-slate-500' : 'text-slate-400')}`}>{d === 'today' ? '今天' : '明天'}</button>)}</div>}
              </div>

              <button onClick={handleGenerate} disabled={loading} className="w-full py-5 rounded-2xl font-bold text-white text-xl shadow-lg hover:scale-[1.01] transition bg-slate-900 disabled:opacity-50 disabled:cursor-not-allowed">{loading ? <Loader2 className="animate-spin mx-auto" /> : '取得穿搭建議'}</button>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
export default App;