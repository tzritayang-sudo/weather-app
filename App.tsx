import React, { useState, useCallback } from 'react';
import { getGeminiSuggestion } from './services/geminiService';
import ResultDisplay from './components/ResultDisplay';
import { WeatherOutfitResponse, Gender, Style, ColorSeason, TimeOfDay, TargetDay } from './types';
import { MapPin, Shirt, Palette, Clock, Loader2 } from 'lucide-react';

function App() {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<WeatherOutfitResponse | null>(null);
  
  const [location, setLocation] = useState('Taipei');
  const [gender, setGender] = useState<Gender>('Female');
  const [style, setStyle] = useState<Style>('Casual');
  const [colorSeason, setColorSeason] = useState<ColorSeason>('Bright Winter (淨冬/亮冬)');
  const [targetDay, setTargetDay] = useState<TargetDay>('today');
  const [timeOfDay, setTimeOfDay] = useState<TimeOfDay>('current');

  // 🔥 核心修復：準確計算現在時間段 (0-11 morning, 12-17 afternoon, 18+ evening)
  const calculateCurrentTimeOfDay = (): TimeOfDay => {
    const hour = new Date().getHours();
    if (hour >= 5 && hour < 12) return 'morning';
    if (hour >= 12 && hour < 18) return 'afternoon';
    return 'evening';
  };

  const handleGenerate = useCallback(async () => {
    setLoading(true);
    setResult(null);
    try {
      // 如果選 "現在"，強制鎖定為 "今天" + "當下時間段"
      const actualTimeOfDay = timeOfDay === 'current' ? calculateCurrentTimeOfDay() : timeOfDay;
      const actualTargetDay = timeOfDay === 'current' ? 'today' : targetDay;

      const data = await getGeminiSuggestion(
        location, gender, style, colorSeason, actualTimeOfDay, actualTargetDay
      );
      setResult(data);
    } catch (error) {
      console.error(error);
      alert('AI 暫時忙碌中，請稍後再試！');
    } finally {
      setLoading(false);
    }
  }, [location, gender, style, colorSeason, timeOfDay, targetDay]);

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 font-sans selection:bg-blue-500/30">
      <div className="max-w-md mx-auto min-h-screen flex flex-col relative">
        <header className="pt-8 pb-2 px-6 text-center relative z-10">
          <div className="inline-flex items-center justify-center p-3 bg-blue-500/10 rounded-2xl mb-4 ring-1 ring-blue-500/20 backdrop-blur-xl">
            <Shirt className="w-8 h-8 text-blue-400" />
          </div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-white via-blue-100 to-blue-200 bg-clip-text text-transparent">
            AI 穿搭氣象台
          </h1>
        </header>

        <main className="flex-1 px-6 py-6 pb-24 space-y-8 relative z-10">
          <div className="min-h-[100px] transition-all duration-500 ease-out">
            {result || loading ? (
              <ResultDisplay 
                data={result!} 
                loading={loading} 
                onRetry={handleGenerate}
                userGender={gender}
                userStyle={style}
                targetDay={timeOfDay === 'current' ? 'today' : targetDay}
                timeOfDay={timeOfDay === 'current' ? calculateCurrentTimeOfDay() : timeOfDay}
              />
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-slate-500 space-y-4 py-12 border-2 border-dashed border-slate-800 rounded-3xl bg-slate-900/50">
                <p>設定條件並點擊生成按鈕</p>
              </div>
            )}
          </div>

          {!loading && !result && (
            <div className="space-y-6 animate-fade-in-up">
              <div className="space-y-3">
                <label className="flex items-center text-sm font-medium text-slate-300 ml-1"><MapPin size={16} className="mr-2 text-blue-400" /> 地點</label>
                <input type="text" value={location} onChange={(e) => setLocation(e.target.value)} className="w-full bg-slate-800/50 border border-slate-700 text-white text-lg rounded-2xl px-5 py-4 focus:ring-2 focus:ring-blue-500 outline-none" placeholder="輸入城市..." />
              </div>

              <div className="grid grid-cols-2 gap-4">
                 <div className="space-y-3">
                  <label className="text-sm font-medium text-slate-300 ml-1">性別</label>
                  <div className="grid grid-cols-2 gap-2 bg-slate-800/50 p-1.5 rounded-2xl border border-slate-700">
                    {(['Female', 'Male'] as Gender[]).map((g) => (
                      <button key={g} onClick={() => setGender(g)} className={`py-2.5 rounded-xl text-sm font-medium transition-all ${gender === g ? 'bg-blue-500 text-white' : 'text-slate-400'}`}>{g === 'Female' ? '女生' : '男生'}</button>
                    ))}
                  </div>
                </div>
                 <div className="space-y-3">
                  <label className="text-sm font-medium text-slate-300 ml-1">風格</label>
                  <select value={style} onChange={(e) => setStyle(e.target.value as Style)} className="w-full bg-slate-800/50 border border-slate-700 text-white text-sm rounded-2xl px-4 py-3.5 outline-none">
                    <option value="Casual">休閒</option><option value="Formal">正式</option><option value="Sport">運動</option>
                  </select>
                </div>
              </div>

              <div className="space-y-3">
                <label className="flex items-center text-sm font-medium text-slate-300 ml-1"><Palette size={16} className="mr-2 text-purple-400" /> 個人色彩</label>
                <select value={colorSeason} onChange={(e) => setColorSeason(e.target.value as ColorSeason)} className="w-full bg-slate-800/50 border border-slate-700 text-white text-lg rounded-2xl px-5 py-4 outline-none">
                  <option value="Bright Winter (淨冬/亮冬)">Bright Winter (淨冬/亮冬)</option>
                  <option value="True Winter (正冬/冷冬)">True Winter (正冬/冷冬)</option>
                  <option value="Dark Winter (深冬/暗冬)">Dark Winter (深冬/暗冬)</option>
                  <option value="Light Summer (淨夏/淺夏)">Light Summer (淨夏/淺夏)</option>
                  <option value="True Summer (正夏/冷夏)">True Summer (正夏/冷夏)</option>
                  <option value="Muted Summer (柔夏)">Muted Summer (柔夏)</option>
                  <option value="Light Spring (淨春/淺春)">Light Spring (淨春/淺春)</option>
                  <option value="True Spring (正春/暖春)">True Spring (正春/暖春)</option>
                  <option value="Bright Spring (亮春)">Bright Spring (亮春)</option>
                  <option value="Soft Autumn (柔秋)">Soft Autumn (柔秋)</option>
                  <option value="True Autumn (正秋/暖秋)">True Autumn (正秋/暖秋)</option>
                  <option value="Dark Autumn (深秋/暗秋)">Dark Autumn (深秋/暗秋)</option>
                </select>
              </div>

              <div className="space-y-3">
                <label className="flex items-center text-sm font-medium text-slate-300 ml-1"><Clock size={16} className="mr-2 text-green-400" /> 時間</label>
                <div className="grid grid-cols-4 gap-2">
                   <button onClick={() => { setTimeOfDay('current'); setTargetDay('today'); }} className={`py-3 rounded-2xl border ${timeOfDay === 'current' ? 'bg-green-500/20 border-green-500/50 text-green-300' : 'bg-slate-800/50 border-slate-700 text-slate-400'}`}><span className="text-xs font-bold">🚀 現在</span></button>
                   {(['morning', 'afternoon', 'evening'] as TimeOfDay[]).map((t) => (
                    <button key={t} onClick={() => setTimeOfDay(t)} className={`py-3 rounded-2xl border ${timeOfDay === t ? 'bg-blue-500/20 border-blue-500/50 text-blue-300' : 'bg-slate-800/50 border-slate-700 text-slate-400'}`}><span className="text-xs">{t === 'morning' ? '早上' : t === 'afternoon' ? '下午' : '晚上'}</span></button>
                   ))}
                </div>
              </div>

              <button onClick={handleGenerate} disabled={loading} className="w-full py-5 bg-gradient-to-r from-blue-600 to-blue-500 rounded-2xl font-bold text-white text-lg shadow-xl shadow-blue-500/20 transition-all">
                {loading ? <Loader2 className="animate-spin mx-auto" /> : '✨ 生成專屬穿搭'}
              </button>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
export default App;