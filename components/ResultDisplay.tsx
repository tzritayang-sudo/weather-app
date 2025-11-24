import React, { useMemo } from 'react';
import { CloudRain, Sun, Shirt, Wind, Thermometer, Droplets, Umbrella, Glasses, ShoppingBag, Footprints, CloudFog } from 'lucide-react';
import { WeatherOutfitResponse, Style, Gender, TargetDay, TimeOfDay } from '../types';

const getColorHex = (colorName: string): string => {
  const name = colorName ? colorName.toLowerCase().trim() : '';
  if (name.includes('royal') || name.includes('寶石藍')) return '#2563EB';
  if (name.includes('electric') || name.includes('neon') || name.includes('螢光')) return '#06B6D4';
  if (name.includes('hot pink') || name.includes('fuchsia') || name.includes('桃紅') || name.includes('螢光粉')) return '#DB2777';
  if (name.includes('white') || name.includes('白')) return '#F8FAFC';
  if (name.includes('black') || name.includes('黑') || name.includes('navy') || name.includes('藏青')) return '#0F172A';
  if (name.includes('red') || name.includes('紅')) return '#DC2626';
  if (name.includes('blue') || name.includes('藍')) return '#3B82F6';
  if (name.includes('green') || name.includes('綠')) return '#22C55E';
  if (name.includes('yellow') || name.includes('黃')) return '#EAB308';
  if (name.includes('purple') || name.includes('紫')) return '#A855F7';
  return '#475569';
};

const getIconComponent = (itemName: string) => {
  const name = itemName ? itemName.toLowerCase() : '';
  if (name.includes('鞋') || name.includes('靴') || name.includes('shoe') || name.includes('boot')) return Footprints;
  if (name.includes('包') || name.includes('bag')) return ShoppingBag;
  if (name.includes('傘') || name.includes('umbrella')) return Umbrella;
  if (name.includes('鏡') || name.includes('glass')) return Glasses;
  if (name.includes('帽') || name.includes('hat')) return Sun;
  return Shirt;
};

const translateLocation = (loc: string) => {
  if (loc.includes('Taishan')) return '泰山';
  if (loc.includes('Xizhi')) return '汐止';
  if (loc.includes('Taipei')) return '台北';
  return loc;
};

interface ResultDisplayProps {
  data: WeatherOutfitResponse;
  loading: boolean;
  onRetry: () => void;
  userGender: Gender;
  userStyle: Style;
  targetDay: TargetDay;
  timeOfDay: TimeOfDay;
}

