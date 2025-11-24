import React, { useMemo } from 'react';
import { CloudRain, Shirt, Footprints, ShoppingBag, Umbrella, Glasses, Wind, Watch } from 'lucide-react';
import { WeatherOutfitResponse } from '../types';

// 🔥 褲子圖示 (保持您的最愛)
const PantsIcon = ({ size = 24, color = "currentColor", ...props }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
    <path d="M6 4h12v3h-12z" /> <path d="M6 7v13a1 1 0 0 0 1 1h3a1 1 0 0 0 1-1v-8h2v8a1 1 0 0 0 1 1h3a1 1 0 0 0 1-1v-13" />
  </svg>
);

const getColorHex = (colorName: string): string => {
  const n = (colorName || '').toLowerCase();
  if (n.includes('black') || n.includes('黑')) return '#0f172a';
  if (n.includes('white') || n.includes('白')) return '#ffffff';
  if (n.includes('royal') || n.includes('寶石')) return '#1e40af';
  if (n.includes('pink') || n.includes('粉')) return '#ec4899';
  if (n.includes('red') || n.includes('紅')) return '#dc2626';
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

  // 🔥 極簡配色邏輯 (移除 shadow，改用 border)
  const card = isDarkMode ? 'bg-slate-800/40 border border-slate-700' : 'bg-white border border-slate-200';
  const weatherBg = isDarkMode ? 'bg-slate-800/60 border border-slate-700' : 'bg-slate-50 border border-slate-100';
  const itemBg = isDarkMode ? 'bg-slate-800/40 border border-slate-700' : 'bg-white border border-slate-200';
  const textSub = isDarkMode ? 'text-slate-400' : 'text-slate-500';
  
  // 🔥 顏色圈圈優化：
  // 淺色模式下用 slate-100 做底，深色用 slate-700 做底，對比度更好
  const circleBg = isDarkMode ? 'bg-slate-700' : 'bg-slate-100';
  // 外框線條：深色模式用深灰框，淺色模式用淺灰框，避免白色融化
  const iconRing = isDarkMode ? 'border-4 border-slate-600' : 'border-4 border-white';

  if (loading) return <div className={`text-center p-8 ${textSub}`}>AI 分析中...</div>;
  if (!data) return null;

  return (
    <div className="w-full max-w-md mx-auto space-y-5 pb-20">
      
      {/* 天氣卡片 */}
      <div className={`rounded-3xl p-6 ${card}`}>
        <div className="flex justify-between items-start mb-5">
          <div><h2 className="text-3xl font-bold tracking-tight">{displayLocation}</h2><p className={`${textSub} text-sm mt-1`}>{data.weather.condition}</p></div>
          <div className="p-3 bg-blue-500/10 rounded-2xl"><CloudRain className="w-7 h-7 text-blue-500" /></div>
        </div>
        <div className="flex justify-between gap-2 mb-4">
          {[
            { l: '現在', v: `${data.weather.temperature}°`, c: isDarkMode ? 'text-yellow-300' : 'text-yellow-600' },
            { l: '高/低', v: `${data.weather.maxtempC}°/${data.weather.mintempC}°`, c: '' },
            { l: '濕度', v: data.weather.humidity, c: isDarkMode ? 'text-cyan-300' : 'text-cyan-600' },
            { l: '降雨', v: data.weather.precipitation, c: isDarkMode ? 'text-blue-300' : 'text-blue-600' },
          ].map((item, i) => <div key={i} className={`flex-1 p-3 rounded-2xl flex flex-col items-center justify-center ${weatherBg}`}><div className={`text-[10px] mb-1 uppercase tracking-wider ${textSub}`}>{item.l}</div><div className={`text-lg font-bold whitespace-nowrap ${item.c}`}>{item.v}</div></div>)}
        </div>
        {data.outfit.tips && <div className={`p-4 rounded-2xl text-sm leading-relaxed ${isDarkMode ? 'bg-amber-500/10 text-amber-200' : 'bg-amber-50 text-amber-800'}`}>💡 {data.outfit.tips}</div>}
      </div>

      {/* 單品卡片 */}
      <div className="grid grid-cols-2 gap-3">
        {displayItems.map((item: any, i: number) => (
          <div key={i} className={`rounded-3xl p-6 flex flex-col items-center text-center relative min-h-[180px] justify-center ${itemBg}`}>
            <div className="absolute top-0 left-0 w-full h-1 opacity-60" style={{ backgroundColor: item.hexColor }} />
            
            {/* 🔥 圖示圓圈修正 */}
            <div className={`mb-4 p-4 rounded-full ${circleBg} ${iconRing}`}>
              <item.IconComponent size={32} style={{ color: item.hexColor }} />
            </div>
            
            <span className={`text-[10px] px-2.5 py-1 rounded-full mb-2 border ${isDarkMode ? 'bg-slate-800 border-slate-700 text-slate-300' : 'bg-white border-slate-200 text-slate-600'}`}>{item.color}</span>
            <h4 className="font-bold text-lg leading-tight">{item.name}</h4>
            <p className={`text-xs mt-1 ${textSub}`}>{item.material}</p>
          </div>
        ))}
      </div>

      {/* 穿搭靈感圖片 */}
      {data.generatedImages && data.generatedImages.length > 0 && (
        <div className="space-y-3">
          <h3 className={`text-xs font-bold uppercase tracking-wider px-1 ${textSub}`}>穿搭靈感</h3>
          <div className="grid grid-cols-2 gap-3">
            <div className={`col-span-2 aspect-[16/9] rounded-3xl overflow-hidden ${card}`}>
              <img src={data.generatedImages[0].src.large} alt="Outfit" className="w-full h-full object-cover" />
            </div>
            {data.generatedImages.slice(1, 3).map((img: any) => (
              <div key={img.id} className={`aspect-[4/3] rounded-3xl overflow-hidden ${card}`}>
                <img src={img.src.medium} alt="Detail" className="w-full h-full object-cover" />
              </div>
            ))}
          </div>
        </div>
      )}

      <button onClick={onRetry} className={`w-full py-4 rounded-2xl font-bold text-lg transition-colors border ${isDarkMode ? 'bg-slate-800 text-white border-slate-700 hover:bg-slate-700' : 'bg-white text-slate-800 border-slate-300 hover:bg-slate-50'}`}>↺ 重新生成</button>
    </div>
  );
};
export default ResultDisplay;