import React, { useMemo } from 'react';
import {
  CloudRain,
  Shirt,
  Footprints,
  ShoppingBag,
  Umbrella,
  Glasses,
  Wind
} from 'lucide-react';
import { WeatherOutfitResponse, Style, Gender, TargetDay, TimeOfDay } from '../types';

const getColorHex = (colorName: string): string => {
  const name = colorName ? colorName.toLowerCase().trim() : '';
  if (name.includes('royal') || name.includes('寶石藍')) return '#1e40af';
  if (name.includes('electric') || name.includes('螢光藍')) return '#06b6d4';
  if (name.includes('black') || name.includes('黑')) return '#000000';
  if (name.includes('white') || name.includes('白')) return '#ffffff';
  if (name.includes('hot pink') || name.includes('螢光粉') || name.includes('fuchsia')) return '#ec4899';
  if (name.includes('red') || name.includes('紅')) return '#dc2626';
  if (name.includes('silver') || name.includes('銀')) return '#94a3b8';
  if (name.includes('gray') || name.includes('grey') || name.includes('灰')) return '#64748b';
  if (name.includes('green') || name.includes('綠')) return '#22c55e';
  if (name.includes('yellow') || name.includes('黃')) return '#eab308';
  if (name.includes('purple') || name.includes('紫')) return '#a855f7';
  return '#64748b';
};

// 混合判斷圖示：先看 type，再看 name
const getIconComponent = (type: string | undefined, name: string | undefined) => {
  const t = (type || '').toLowerCase();
  const n = (name || '').toLowerCase();

  if (t.includes('shoes') || n.includes('鞋') || n.includes('靴')) return Footprints;
  if (t.includes('bag') || n.includes('包')) return ShoppingBag;
  if (t.includes('umbrella') || n.includes('傘')) return Umbrella;
  if (t.includes('accessory') || n.includes('鏡') || n.includes('帽')) return Glasses;
  if (t.includes('jacket') || n.includes('外套')) return Wind;

  // 下身褲子：沒有專用 icon，只能用風格化替代，這裡仍先用 Shirt 但顏色區分
  if (t.includes('pants') || n.includes('褲')) return Wind;

  return Shirt;
};

const translateLocation = (displayLocation: string, apiLocation: string) => {
  if (displayLocation && displayLocation.trim().length > 0) return displayLocation;
  if (apiLocation.includes('Taishan')) return '泰山';
  if (apiLocation.includes('Xizhi')) return '汐止';
  if (apiLocation.includes('Taipei')) return '台北';
  return apiLocation;
};

interface ResultDisplayProps {
  data: WeatherOutfitResponse;
  loading: boolean;
  onRetry: () => void;
  userGender: Gender;
  userStyle: Style;
  targetDay: TargetDay;
  timeOfDay: TimeOfDay;
  displayLocation: string;
}

