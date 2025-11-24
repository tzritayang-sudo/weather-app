import React, { useMemo } from 'react';
import { CloudRain, Shirt, Footprints, ShoppingBag, Umbrella, Glasses, Wind, Watch, ThermometerSun, Droplets, Cloud } from 'lucide-react';
import { WeatherOutfitResponse } from '../types';

// 🔥 前端再次強制翻譯，確保萬無一失
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
  if (n.includes('rose') || n.includes('玫瑰') || n.includes('洋紅')) return '#e11d48';
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

const getIcon = (type: string | undefined, name: string | undefined) => {
  const t = (type || '').toLowerCase(), n = (name || '').toLowerCase();
  if (t.includes('watch') || n.includes('錶')) return Watch;
  if (t.includes('shoe') || n.includes('鞋')) return Footprints;
  if (t.includes('pant') || n.includes('褲') || t.includes('jeans')) return PantsIcon;
  if (t.includes('jacket') || n.includes('外套') || n.includes('衣')) return Wind;
  if (t.includes('top') || n.includes('t恤') || n.includes('衫')) return Shirt;
  if (t.includes('bag') || n.includes('包')) return ShoppingBag;
  if (n.includes('傘')) return Umbrella;
  if (n.includes('鏡')) return Glasses;
  return Shirt;
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

  const timeLabel = data.targetDay === 'tomorrow' ? '明天' : '現在';
  const weatherCondition = translateWeather(data?.weather?.condition || '');
  const WeatherIcon = weatherCondition.includes('雨') ? CloudRain : Cloud;

  if (loading) return <div className={`text-center p-10 ${textSub} tracking-widest text-sm animate-pulse`}>AI 分析中...</div>;
  if (!data) return null;

  return (
    <div className="w-full max-w-md mx-auto space-y-8 pb-20 animate-fade-in-up">
      
      {/* 🔥 高級天氣卡片：雜誌風格排版 + 背景裝飾 */}
      <div className={`rounded-[2.5rem] p-8 relative overflow-hidden ${card}`}>
        
        {/* 背景大圖示裝飾 */}
        <div className="absolute -right-8 -top-8 opacity-5 rotate-12 pointer-events-none">
          <WeatherIcon size={200} fill="currentColor" />
        </div>

        <div className="relative z-10">
          <div className="flex justify-between items-start mb-6">
            <div>
              <h2 className={`text-3xl font-bold tracking-tight ${textMain}`}>{displayLocation}</h2>
              <div className="flex items-center gap-2 mt-1">
                <span className={`text-lg font-medium ${textSub}`}>{weatherCondition}</span>
                <span className={`px-2.5 py-0.5 text-xs rounded-full ${isDarkMode ? 'bg-white/10 text-white' : 'bg-slate-100 text-slate-600'}`}>
                  {timeLabel}
                </span>
              </div>
            </div>
            {/* 小天氣圖示 */}
            <div className={`p-3 rounded-2xl ${isDarkMode ? 'bg-blue-500/20 text-blue-400' : 'bg-blue-50 text-blue-600'}`}>
              <WeatherIcon className="w-8 h-8" />
            </div>
          </div>

          {/* 主溫度 + 高低溫 */}
          <div className="flex items-baseline gap-4 mb-8">
            <div className={`text-7xl font-light tracking-tighter ${textMain}`}>
              {data.weather.temperature}°
            </div>
            <div className="flex flex-col text-sm font-medium opacity-80 space-y-0.5">
               <span className={textMain}>高 {data.weather.maxtempC}°</span>
               <span className={textSub}>低 {data.weather.mintempC}°</span>
            </div>
          </div>

          {/* 底部資訊列：體感、濕度、降雨 */}
          <div className="grid grid-cols-3 gap-4 border-t pt-6 border-dashed border-gray-400/20">
            <div className="flex flex-col gap-1">
              <span className={`text-[10px] uppercase tracking-wider font-bold opacity-60 ${textSub}`}>體感</span>
              <span className={`text-lg font-semibold flex items-center gap-1 ${textMain}`}>
                <ThermometerSun size={16} className="opacity-70" /> {data.weather.feels_like || data.weather.temperature}°
              </span>
            </div>
            <div className="flex flex-col gap-1">
              <span className={`text-[10px] uppercase tracking-wider font-bold opacity-60 ${textSub}`}>濕度</span>
              <span className={`text-lg font-semibold flex items-center gap-1 ${textMain}`}>
                <Droplets size={16} className="opacity-70" /> {data.weather.humidity}
              </span>
            </div>
            <div className="flex flex-col gap-1">
              <span className={`text-[10px] uppercase tracking-wider font-bold opacity-60 ${textSub}`}>降雨</span>
              <span className={`text-lg font-semibold flex items-center gap-1 ${textMain}`}>
                <CloudRain size={16} className="opacity-70" /> {data.weather.precipitation}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* 穿搭提示 */}
      {data.outfit.tips && <div className={`p-6 rounded-3xl text-base leading-relaxed tracking-wide border ${isDarkMode ? 'bg-amber-900/20 border-amber-800/30 text-amber-100' : 'bg-amber-50 border-amber-100 text-amber-900'}`}>💡 {data.outfit.tips}</div>}

      {/* 單品卡片 */}
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
              <h4 className={`font-bold text-xl leading-tight mb-1 ${textMain}`}>{item.name}</h4>
              <p className={`text-sm ${textSub}`}>{item.material}</p>
            </div>
          );
        })}
      </div>

      {/* 配色 */}
      <div className={`rounded-[2rem] p-8 flex flex-col items-center text-center ${card}`}>
        <h3 className={`text-sm font-bold tracking-[0.2em] mb-6 uppercase ${textSub}`}>推薦配色</h3>
        <div className="flex gap-6">
          {colorPalette.map((c, i) => (
            <div key={i} className={`w-12 h-12 rounded-full shadow-xl transition-transform hover:scale-110 ${isDarkMode ? 'border-2 border-white/30' : 'border-2 border-gray-300'}`} style={{ backgroundColor: c.hex }} title={c.name} />
          ))}
        </div>
      </div>

      {/* 圖片 */}
      {data.generatedImages && data.generatedImages.length > 0 && (
        <div className="space-y-6 pt-2">
          <h3 className={`text-sm font-bold tracking-[0.2em] px-2 uppercase ${textSub}`}>穿搭靈感</h3>
          <div className="grid grid-cols-2 gap-4">
            <div className={`col-span-2 aspect-[16/9] rounded-[2rem] overflow-hidden shadow-lg ${isDarkMode ? 'border border-white/10' : 'border border-gray-100'}`}>
              <img src={data.generatedImages[0].src.large} alt="穿搭示意" className="w-full h-full object-cover" />
            </div>
            {data.generatedImages.slice(1, 3).map((img: any) => (
              <div key={img.id} className={`aspect-[4/3] rounded-[2rem] overflow-hidden shadow-lg ${isDarkMode ? 'border border-white/10' : 'border border-gray-100'}`}>
                <img src={img.src.medium} alt="細節" className="w-full h-full object-cover" />
              </div>
            ))}
          </div>
        </div>
      )}

      <button onClick={onRetry} className={`w-full py-6 rounded-[2rem] font-bold text-lg tracking-wide transition-all duration-300 border ${isDarkMode ? 'bg-slate-900 text-white border-white/15 hover:bg-black' : 'bg-slate-900 text-white border-slate-900 hover:bg-slate-800'}`}>重新生成</button>
    </div>
  );
};

export default ResultDisplay;
