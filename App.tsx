import React, { useState, useCallback } from 'react';
import { getGeminiSuggestion } from './services/geminiService';
import ResultDisplay from './components/ResultDisplay';
import { WeatherOutfitResponse, Gender, Style, ColorSeason, TimeOfDay, TargetDay } from './types';
import { MapPin, Shirt, Palette, Clock, Loader2, User, Sparkles } from 'lucide-react';

function App() {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<WeatherOutfitResponse | null>(null);
  
  // 邏輯修正：地點分為「顯示用」和「API用」
  const [displayLocation, setDisplayLocation] = useState('泰山'); 
  const [apiLocation, setApiLocation] = useState('Taishan, Taiwan');

  const [gender, setGender] = useState<Gender>('Female');
  const [style, setStyle] = useState<Style>('Casual');
  const [colorSeason, setColorSeason] = useState<ColorSeason>('Bright Winter (淨冬/亮冬)');
  
  const [targetDay, setTargetDay] = useState<TargetDay>('today');
  const [timeOfDay, setTimeOfDay] = useState<TimeOfDay>('current');

  // 處理地點輸入 (手動輸入)
  const handleInputChange = (val: string) => {
    setDisplayLocation(val);
    // 簡單防呆：如果是泰山，自動加 Taiwan；其他直接送出使用者輸入的
    if (val.includes('泰山') || val.toLowerCase().includes('taishan')) {
      setApiLocation('Taishan, Taiwan');
    } else {
      setApiLocation(val);
    }
  };

  // 處理地點快捷鍵 (按鈕)
  const handleQuickLocation = (name: string, query: string) => {
    setDisplayLocation(name);
    setApiLocation(query);
  };

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
      const actualTimeOfDay = timeOfDay === 'current' ? calculateCurrentTimeOfDay() : timeOfDay;
      const actualTargetDay = timeOfDay === 'current' ? 'today' : targetDay;

      const data = await getGeminiSuggestion(
        apiLocation, // 送出 API 專用的地點字串
        gender, 
        style, 
        colorSeason, 
        actualTimeOfDay, 
        actualTargetDay
      );
      setResult(data);
    } catch (error) {
      console.error(error);
      alert('AI 暫時忙碌中，請稍後再試！');
    } finally {
      setLoading(false);
    }
  }, [apiLocation, gender, style, colorSeason, timeOfDay, targetDay]);

  const handleRetry = () => {
    setResult(null);
  };

  const seasons: ColorSeason[] = [
    'Bright Winter (淨冬/亮冬)', 'True Winter (正冬)', 'Dark Winter (深冬)',
    'Light Spring (淨春)', 'True Spring (正春)', 'Bright Spring (亮春)',
    'Light Summer (淨夏)', 'True Summer (正夏)', 'Muted Summer (柔夏)',
    'Soft Autumn (柔秋)', 'True Autumn (正秋)', 'Dark Autumn (深秋)'
  ];

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 font-sans selection:bg-blue-500/30 pb-10">
      <div className="max-w-md mx-auto min-h-screen flex flex-col relative">
        
        <header className="pt-8 pb-2 px-6 text-center relative z-10">
          <div className="inline-flex items-center justify-center p-3 bg-blue-500/10 rounded-2xl mb-4 ring-1 ring-blue-500/20 backdrop-blur-xl">
            <Shirt className="w-8 h-8 text-blue-400" />
          </div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-white via-blue-100 to-blue-200 bg-clip-text text-transparent">
            AI 穿搭氣象台
          </h1>
        </header>

        <main className="flex-1 px-6 py-4 space-y-8 relative z-10">
          
          <div className="min-h-[100px] transition-all duration-500 ease-out">
            {result || loading ? (
              <ResultDisplay 
                data={result!} 
                loading={loading} 
                onRetry={handleRetry} 
                userGender={gender}
                userStyle={style}
                targetDay={timeOfDay === 'current' ? 'today' : targetDay}
                timeOfDay={timeOfDay === 'current' ? calculateCurrentTimeOfDay() : timeOfDay}
              />
            ) : (
              <div className="space-y-8 animate-fade-in-up">
                
                {/* Location */}
                <div className="space-y-3">
                  <div className="flex justify-between items-center mb-1">
                    <label className="flex items-center text-sm font-bold text-slate-400 ml-1 uppercase tracking-wider">
                      <MapPin size={14} className="mr-2 text-blue-400" /> 地點 Location
                    </label>
                  </div>
                  
                  <div className="relative">
                    <input 
                      type="text" 
                      value={displayLocation} 
                      onChange={(e) => handleInputChange(e.target.value)} 
                      className="w-full bg-slate-800/50 border border-slate-700 text-white text-lg rounded-2xl px-5 py-4 focus:ring-2 focus:ring-blue-500 outline-none placeholder-slate-600 transition-all" 
                      placeholder="輸入城市..." 
                    />
                    {/* 🔥 終於補回來了：絕對定位在右上角的快捷按鈕 */}
                    <div className="absolute right-2 top-1/2 -translate-y-1/2 flex gap-1">
                       <button onClick={() => handleQuickLocation('泰山', 'Taishan, Taiwan')} className="text-[11px] px-3 py-1.5 bg-slate-700/50 hover:bg-slate-600 rounded-xl text-slate-300 transition-colors border border-slate-600/30">泰山</button>
                       <button onClick={() => handleQuickLocation('汐止', 'Xizhi, Taiwan')} className="text-[11px] px-3 py-1.5 bg-slate-700/50 hover:bg-slate-600 rounded-xl text-slate-300 transition-colors border border-slate-600/30">汐止</button>
                       <button onClick={() => handleQuickLocation('雙北通勤', 'Taipei, Taiwan')} className="text-[11px] px-3 py-1.5 bg-slate-700/50 hover:bg-slate-600 rounded-xl text-slate-300 transition-colors border border-slate-600/30">雙北</button>
                    </div>
                  </div>
                </div>

                {/* Gender & Style */}
                <div className="grid grid-cols-2 gap-6">
                  <div className="space-y-3">
                    <label className="flex items-center text-sm font-bold text-slate-400 ml-1 uppercase tracking-wider">
                      <User size={14} className="mr-2 text-indigo-400" /> 性別
                    </label>
                    <div className="flex gap-2 bg-slate-800/30 p-1 rounded-2xl border border-slate-700/50">
                      {(['Female', 'Male'] as Gender[]).map((g) => (
                        <button key={g} onClick={() => setGender(g)} className={`flex-1 py-3 rounded-xl text-sm font-medium transition-all duration-300 ${gender === g ? 'bg-indigo-500 text-white shadow-lg' : 'text-slate-400 hover:text-white'}`}>{g === 'Female' ? '女生' : '男生'}</button>
                      ))}
                    </div>
                  </div>
                  <div className="space-y-3">
                    <label className="flex items-center text-sm font-bold text-slate-400 ml-1 uppercase tracking-wider">
                      <Sparkles size={14} className="mr-2 text-amber-400" /> 風格
                    </label>
                    <div className="grid grid-cols-1 gap-2">
                      {(['Casual', 'Formal', 'Sport'] as Style[]).map((s) => (
                         <button key={s} onClick={() => setStyle(s)} className={`py-2 px-3 rounded-xl text-xs font-medium border transition-all text-center ${style === s ? 'bg-amber-500/20 border-amber-500/50 text-amber-300' : 'bg-slate-800/50 border-slate-700 text-slate-400 hover:bg-slate-800'}`}>{s === 'Casual' ? '休閒' : s === 'Formal' ? '正式' : '運動'}</button>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Personal Color */}
                <div className="space-y-3">
                  <label className="flex items-center text-sm font-bold text-slate-400 ml-1 uppercase tracking-wider">
                    <Palette size={14} className="mr-2 text-pink-400" /> 個人色彩季型
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    {seasons.map((season) => (
                      <button
                        key={season}
                        onClick={() => setColorSeason(season)}
                        className={`py-2.5 px-3 rounded-xl text-xs font-medium border transition-all text-left truncate ${
                          colorSeason === season ? 'bg-pink-500/20 border-pink-500/50 text-pink-300 shadow-[0_0_15px_rgba(236,72,153,0.2)]' : 'bg-slate-800/50 border-slate-700 text-slate-400 hover:bg-slate-700 hover:text-slate-200'
                        }`}
                      >
                        {season.split(' (')[0]} <span className="opacity-60 text-[10px]">({season.split(' (')[1].replace(')', '')})</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Time */}
                <div className="space-y-3">
                  <label className="flex items-center text-sm font-bold text-slate-400 ml-1 uppercase tracking-wider">
                    <Clock size={14} className="mr-2 text-green-400" /> 時間選擇
                  </label>
                  <div className="grid grid-cols-4 gap-2">
                     <button onClick={() => { setTimeOfDay('current'); setTargetDay('today'); }} className={`flex flex-col items-center justify-center py-3 rounded-2xl border transition-all ${timeOfDay === 'current' ? 'bg-green-500/20 border-green-500/50 text-green-300' : 'bg-slate-800/50 border-slate-700 text-slate-400'}`}><span className="text-xs font-bold">🚀 現在</span></button>
                     {(['morning', 'afternoon', 'evening'] as TimeOfDay[]).map((t) => (
                      <button key={t} onClick={() => setTimeOfDay(t)} className={`flex flex-col items-center justify-center py-3 rounded-2xl border transition-all ${timeOfDay === t ? 'bg-blue-500/20 border-blue-500/50 text-blue-300' : 'bg-slate-800/50 border-slate-700 text-slate-400'}`}><span className="text-xs">{t === 'morning' ? '早上' : t === 'afternoon' ? '下午' : '晚上'}</span></button>
                     ))}
                  </div>
                  {/* 如果不是選「現在」，允許切換今天/明天 */}
                  {timeOfDay !== 'current' && (
                    <div className="flex justify-center gap-4 mt-2 pt-2 border-t border-slate-800">
                      {(['today', 'tomorrow'] as TargetDay[]).map((d) => (
                        <button 
                          key={d} 
                          onClick={() => setTargetDay(d)} 
                          className={`text-xs px-4 py-1.5 rounded-full transition-colors ${targetDay === d ? 'bg-slate-700 text-white font-medium' : 'text-slate-500 hover:text-slate-300'}`}
                        >
                          {d === 'today' ? 'Today (今天)' : 'Tomorrow (明天)'}
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                <button onClick={handleGenerate} disabled={loading} className="w-full py-5 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-2xl font-bold text-white text-lg shadow-xl shadow-blue-500/20 hover:shadow-blue-500/40 hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed relative overflow-hidden mt-4">
                  {loading ? <Loader2 className="animate-spin mx-auto" /> : '✨ 生成專屬穿搭'}
                </button>

              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}

export default App;