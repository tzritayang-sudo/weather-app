import React, { useMemo } from 'react';
import { CloudRain, Shirt, Footprints, ShoppingBag, Umbrella, Glasses, Wind, Watch, ThermometerSun, Droplets, Cloud, Sun, CloudLightning, Sparkles } from 'lucide-react';
import { WeatherOutfitResponse } from '../types';

const translateWeather = (cond: string) => {
  if (!cond) return '多雲';
  const c = cond.toLowerCase();
  if (c.includes('partly') && c.includes('cloudy')) return '多雲時晴';
  if (c.includes('sunny') || c.includes('clear')) return '晴朗';
  if (c.includes('cloudy') || c.includes('overcast')) return '多雲';
  if (c.includes('rain') || c.includes('drizzle')) return '有雨';
  if (c.includes('shower')) return '陣雨';
  if (c.includes('thunder')) return '雷雨';
  if (c.includes('fog') || c.includes('mist')) return '有霧';
  return cond; 
};

// 自定義褲子圖示
const PantsIcon = ({ size = 24, color = "currentColor", ...props }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" {...props}>
    <path d="M6 4h12v3h-12z" /> <path d="M6 7v13a1 1 0 0 0 1 1h3a1 1 0 0 0 1-1v-8h2v8a1 1 0 0 0 1 1h3a1 1 0 0 0 1-1v-13" />
  </svg>
);

const getColorHex = (colorName: string): string => {
  if (!colorName) return '#cbd5e1';
  const n = colorName.toLowerCase();
  if (n.includes('black') || n.includes('黑')) return '#1a1a1a';
  if (n.includes('white') || n.includes('白') || n.includes('米白')) return '#ffffff';
  if (n.includes('grey') || n.includes('gray') || n.includes('灰') || n.includes('銀')) return '#9ca3af';
  if (n.includes('charcoal') || n.includes('炭')) return '#374151';
  if (n.includes('navy') || n.includes('藏青') || n.includes('深藍')) return '#1e3a8a';
  if (n.includes('royal') || n.includes('寶石')) return '#2563eb';
  if (n.includes('sky') || n.includes('天藍') || n.includes('湖水')) return '#38bdf8';
  if (n.includes('teal') || n.includes('藍綠')) return '#14b8a6';
  if (n.includes('indigo') || n.includes('靛') || n.includes('紫藍')) return '#4f46e5';
  if (n.includes('burgundy') || n.includes('酒紅')) return '#881337';
  if (n.includes('red') || n.includes('紅')) return '#ef4444';
  if (n.includes('pink') || n.includes('粉') || n.includes('桃')) return '#f472b6';
  if (n.includes('rose') || n.includes('玫瑰')) return '#e11d48';
  if (n.includes('brown') || n.includes('褐') || n.includes('棕') || n.includes('焦糖')) return '#78350f';
  if (n.includes('camel') || n.includes('駝')) return '#d97706';
  if (n.includes('beige') || n.includes('米') || n.includes('杏')) return '#fef3c7';
  if (n.includes('khaki') || n.includes('卡其')) return '#a8a29e';
  if (n.includes('olive') || n.includes('橄欖')) return '#3f6212';
  if (n.includes('green') || n.includes('綠')) return '#22c55e';
  if (n.includes('yellow') || n.includes('黃')) return '#facc15';
  if (n.includes('mustard') || n.includes('芥末')) return '#ca8a04';
  if (n.includes('orange') || n.includes('橘') || n.includes('橙')) return '#f97316';
  if (n.includes('purple') || n.includes('紫')) return '#a855f7';
  if (n.includes('lavender') || n.includes('薰衣草')) return '#c084fc';
  return '#94a3b8'; 
};

// 🔥 修正後的圖示判斷邏輯
const getIcon = (type: string | undefined, name: string | undefined) => {
  const t = (type || '').toLowerCase();
  const n = (name || '').toLowerCase();
  
  // 1. 先判斷具體配件
  if (t.includes('watch') || n.includes('錶')) return Watch;
  if (t.includes('shoe') || n.includes('鞋') || n.includes('靴')) return Footprints;
  if (t.includes('pant') || t.includes('jeans') || n.includes('褲')) return PantsIcon;
  if (t.includes('bag') || n.includes('包')) return ShoppingBag;
  if (n.includes('傘')) return Umbrella;
  if (n.includes('鏡')) return Glasses;

  // 2. 再判斷外套 (關鍵修正：讓外套優先於上衣被抓出來)
  if (t.includes('jacket') || t.includes('coat') || n.includes('外套') || n.includes('大衣') || n.includes('夾克')) return Wind;

  // 3. 最後才是上衣
  if (t.includes('top') || t.includes('shirt') || n.includes('t恤') || n.includes('衫') || n.includes('上衣')) return Shirt;
  
  return Shirt; // 預設
};

