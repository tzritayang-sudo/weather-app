import React, { useMemo } from 'react';
import { CloudRain, Shirt, Footprints, ShoppingBag, Umbrella, Glasses, Wind, Watch } from 'lucide-react';
import { WeatherOutfitResponse } from '../types';

const PantsIcon = ({ size = 24, color = "currentColor", ...props }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" {...props}>
    <path d="M6 4h12v3h-12z" /> <path d="M6 7v13a1 1 0 0 0 1 1h3a1 1 0 0 0 1-1v-8h2v8a1 1 0 0 0 1 1h3a1 1 0 0 0 1-1v-13" />
  </svg>
);

const getColorHex = (colorName: string): string => {
  const n = (colorName || '').toLowerCase();
  if (n.includes('black') || n.includes('黑')) return '#1a1a1a';
  if (n.includes('white') || n.includes('白')) return '#ffffff';
  if (n.includes('royal') || n.includes('寶石')) return '#2563eb';
  if (n.includes('pink') || n.includes('粉')) return '#f472b6';
  if (n.includes('red') || n.includes('紅')) return '#ef4444';
  if (n.includes('silver') || n.includes('銀')) return '#94a3b8';
  return '#64748b';
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
  const displayItems = useMemo(() => { if (!data?.outfit?.items) return []; return data.outfit.items.map((item: any) => ({ ...item, hexColor: getColorHex(item.color), IconComponent: getIcon(item.type, item.name) })); }, [data]);
  const colorPalette = useMemo(() => { if (!data?.outfit?.color_palette) return []; return data.outfit.color_palette.map((c: string) => ({ name: c, hex: getColorHex(c) })); }, [data]);

  const card = isDarkMode ? 'bg-slate-900/40 border border-white/10 backdrop-blur-xl' : 'bg-white border border-gray-100 shadow-[0_8px_30px_rgb(0,0,0,0.04)]';
  const weatherCell = isDarkMode ? 'bg-white/5 border border-white/5' : 'bg-gray-50 border border-gray-100';
  const itemCard = isDarkMode ? 'bg-white/5 border border-white/5 hover:bg-white/10' : 'bg-white border border-gray-100 hover:shadow-lg';
  const textMain = isDarkMode ? 'text-white' : 'text-gray-900';
  const textSub = isDarkMode ? 'text-slate-400' : 'text-gray-500';
  
  // 🔥 確保白色圓圈看得到：深色模式用白框，淺色模式用灰框
  const circleBg = isDarkMode ? 'bg-slate-800' : 'bg-gray-50';
  const circleBorder = isDarkMode ? 'border-2 border-white/30' : 'border-2 border-gray-300';

  if (loading) return <div className={`text-center p-10 ${textSub} tracking-widest text-xs animate-pulse`}>生成中...</div>;
  if (!data) return null;

  return (
    <div className="w-full max-w-md mx-auto space-y-6 pb-20 animate-fade-in-up">
      
      {/* 天氣卡片 */}
      <div className={`rounded-[2rem] p-8 ${card}`}>
        <div className="flex justify-between items-start mb-8">
          <div>
            <h2 className={`text-4xl font-light tracking-tight ${textMain}`}>{displayLocation}</h2>
            <p className={`${textSub} text-sm mt-2 tracking-wide font-medium`}>{data.weather.condition}</p>
          </div>
          <div className={`p-4 rounded-2xl ${isDarkMode ? 'bg-blue-500/20 text-blue-400' : 'bg-blue-50 text-blue-600'}`}><CloudRain className="w-8 h-8" /></div>
        </div>
        
        <div className="grid grid-cols-4 gap-3 mb-6">
          {[
            { l: '現在', v: `${data.weather.temperature}°`, c: isDarkMode ? 'text-white' : 'text-gray-900' },
            { l: '高/低', v: `${data.weather.maxtempC}°/${data.weather.mintempC}°`, c: textSub },
            { l: '濕度', v: data.weather.humidity, c: 'text-cyan-500' },
            { l: '降雨', v: data.weather.precipitation, c: 'text-blue-500' },
          ].map((item, i) => (
            <div key={i} className={`py-4 rounded-2xl flex flex-col items-center justify-center ${weatherCell}`}>
              <div className={`text-[10px] mb-1 uppercase tracking-wider font-bold opacity-60 ${textSub}`}>{item.l}</div>
              <div className={`text-lg font-medium ${item.c}`}>{item.v}</div>
            </div>
          ))}
        </div>
        {data.outfit.tips && <div className={`p-5 rounded-2xl text-sm leading-relaxed tracking-wide ${isDarkMode ? 'bg-amber-500/10 text-amber-100/90 border border-amber-500/20' : 'bg-amber-50 text-amber-900 border border-amber-100'}`}>{data.outfit.tips}</div>}
      </div>

      {/* 單品卡片 */}
      <div className="grid grid-cols-2 gap-4">
        {displayItems.map((item: any, i: number) => {
          const displayColor = (isDarkMode && (item.hexColor === '#0a0a0a' || item.hexColor === '#1a1a1a')) ? '#ffffff' : item.hexColor;
          
          return (
            <div key={i} className={`rounded-[2rem] p-6 flex flex-col items-center text-center relative min-h-[200px] justify-center transition-all duration-300 ${itemCard}`}>
              <div className="absolute top-0 left-1/2 -translate-x-1/2 w-12 h-1 rounded-b-full opacity-50" style={{ backgroundColor: displayColor }} />
              
              {/* 🔥 圓圈有明顯邊框 */}
              <div className={`mb-5 p-5 rounded-full shadow-sm ${circleBg} ${circleBorder}`}>
                <item.IconComponent size={36} style={{ color: displayColor }} strokeWidth={1.5} />
              </div>
              
              <span className={`text-[10px] px-3 py-1 rounded-full mb-3 tracking-wider border ${isDarkMode ? 'border-white/10 text-slate-400' : 'border-gray-200 text-gray-500'}`}>{item.color}</span>
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
            <div 
              key={i} 
              className={`w-10 h-10 rounded-full shadow-lg transition-transform hover:scale-110 ${isDarkMode ? 'border-2 border-white/30' : 'border-2 border-gray-300'}`} 
              style={{ backgroundColor: c.hex }} 
              title={c.name} 
            />
          ))}
        </div>
      </div>

      {/* 圖片 */}
      {data.generatedImages && data.generatedImages.length > 0 && (
        <div className="space-y-4 pt-4">
          <h3 className={`text-xs font-bold tracking-[0.2em] px-2 ${textSub}`}>穿搭靈感</h3>
          <div className="grid grid-cols-2 gap-4">
            <div className={`col-span-2 aspect-[16/9] rounded-[2rem] overflow-hidden ${card} p-1`}>
              <img src={data.generatedImages[0].src.large} alt="穿搭示意" className="w-full h-full object-cover rounded-[1.5rem]" />
            </div>
            {data.generatedImages.slice(1, 3).map((img: any) => (
              <div key={img.id} className={`aspect-[4/3] rounded-[2rem] overflow-hidden ${card} p-1`}>
                <img src={img.src.medium} alt="細節" className="w-full h-full object-cover rounded-[1.5rem]" />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 🔥 深色按鈕改成深灰色 */}
      <button onClick={onRetry} className={`w-full py-5 rounded-[2rem] font-medium text-lg transition-all duration-300 border ${isDarkMode ? 'bg-slate-900 text-white border-white/15 hover:bg-black' : 'bg-slate-900 text-white border-slate-900 hover:bg-slate-800'}`}>
        重新生成
      </button>
    </div>
  );
};

export default ResultDisplay;