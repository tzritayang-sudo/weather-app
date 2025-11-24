import React, { useMemo } from 'react';
import { CloudRain, Shirt, Footprints, ShoppingBag, Umbrella, Glasses, Wind, Watch } from 'lucide-react';
import { WeatherOutfitResponse } from '../types';

// 簡約版褲子（無橫線）
const PantsIcon = ({ size = 24, color = "currentColor", ...props }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" {...props}>
    <path d="M6 4h12v3h-12z" /> <path d="M6 7v13a1 1 0 0 0 1 1h3a1 1 0 0 0 1-1v-8h2v8a1 1 0 0 0 1 1h3a1 1 0 0 0 1-1v-13" />
  </svg>
);

const getColorHex = (colorName: string): string => {
  if (!colorName) return '#cbd5e1';
  const n = colorName.toLowerCase();
  
  // 黑白灰
  if (n.includes('black') || n.includes('黑')) return '#1a1a1a';
  if (n.includes('white') || n.includes('白')) return '#ffffff';
  if (n.includes('light gray') || n.includes('淺灰')) return '#e5e7eb';
  if (n.includes('grey') || n.includes('gray') || n.includes('灰')) return '#9ca3af';
  if (n.includes('charcoal') || n.includes('炭')) return '#374151';
  if (n.includes('silver') || n.includes('銀')) return '#cbd5e1';

  // 藍色系
  if (n.includes('navy') || n.includes('藏青')) return '#172554';
  if (n.includes('royal') || n.includes('寶石')) return '#2563eb';
  if (n.includes('light blue') || n.includes('淺藍') || n.includes('水藍') || n.includes('淡藍')) return '#bae6fd';
  if (n.includes('sky') || n.includes('天藍')) return '#7dd3fc';
  if (n.includes('teal') || n.includes('藍綠') || n.includes('湖水')) return '#14b8a6';
  if (n.includes('indigo') || n.includes('靛') || n.includes('紫藍')) return '#4f46e5';
  if (n.includes('blue') || n.includes('藍')) return '#3b82f6';

  // 紅粉系
  if (n.includes('burgundy') || n.includes('酒紅')) return '#881337';
  if (n.includes('red') || n.includes('紅')) return '#ef4444';
  if (n.includes('pink') || n.includes('粉') || n.includes('桃')) return '#f472b6';
  if (n.includes('rose') || n.includes('玫瑰')) return '#e11d48';
  if (n.includes('coral') || n.includes('珊瑚')) return '#fb7185';

  // 大地
  if (n.includes('brown') || n.includes('褐') || n.includes('棕')) return '#713f12';
  if (n.includes('camel') || n.includes('駝') || n.includes('焦糖')) return '#d97706';
  if (n.includes('beige') || n.includes('米') || n.includes('杏')) return '#fef3c7';
  if (n.includes('khaki') || n.includes('卡其')) return '#d6d3d1';
  if (n.includes('cream') || n.includes('奶油')) return '#fffbeb';

  // 綠色
  if (n.includes('olive') || n.includes('橄欖')) return '#3f6212';
  if (n.includes('mint') || n.includes('薄荷')) return '#a7f3d0';
  if (n.includes('green') || n.includes('綠')) return '#22c55e';

  // 黃紫
  if (n.includes('yellow') || n.includes('黃')) return '#facc15';
  if (n.includes('orange') || n.includes('橘') || n.includes('橙')) return '#f97316';
  if (n.includes('purple') || n.includes('紫')) return '#a855f7';
  if (n.includes('lavender') || n.includes('薰衣草')) return '#e9d5ff';

  return '#94a3b8'; // 預設
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
  // 🔥 防呆保護：萬一 data 是 null 或結構不對，直接不渲染或給空陣列
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

  if (loading) return <div className="text-center p-10 text-slate-400 tracking-widest text-xs animate-pulse">生成中...</div>;
  if (!data || !data.weather) return <div className="text-center p-10 text-red-400">資料載入錯誤，請重試</div>;

  // 樣式變數
  const card = isDarkMode ? 'bg-slate-900/40 border border-white/10 backdrop-blur-xl' : 'bg-white border border-gray-100 shadow-[0_8px_30px_rgb(0,0,0,0.04)]';
  const weatherCell = isDarkMode ? 'bg-white/5 border border-white/5' : 'bg-gray-50 border border-gray-100';
  const itemCard = isDarkMode ? 'bg-white/5 border border-white/5 hover:bg-white/10' : 'bg-white border border-gray-100 hover:shadow-lg';
  const textMain = isDarkMode ? 'text-white' : 'text-gray-900';
  const textSub = isDarkMode ? 'text-slate-400' : 'text-gray-500';
  const circleBg = isDarkMode ? 'bg-slate-800' : 'bg-gray-50';
  const circleBorder = isDarkMode ? 'border-2 border-white/30' : 'border-2 border-gray-300';

  // 時間標題
  const timeLabel = data.targetDay === 'tomorrow' ? '明天' : '現在';

  return (
    <div className="w-full max-w-md mx-auto space-y-6 pb-20 animate-fade-in-up">
      
      {/* 天氣卡片 */}
      <div className={`rounded-[2rem] p-8 ${card}`}>
        <div className="flex justify-between items-start mb-8">
          <div>
            <h2 className={`text-4xl font-light tracking-tight ${textMain}`}>{displayLocation}</h2>
            <p className={`${textSub} text-sm mt-2 tracking-wide font-medium`}>{data.weather.condition || '多雲'}</p>
          </div>
          <div className={`p-4 rounded-2xl ${isDarkMode ? 'bg-blue-500/20 text-blue-400' : 'bg-blue-50 text-blue-600'}`}>
            <CloudRain className="w-8 h-8" />
          </div>
        </div>
        
        <div className="grid grid-cols-2 gap-3 mb-6">
          {[
            { label: timeLabel, value: `${data.weather.temperature}°`, cls: isDarkMode ? 'text-white' : 'text-gray-900' },
            { label: '高 / 低', value: `${data.weather.maxtempC}° / ${data.weather.mintempC}°`, cls: textSub },
            { label: '濕度', value: data.weather.humidity || '--', cls: 'text-cyan-500' },
            { label: '降雨', value: data.weather.precipitation || '--', cls: 'text-blue-500' },
          ].map((item, i) => (
            <div key={i} className={`py-4 px-4 rounded-2xl flex flex-col items-start justify-center ${weatherCell}`}>
              <div className={`text-[11px] mb-1 tracking-wider ${textSub}`}>{item.label}</div>
              <div className={`text-2xl font-semibold ${item.cls}`}>{item.value}</div>
            </div>
          ))}
        </div>
        
        {data.outfit?.tips && (
          <div className={`p-5 rounded-2xl text-sm leading-relaxed tracking-wide ${isDarkMode ? 'bg-amber-500/10 text-amber-100/90 border border-amber-500/20' : 'bg-amber-50 text-amber-900 border border-amber-100'}`}>
            {data.outfit.tips}
          </div>
        )}
      </div>

      {/* 單品卡片 */}
      <div className="grid grid-cols-2 gap-4">
        {displayItems.map((item: any, i: number) => {
          const isBlack = item.hexColor === '#1a1a1a';
          const isWhite = item.hexColor === '#ffffff';

          // 白色淺色模式 -> 用深底 (slate-400)
          const iconColor = (isDarkMode && isBlack) || (!isDarkMode && isWhite) ? '#ffffff' : item.hexColor;
          const circleBgDynamic = !isDarkMode && isWhite ? 'bg-slate-400' : isDarkMode && isBlack ? 'bg-slate-700' : circleBg;

          return (
            <div key={i} className={`rounded-[2rem] p-6 flex flex-col items-center text-center relative min-h-[200px] justify-center transition-all duration-300 ${itemCard}`}>
              <div className="absolute top-0 left-1/2 -translate-x-1/2 w-12 h-1 rounded-b-full opacity-50" style={{ backgroundColor: item.hexColor }} />
              <div className={`mb-5 p-5 rounded-full shadow-sm ${circleBgDynamic} ${circleBorder}`}>
                <item.IconComponent size={36} style={{ color: iconColor }} strokeWidth={1.5} />
              </div>
              <span className={`text-[10px] px-3 py-1 rounded-full mb-3 tracking-wider border ${isDarkMode ? 'border-white/10 text-slate-400' : 'border-gray-200 text-gray-500'}`}>
                {item.color}
              </span>
              <h4 className={`font-medium text-lg leading-tight mb-1 ${textMain}`}>{item.name}</h4>
              <p className={`text-xs ${textSub}`}>{item.material}</p>
            </div>
          );
        })}
      </div>

      {/* 配色 */}
      <div className={`rounded-[2rem] p-6 flex flex-col items-center ${card}`}>
        <h3 className={`text-xs font-bold tracking-[0.2em] mb-5 ${textSub}`}>推薦配色</h3>
        <div className="flex gap-4">
          {colorPalette.map((c, i) => (
            <div key={i} className={`w-10 h-10 rounded-full shadow-lg transition-transform hover:scale-110 ${isDarkMode ? 'border-2 border-white/30' : 'border-2 border-gray-300'}`} style={{ backgroundColor: c.hex }} />
          ))}
        </div>
      </div>

      {/* 圖片 */}
      {data.generatedImages && data.generatedImages.length > 0 && (
        <div className="space-y-4 pt-4">
          <h3 className={`text-xs font-bold tracking-[0.2em] px-2 ${textSub}`}>穿搭靈感</h3>
          <div className="grid grid-cols-2 gap-4">
            <div className={`col-span-2 aspect-[16/9] rounded-[2rem] overflow-hidden ${card} p-1`}>
              <img src={data.generatedImages[0].src.large} alt="Outfits" className="w-full h-full object-cover rounded-[1.5rem]" />
            </div>
            {data.generatedImages.slice(1, 3).map((img: any) => (
              <div key={img.id} className={`aspect-[4/3] rounded-[2rem] overflow-hidden ${card} p-1`}>
                <img src={img.src.medium} alt="Details" className="w-full h-full object-cover rounded-[1.5rem]" />
              </div>
            ))}
          </div>
        </div>
      )}

      <button onClick={onRetry} className={`w-full py-5 rounded-[2rem] font-medium text-lg transition-all duration-300 border ${isDarkMode ? 'bg-slate-900 text-white border-white/15 hover:bg-black' : 'bg-slate-900 text-white border-slate-900 hover:bg-slate-800'}`}>
        重新生成
      </button>
    </div>
  );
};

export default ResultDisplay;