interface Props { data: WeatherOutfitResponse; loading: boolean; onRetry: () => void; displayLocation: string; isDarkMode: boolean; }

const ResultDisplay: React.FC<Props> = ({ data, loading, onRetry, displayLocation, isDarkMode }) => {
  const displayItems = useMemo(() => { 
    if (!data?.outfit?.items) return []; 
    return data.outfit.items.map((item: any) => ({ 
      ...item, 
      hexColor: getColorHex(item.color), 
      IconComponent: getIcon(item.type, item.name) 
    })); 
  }, [data]);
  
  const colorPalette = useMemo(() => { 
    if (!data?.outfit?.color_palette) return []; 
    return data.outfit.color_palette.map((c: string) => ({ name: c, hex: getColorHex(c) })); 
  }, [data]);

  const card = isDarkMode ? 'bg-slate-900/60 border border-white/10 backdrop-blur-2xl' : 'bg-white border border-gray-100 shadow-[0_8px_30px_rgb(0,0,0,0.04)]';
  const itemCard = isDarkMode ? 'bg-white/5 border border-white/5 hover:bg-white/10' : 'bg-white border border-gray-100 hover:shadow-lg';
  const textMain = isDarkMode ? 'text-white' : 'text-gray-900';
  const textSub = isDarkMode ? 'text-slate-400' : 'text-gray-500';
  const circleBg = isDarkMode ? 'bg-slate-800' : 'bg-gray-50';
  const circleBorder = isDarkMode ? 'border-2 border-white/30' : 'border-2 border-gray-300';
  const weatherCardBg = isDarkMode 
    ? 'bg-gradient-to-br from-slate-800 to-slate-900 border border-white/10' 
    : 'bg-gradient-to-br from-blue-50 to-white border border-blue-100';

  if (loading) return <div className={`text-center p-10 ${textSub} tracking-widest text-sm animate-pulse`}>AI 分析中...</div>;
  if (!data || !data.weather) return null;

  const timeLabel = data.targetDay === 'tomorrow' ? '明天' : '現在';
  const weatherCondition = translateWeather(data.weather.condition || '');
  
  let WeatherIcon = Cloud;
  if (weatherCondition.includes('雨')) WeatherIcon = CloudRain;
  else if (weatherCondition.includes('雷')) WeatherIcon = CloudLightning;
  else if (weatherCondition.includes('晴')) WeatherIcon = Sun;

  return (
    <div className="w-full max-w-md mx-auto space-y-8 pb-20 animate-fade-in-up">
      
      {/* 天氣卡片 */}
      <div className={`rounded-[2.5rem] p-8 relative overflow-hidden ${weatherCardBg} shadow-xl`}>
        <div className="absolute -right-10 -top-10 opacity-10 rotate-12 pointer-events-none">
          <WeatherIcon size={240} fill="currentColor" className={isDarkMode ? 'text-white' : 'text-blue-900'} />
        </div>

        <div className="relative z-10">
          <div className="flex justify-between items-start mb-4">
            <div>
              <h2 className={`text-4xl font-bold tracking-tight ${textMain}`}>{displayLocation}</h2>
              <div className="flex items-center gap-2 mt-2">
                <span className={`text-xl font-medium ${textSub}`}>{weatherCondition}</span>
                <span className={`px-3 py-1 rounded-full text-xs font-bold tracking-wider ${isDarkMode ? 'bg-white/10 text-white' : 'bg-slate-100 text-slate-600'}`}>
                  {timeLabel}
                </span>
              </div>
            </div>
          </div>

          <div className="mt-4 flex items-baseline gap-3">
            <div className={`text-[5rem] leading-none font-light tracking-tighter ${textMain}`}>
              {data.weather.temperature}°
            </div>
            <div className="flex flex-col text-sm font-medium opacity-80">
               <span className={textMain}>高 {data.weather.maxtempC}°</span>
               <span className={textSub}>低 {data.weather.mintempC}°</span>
            </div>
          </div>

          <div className="mt-8 grid grid-cols-3 gap-4 border-t pt-6 border-dashed border-gray-400/20">
            <div className="flex flex-col gap-1">
              <span className={`text-[10px] uppercase tracking-wider font-bold opacity-60 ${textSub}`}>體感</span>
              <span className={`text-xl font-semibold flex items-center gap-1 ${textMain}`}>
                <ThermometerSun size={18} className="opacity-70" /> 
                {data.weather.feels_like || data.weather.temperature}°
              </span>
            </div>
            <div className="flex flex-col gap-1">
              <span className={`text-[10px] uppercase tracking-wider font-bold opacity-60 ${textSub}`}>濕度</span>
              <span className={`text-xl font-semibold flex items-center gap-1 ${textMain}`}>
                <Droplets size={18} className="opacity-70" /> {data.weather.humidity}
              </span>
            </div>
            <div className="flex flex-col gap-1">
              <span className={`text-[10px] uppercase tracking-wider font-bold opacity-60 ${textSub}`}>降雨率</span>
              <span className={`text-xl font-semibold flex items-center gap-1 ${textMain}`}>
                <CloudRain size={18} className="opacity-70" /> {data.weather.precipitation}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* 穿搭 Tips */}
      {data.outfit.tips && (
        <div className={`p-6 rounded-3xl text-sm leading-relaxed tracking-wide border flex gap-3 ${isDarkMode ? 'bg-amber-900/20 border-amber-800/30 text-amber-100' : 'bg-amber-50 border-amber-100 text-amber-900'}`}>
          <Sparkles className="shrink-0 mt-0.5 text-amber-400" size={18} />
          {data.outfit.tips}
        </div>
      )}

      {/* 單品清單 */}
      <div className="grid grid-cols-2 gap-4">
        {displayItems.map((item: any, i: number) => {
          const isBlack = item.hexColor === '#1a1a1a';
          const isWhite = item.hexColor === '#ffffff';
          const iconColor = (isDarkMode && isBlack) || (!isDarkMode && isWhite) ? '#ffffff' : item.hexColor;
          const circleBgDynamic = !isDarkMode && isWhite ? 'bg-slate-400' : isDarkMode && isBlack ? 'bg-slate-700' : circleBg;

          return (
            <div key={i} className={`rounded-[2rem] p-6 flex flex-col items-center text-center relative min-h-[220px] justify-center transition-all duration-300 ${itemCard}`}>
              <div className="absolute top-0 left-1/2 -translate-x-1/2 w-12 h-1 rounded-b-full opacity-50" style={{ backgroundColor: item.hexColor }} />
              <div className={`mb-6 p-5 rounded-full shadow-sm ${circleBgDynamic} ${circleBorder}`}>
                <item.IconComponent size={40} style={{ color: iconColor }} strokeWidth={1.5} />
              </div>
              <span className={`text-xs px-3 py-1 rounded-full mb-3 tracking-wider border ${isDarkMode ? 'border-white/10 text-slate-400' : 'border-gray-200 text-gray-500'}`}>{item.color}</span>
              <h4 className={`font-bold text-lg leading-tight mb-1 ${textMain}`}>{item.name}</h4>
              <p className={`text-xs ${textSub}`}>{item.material}</p>
            </div>
          );
        })}
      </div>

      {/* 推薦配色 */}
      <div className={`rounded-[2rem] p-8 flex flex-col items-center text-center ${card}`}>
        <h3 className={`text-xs font-bold tracking-[0.25em] mb-6 uppercase ${textSub}`}>推薦配色</h3>
        <div className="flex gap-6">
          {colorPalette.map((c, i) => (
            <div key={i} className={`w-12 h-12 rounded-full shadow-xl transition-transform hover:scale-110 ${isDarkMode ? 'border-2 border-white/30' : 'border-2 border-gray-300'}`} style={{ backgroundColor: c.hex }} title={c.name} />
          ))}
        </div>
      </div>

      {/* 穿搭靈感圖片 */}
      {data.generatedImages && data.generatedImages.length > 0 && (
        <div className="space-y-6 pt-2">
          <h3 className={`text-xs font-bold tracking-[0.25em] px-2 uppercase ${textSub}`}>穿搭靈感</h3>
          <div className="grid grid-cols-2 gap-4">
            <div className={`col-span-2 aspect-[16/9] rounded-[2rem] overflow-hidden shadow-lg ${isDarkMode ? 'border border-white/10' : 'border border-gray-100'}`}>
              <img src={data.generatedImages[0].src.large} alt="Style" className="w-full h-full object-cover" />
            </div>
            {data.generatedImages.slice(1, 3).map((img: any) => (
              <div key={img.id} className={`aspect-[4/3] rounded-[2rem] overflow-hidden shadow-lg ${isDarkMode ? 'border border-white/10' : 'border border-gray-100'}`}>
                <img src={img.src.medium} alt="Detail" className="w-full h-full object-cover" />
              </div>
            ))}
          </div>
        </div>
      )}

      <button onClick={onRetry} className={`w-full py-6 rounded-[2rem] font-bold text-lg tracking-wide transition-all duration-300 border ${isDarkMode ? 'bg-slate-900 text-white border-white/15 hover:bg-black' : 'bg-slate-900 text-white border-slate-900 hover:bg-slate-800'}`}>
        重新生成
      </button>
    </div>
  );
};

export default ResultDisplay;