const ResultDisplay: React.FC<ResultDisplayProps> = ({ data, loading, onRetry, targetDay, timeOfDay }) => {
  const displayItems = useMemo(() => {
    if (!data?.outfit?.items) return [];
    return data.outfit.items.map(item => ({
      ...item,
      hexColor: getColorHex(item.color),
      IconComponent: getIconComponent(item.name)
    }));
  }, [data]);

  const colorPalette = useMemo(() => {
    if (!data?.outfit?.color_palette) return [];
    return data.outfit.color_palette.map(colorName => ({
      name: colorName,
      hex: getColorHex(colorName)
    }));
  }, [data]);

  const timeLabel = targetDay === 'today' ? '今天' : '明天';
  const periodLabel = timeOfDay === 'current' ? '現在' : timeOfDay === 'morning' ? '早上' : timeOfDay === 'afternoon' ? '下午' : '晚上';

  if (loading) return <div className="text-center text-slate-300 p-8">AI 分析中...</div>;
  if (!data) return null;

  return (
    <div className="w-full max-w-md mx-auto space-y-6 pb-20 animate-fade-in">
      <div className="bg-slate-800/80 backdrop-blur-md rounded-3xl p-6 shadow-xl border border-slate-700 text-white relative overflow-hidden">
        <div className="relative z-10">
          <div className="flex justify-between items-start mb-6">
            <div>
              <div className="inline-flex items-center px-3 py-1 rounded-full bg-slate-700/50 border border-slate-600 text-xs font-medium text-blue-300 mb-2">
                <span className="w-2 h-2 rounded-full bg-blue-400 mr-2 animate-pulse"></span>
                SELECTED TIME
              </div>
              <h2 className="text-3xl font-bold tracking-tight text-white">{translateLocation(data.weather.location.split(',')[0])}</h2>
              <p className="text-slate-400 text-sm mt-1">{timeLabel} {periodLabel} • {data.weather.condition}</p>
            </div>
            <div className="p-3 bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl shadow-lg"><CloudRain className="w-8 h-8 text-white" /></div>
          </div>
          <div className="grid grid-cols-3 gap-4 mb-6">
            <div className="text-center p-3 rounded-2xl bg-slate-700/30 border border-slate-700/50"><Thermometer className="mx-auto mb-2 text-blue-300" size={20} /><div className="text-2xl font-bold">{data.weather.temperature}°C</div><div className="text-xs text-slate-400">氣溫</div></div>
            <div className="text-center p-3 rounded-2xl bg-slate-700/30 border border-slate-700/50"><Wind className="mx-auto mb-2 text-purple-300" size={20} /><div className="text-2xl font-bold">{data.weather.feels_like}°C</div><div className="text-xs text-slate-400">體感</div></div>
            {/* 🔥 濕度顯示：如果 data.weather.humidity 有值就顯示，否則顯示 precipitation */}
            <div className="text-center p-3 rounded-2xl bg-slate-700/30 border border-slate-700/50">
                <CloudFog className="mx-auto mb-2 text-cyan-300" size={20} />
                <div className="text-2xl font-bold">{data.weather.humidity || data.weather.precipitation}</div>
                <div className="text-xs text-slate-400">濕度</div>
            </div>
          </div>
          {data.outfit.tips && <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-200 text-sm">💡 {data.outfit.tips}</div>}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        {displayItems.map((item, index) => (
          <div key={index} className="bg-slate-800 rounded-2xl p-4 border border-slate-700 flex flex-col items-center text-center relative overflow-hidden shadow-sm min-h-[140px] justify-center">
            <div className="absolute top-0 left-0 w-full h-1 opacity-70" style={{ backgroundColor: item.hexColor }} />
            <div className="mb-3 p-3 rounded-full bg-slate-900/80 ring-1 ring-white/10"><item.IconComponent size={32} color={item.hexColor} /></div>
            <div className="w-full flex flex-col gap-1">
                <span className="text-[10px] px-2 py-0.5 rounded bg-slate-900 text-slate-400 self-center border border-slate-700/50">{item.color}</span>
                <h4 className="text-white font-medium text-sm leading-tight mt-1">{item.name}</h4>
                <p className="text-[11px] text-slate-500 mt-1 leading-relaxed line-clamp-1">{item.material}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="bg-slate-800/50 backdrop-blur-sm rounded-2xl p-5 border border-slate-700/50 flex flex-col items-center">
        <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">推薦配色 Palette</h3>
        <div className="flex items-center gap-3">
          {colorPalette.map((color, idx) => (
            <div key={idx} className="w-8 h-8 rounded-full border-2 border-white/10 shadow-lg" style={{ backgroundColor: color.hex }} title={color.name || 'Color'} />
          ))}
        </div>
        <div className="flex gap-2 mt-2 text-[10px] text-slate-500">
            {colorPalette.slice(0, 4).map((c, i) => <span key={i}>{c.name}</span>)}
        </div>
      </div>

      {data.generatedImages && data.generatedImages.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider px-1">穿搭靈感</h3>
          <div className="grid grid-cols-2 gap-3">
            <div className="col-span-2 aspect-[16/9] rounded-2xl overflow-hidden border border-slate-700 relative">
              <img src={data.generatedImages[0].src.large} alt="Outfit" className="w-full h-full object-cover" />
            </div>
            {data.generatedImages.slice(1, 3).map((img, idx) => (
              <div key={idx} className="aspect-[4/3] rounded-2xl overflow-hidden border border-slate-700">
                <img src={img.src.medium} alt="Outfit detail" className="w-full h-full object-cover" />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 🔥 按鈕樣式優化：立體感 + 明確外框 */}
      <button 
        onClick={onRetry} 
        className="w-full py-4 bg-slate-800 text-slate-200 font-bold text-base rounded-2xl border-b-4 border-slate-950 shadow-lg active:border-b-0 active:translate-y-1 transition-all flex items-center justify-center gap-2 hover:bg-slate-700 hover:text-white"
      >
        <span>↺</span> 返回並重新生成
      </button>
    </div>
  );
};

export default ResultDisplay;