const ResultDisplay: React.FC<ResultDisplayProps> = ({
  data,
  loading,
  onRetry,
  targetDay,
  timeOfDay,
  displayLocation
}) => {
  const displayItems = useMemo(() => {
    if (!data?.outfit?.items) return [];
    return data.outfit.items.map((item: any) => ({
      ...item,
      hexColor: getColorHex(item.color),
      IconComponent: getIconComponent(item.type, item.name)
    }));
  }, [data]);

  const colorPalette = useMemo(() => {
    if (!data?.outfit?.color_palette) return [];
    return data.outfit.color_palette.map((colorName: string) => ({
      name: colorName,
      hex: getColorHex(colorName)
    }));
  }, [data]);

  const timeLabel = targetDay === 'today' ? '今天' : '明天';
  const periodLabel =
    timeOfDay === 'current'
      ? '現在'
      : timeOfDay === 'morning'
      ? '早上'
      : timeOfDay === 'afternoon'
      ? '下午'
      : '晚上';

  if (loading) return <div className="text-center text-slate-300 p-8">AI 分析中...</div>;
  if (!data) return null;

  const shownLocation = translateLocation(displayLocation, data.weather.location || '');

  return (
    <div className="w-full max-w-md mx-auto space-y-6 pb-20 animate-fade-in">
      {/* 天氣卡片 */}
      <div className="bg-slate-800/90 backdrop-blur-md rounded-3xl p-5 shadow-xl border border-slate-700 text-white relative overflow-hidden">
        <div className="relative z-10">
          <div className="flex justify-between items-start mb-4">
            <div>
              <h2 className="text-2xl font-bold tracking-tight text-white">{shownLocation}</h2>
              <p className="text-slate-400 text-xs mt-1">
                {timeLabel} {periodLabel} • {data.weather.condition}
              </p>
            </div>
            <div className="p-2 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl shadow-lg">
              <CloudRain className="w-6 h-6 text-white" />
            </div>
          </div>

          <div className="grid grid-cols-4 gap-2 text-center mb-4">
            <div className="bg-slate-700/40 p-2 rounded-xl border border-slate-600/30">
              <div className="text-[10px] text-slate-400 mb-1">現在</div>
              <div className="text-lg font-bold text-yellow-300">{data.weather.temperature}°</div>
            </div>
            <div className="bg-slate-700/40 p-2 rounded-xl border border-slate-600/30">
              <div className="text-[10px] text-slate-400 mb-1">高/低</div>
              <div className="text-xs font-bold mt-1">
                {data.weather.maxtempC}°/{data.weather.mintempC}°
              </div>
            </div>
            <div className="bg-slate-700/40 p-2 rounded-xl border border-slate-600/30">
              <div className="text-[10px] text-slate-400 mb-1">濕度</div>
              <div className="text-lg font-bold text-cyan-300">{data.weather.humidity}</div>
            </div>
            <div className="bg-slate-700/40 p-2 rounded-xl border border-slate-600/30">
              <div className="text-[10px] text-slate-400 mb-1">降雨</div>
              <div className="text-lg font-bold text-blue-300">{data.weather.precipitation}</div>
            </div>
          </div>

          {data.outfit.tips && (
            <div className="mt-2 p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-200 text-xs leading-relaxed">
              💡 {data.outfit.tips}
            </div>
          )}
        </div>
      </div>

      {/* 單品卡片 */}
      <div className="grid grid-cols-2 gap-3">
        {displayItems.map((item: any, index: number) => (
          <div
            key={index}
            className="bg-slate-800 rounded-2xl p-4 border border-slate-700 flex flex-col items-center text-center relative overflow-hidden shadow-sm min-h-[140px] justify-center"
          >
            <div
              className="absolute top-0 left-0 w-full h-1 opacity-70"
              style={{ backgroundColor: item.hexColor }}
            />
            <div className="mb-3 p-3 rounded-full bg-slate-900/80 ring-1 ring-white/10">
              <item.IconComponent size={28} style={{ color: item.hexColor }} />
            </div>
            <div className="w-full flex flex-col gap-1">
              <span className="text-[10px] px-2 py-0.5 rounded bg-slate-900 text-slate-400 self-center border border-slate-700/50">
                {item.color}
              </span>
              <h4 className="text-white font-medium text-sm leading-tight mt-1">{item.name}</h4>
              <p className="text-[11px] text-slate-500 mt-1 leading-relaxed line-clamp-1">
                {item.material}
              </p>
            </div>
          </div>
        ))}
      </div>

      {/* 色票 */}
      <div className="bg-slate-800/50 backdrop-blur-sm rounded-2xl p-5 border border-slate-700/50 flex flex-col items-center">
        <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">
          推薦配色 Palette
        </h3>
        <div className="flex items-center gap-3">
          {colorPalette.map((color, idx) => (
            <div
              key={idx}
              className="w-8 h-8 rounded-full border-2 border-white/10 shadow-lg"
              style={{ backgroundColor: color.hex }}
              title={color.name || 'Color'}
            />
          ))}
        </div>
        <div className="flex gap-2 mt-2 text-[10px] text-slate-500">
          {colorPalette.slice(0, 4).map((c, i) => (
            <span key={i}>{c.name}</span>
          ))}
        </div>
      </div>

      {/* 穿搭圖片 */}
      {data.generatedImages && data.generatedImages.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider px-1">穿搭靈感</h3>
          <div className="grid grid-cols-2 gap-3">
            <div className="col-span-2 aspect-[16/9] rounded-2xl overflow-hidden border border-slate-700 relative">
              <img src={data.generatedImages[0].src.large} alt="Outfit" className="w-full h-full object-cover" />
            </div>
            {data.generatedImages.slice(1, 3).map((img: any, idx: number) => (
              <div key={idx} className="aspect-[4/3] rounded-2xl overflow-hidden border border-slate-700">
                <img src={img.src.medium} alt="Outfit detail" className="w-full h-full object-cover" />
              </div>
            ))}
          </div>
        </div>
      )}

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