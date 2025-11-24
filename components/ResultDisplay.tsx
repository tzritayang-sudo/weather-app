import React, { useMemo } from 'react';
import { CloudRain, Shirt, Footprints, ShoppingBag, Umbrella, Glasses, Wind, Watch } from 'lucide-react';
import { WeatherOutfitResponse } from '../types';

// 🔥 褲子圖示（兩條清晰褲管）
const PantsIcon = ({ size = 24, color = "currentColor", ...props }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
    <rect x="6" y="4" width="12" height="3" rx="1" /><path d="M7 7v13M17 7v13M7 20h3M14 20h3M10 7h4" />
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
  if (t.includes('jacket') || n.includes('外套')) return Wind;
  if (t.includes('bag') || n.includes('包')) return ShoppingBag;
  if (n.includes('傘')) return Umbrella;
  if (n.includes('鏡')) return Glasses;
  return Shirt;
};

interface Props { data: WeatherOutfitResponse; loading: boolean; onRetry: () => void; displayLocation: string; isDarkMode: boolean; }

const ResultDisplay: React.FC<Props> = ({ data, loading, onRetry, displayLocation, isDarkMode }) => {
  const displayItems = useMemo(() => { if (!data?.outfit?.items) return []; return data.outfit.items.map((item: any) => ({ ...item, hexColor: getColorHex(item.color), IconComponent: getIcon(item.type, item.name) })); }, [data]);
  const colorPalette = useMemo(() => { if (!data?.outfit?.color_palette) return []; return data.outfit.color_palette.map((c: string) => ({ name: c, hex: getColorHex(c) })); }, [data]);

  const card = isDarkMode ? 'bg-slate-800/90 border-slate-700 text-white' : 'bg-white border-slate-200 text-slate-900 shadow-lg';
  const weatherBg = isDarkMode ? 'bg-slate-700/40 border-slate-600/30' : 'bg-blue-50 border-blue-100';
  const itemBg = isDarkMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-200 shadow-sm';
  const textSub = isDarkMode ? 'text-slate-400' : 'text-slate-600';
  
  if (loading) return <div className={`text-center p-8 ${textSub}`}>AI 分析中...</div>;
  if (!data) return null;

  return (
    <div className="w-full max-w-md mx-auto space-y-6 pb-20">
      <div className={`rounded-3xl p-6 shadow-xl border ${card}`}>
        <div className="flex justify-between items-start mb-5">
          <div><h2 className="text-3xl font-bold">{displayLocation}</h2><p className={`${textSub} text-sm mt-1`}>{data.weather.condition}</p></div>
          <div className="p-3 bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl shadow-lg"><CloudRain className="w-7 h-7 text-white" /></div>
        </div>
        <div className="flex justify-between gap-2 mb-4">
          {[
            { l: '現在', v: `${data.weather.temperature}°`, c: isDarkMode ? 'text-yellow-300' : 'text-yellow-600' },
            { l: '高/低', v: `${data.weather.maxtempC}°/${data.weather.mintempC}°`, c: '' },
            { l: '濕度', v: data.weather.humidity, c: isDarkMode ? 'text-cyan-300' : 'text-cyan-600' },
            { l: '降雨', v: data.weather.precipitation, c: isDarkMode ? 'text-blue-300' : 'text-blue-600' },
          ].map((item, i) => <div key={i} className={`flex-1 p-2 rounded-xl border flex flex-col items-center ${weatherBg}`}><div className={`text-[10px] mb-1 ${textSub}`}>{item.l}</div><div className={`text-base font-bold whitespace-nowrap ${item.c}`}>{item.v}</div></div>)}
        </div>
        {data.outfit.tips && <div className={`p-3 rounded-xl text-sm ${isDarkMode ? 'bg-amber-500/10 border border-amber-500/20 text-amber-200' : 'bg-amber-50 border border-amber-200 text-amber-800'}`}>💡 {data.outfit.tips}</div>}
      </div>

      <div className="grid grid-cols-2 gap-4">
        {displayItems.map((item: any, i: number) => (
          <div key={i} className={`rounded-3xl p-5 border flex flex-col items-center text-center relative min-h-[160px] justify-center ${itemBg}`}>
            <div className="absolute top-0 left-0 w-full h-1 opacity-70" style={{ backgroundColor: item.hexColor }} />
            <div className={`mb-3 p-3 rounded-full shadow-lg ${isDarkMode ? 'bg-slate-900/80 border-2 border-white/20' : 'bg-slate-100 border-2 border-slate-300'}`}><item.IconComponent size={30} style={{ color: item.hexColor }} /></div>
            <span className={`text-[10px] px-2 py-0.5 rounded-full border ${isDarkMode ? 'bg-slate-900 text-slate-400 border-slate-700' : 'bg-slate-100 text-slate-600 border-slate-200'}`}>{item.color}</span>
            <h4 className="font-bold text-base mt-1">{item.name}</h4>
            <p className={`text-xs mt-1 ${textSub}`}>{item.material}</p>
          </div>
        ))}
      </div>

      <div className={`rounded-3xl p-5 border flex flex-col items-center ${card}`}>
        <h3 className={`text-xs font-bold uppercase tracking-wider mb-3 ${textSub}`}>推薦配色</h3>
        <div className="flex gap-3">{colorPalette.map((c, i) => <div key={i} className={`w-9 h-9 rounded-full shadow-lg ${isDarkMode ? 'border-2 border-white/30' : 'border-2 border-slate-300'}`} style={{ backgroundColor: c.hex }} />)}</div>
      </div>

      <button onClick={onRetry} className={`w-full py-4 rounded-2xl font-bold text-lg border shadow-lg transition ${isDarkMode ? 'bg-slate-800 text-slate-200 border-slate-700 hover:bg-slate-700' : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'}`}>↺ 返回重新生成</button>
    </div>
  );
};
export default ResultDisplay;