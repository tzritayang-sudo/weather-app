import React, { useMemo } from 'react';
import { 
  CloudRainIcon, SunIcon, TShirtIcon, ShirtIcon, HoodieIcon, SweaterIcon, JacketIcon, CoatIcon, 
  PantsIcon, ShortsIcon, SkirtIcon, DressIcon, SneakerIcon, BootIcon, FormalShoeIcon, SandalsIcon, 
  BagIcon, GlassesIcon, WatchIcon, GenericClothingIcon, UmbrellaIcon, HatIcon, ScarfIcon
} from './Icons';
import { WeatherOutfitResponse } from '../types';

interface ResultDisplayProps {
  data: WeatherOutfitResponse;
}

// 🔥 色彩名稱轉 Hex 的輔助函式 (解決色票變黑問題)
const getColorHex = (colorName: string) => {
  const lower = colorName.toLowerCase();
  if (lower.includes('electric blue')) return '#00FFFF';
  if (lower.includes('hot pink')) return '#FF69B4';
  if (lower.includes('icy grey') || lower.includes('ice grey')) return '#E0E5E5';
  if (lower.includes('emerald')) return '#50C878';
  if (lower.includes('royal blue')) return '#4169E1';
  if (lower.includes('mustard')) return '#FFDB58';
  if (lower.includes('rust')) return '#B7410E';
  if (lower.includes('sage')) return '#9DC183';
  if (lower.includes('charcoal')) return '#36454F';
  if (lower.includes('navy')) return '#000080';
  // 如果不是特殊色，就直接回傳原字串 (讓瀏覽器自己猜)
  return colorName;
};

const renderIcon = (iconKey: string) => {
  const props = { className: "w-full h-full" };
  switch (iconKey.toLowerCase()) {
    case 't-shirt': return <TShirtIcon {...props} className="text-sky-500" />;
    case 'shirt': return <ShirtIcon {...props} className="text-indigo-400" />;
    case 'polo': return <ShirtIcon {...props} className="text-cyan-500" />;
    case 'sweater': return <SweaterIcon {...props} className="text-orange-400" />;
    case 'hoodie': return <HoodieIcon {...props} className="text-violet-400" />;
    case 'jacket': return <JacketIcon {...props} className="text-slate-400" />;
    case 'coat': return <CoatIcon {...props} className="text-stone-400" />;
    case 'pants': return <PantsIcon {...props} className="text-slate-400" />;
    case 'shorts': return <ShortsIcon {...props} className="text-amber-500" />;
    case 'skirt': return <SkirtIcon {...props} className="text-rose-400" />;
    case 'dress': return <DressIcon {...props} className="text-rose-500" />;
    case 'sneakers': return <SneakerIcon {...props} className="text-emerald-400" />;
    case 'boots': return <BootIcon {...props} className="text-stone-500" />;
    case 'formal': case 'formal-shoes': return <FormalShoeIcon {...props} className="text-slate-300" />;
    case 'sandals': case 'heels': return <SandalsIcon {...props} className="text-red-400" />;
    case 'bag': return <BagIcon {...props} className="text-amber-600" />;
    case 'umbrella': return <UmbrellaIcon {...props} className="text-blue-400" />;
    case 'hat': return <HatIcon {...props} className="text-orange-500" />;
    case 'scarf': return <ScarfIcon {...props} className="text-purple-400" />;
    default: return <GenericClothingIcon {...props} className="text-gray-400" />;
  }
};

const ResultDisplay: React.FC<ResultDisplayProps> = ({ data }) => {
  const WeatherIcon = useMemo(() => {
    const desc = data.weather.description.toLowerCase();
    const rainProbStr = String(data.weather.rainProb || '0');
    const rainProb = parseInt(rainProbStr.replace('%', '')) || 0;
    if (desc.includes('雨') || desc.includes('rain') || rainProb > 40) {
      return <CloudRainIcon className="w-20 h-20 md:w-24 md:h-24 text-blue-400 drop-shadow-2xl" />;
    }
    return <SunIcon className="w-20 h-20 md:w-24 md:h-24 text-amber-400 drop-shadow-2xl" />;
  }, [data.weather]);

  const getStyleLabel = (index: number) => {
    const labels = ["✨ 推薦搭配", "🔥 混搭靈感", "🌿 氛圍參考"];
    return labels[index] || `Style ${index + 1}`;
  };

  return (
    <div className="space-y-6 animate-fade-in pb-12">
      
      {/* 1. 天氣卡片 */}
      <div className="bg-white dark:bg-slate-900 rounded-[2rem] shadow-xl shadow-blue-100/50 dark:shadow-black/50 overflow-hidden relative border border-slate-100 dark:border-slate-800">
        <div className="absolute top-0 right-0 w-96 h-96 bg-blue-50/50 dark:bg-blue-900/10 rounded-full filter blur-3xl translate-x-1/2 -translate-y-1/2"></div>
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-yellow-50/50 dark:bg-yellow-900/10 rounded-full filter blur-3xl -translate-x-1/2 translate-y-1/2"></div>
        
        <div className="relative z-10 p-6 flex flex-col md:flex-row items-center md:items-stretch justify-between gap-6">
          <div className="flex-1 flex flex-col items-center md:items-start text-center md:text-left space-y-2 w-full">
            <span className="text-slate-500 dark:text-slate-400 text-xs font-bold tracking-widest uppercase bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-full border border-slate-200 dark:border-slate-700">
              Selected Time
            </span>
            <h2 className="text-2xl md:text-3xl font-bold text-slate-800 dark:text-white tracking-tight leading-tight">
              {data.location}
            </h2>
            <p className="text-base text-slate-600 dark:text-slate-300 font-medium">{data.weather.description}</p>
            
            <div className="mt-2 flex items-center justify-center md:justify-start gap-6">
               <div className="text-center">
                 <div className="text-3xl font-bold text-slate-800 dark:text-white">{data.weather.temperature.split(' ')[0]}</div>
                 <div className="text-xs text-slate-500 dark:text-slate-400 font-medium">氣溫</div>
               </div>
               <div className="w-px h-10 bg-slate-200 dark:bg-slate-700"></div>
               <div className="text-center">
                 <div className="text-3xl font-bold text-indigo-600 dark:text-indigo-400">{data.weather.feelsLike || data.weather.temperature.split(' ')[0]}</div>
                 <div className="text-xs text-indigo-500 dark:text-indigo-300 font-medium">體感</div>
               </div>
               <div className="w-px h-10 bg-slate-200 dark:bg-slate-700"></div>
               <div className="text-center">
                 <div className="text-3xl font-bold text-slate-800 dark:text-white">{data.weather.rainProb}</div>
                 <div className="text-xs text-slate-500 dark:text-slate-400 font-medium">降雨率</div>
               </div>
            </div>

            {/* 氣象小叮嚀 */}
            {data.weather.advice && (
               <div className="mt-4 w-full bg-amber-50 dark:bg-slate-800 border border-amber-100 dark:border-amber-900/30 rounded-xl p-4 text-sm text-amber-900 dark:text-amber-100 text-left shadow-sm flex gap-3 items-start">
                  <div className="shrink-0 mt-0.5 text-lg">💡</div>
                  <div className="leading-relaxed font-medium opacity-90">{data.weather.advice}</div>
               </div>
            )}
          </div>
          <div className="flex-shrink-0 p-2 animate-blob transform scale-90 md:scale-100">{WeatherIcon}</div>
        </div>

        {/* 預報 */}
        {data.weather.forecast && data.weather.forecast.length > 0 && (
           <div className="relative z-10 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 p-4">
              <div className="grid grid-cols-3 gap-2 divide-x divide-slate-200/50 dark:divide-slate-700/50">
                 {data.weather.forecast.map((day, idx) => (
                   <div key={idx} className="text-center px-1">
                      <div className="text-xs font-bold text-slate-500 dark:text-slate-400 mb-1">{day.day}</div>
                      <div className="text-sm font-semibold text-slate-700 dark:text-slate-200 leading-tight">{day.condition}</div>
                      <div className="text-xs text-slate-500 dark:text-slate-400 mt-1">{day.low} - {day.high}</div>
                      <div className="text-xs text-blue-600 dark:text-blue-400 mt-0.5 font-medium">☔ {day.rainProb}</div>
                   </div>
                 ))}
              </div>
           </div>
        )}
      </div>

      {/* 2. 圖片 (Pexels) */}
      {data.generatedImages && data.generatedImages.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center justify-between px-1">
             <h3 className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Style Inspiration</h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {data.generatedImages.map((img, index) => (
              <div key={index} className="bg-white dark:bg-slate-800 rounded-2xl p-2 shadow-lg border border-slate-100 dark:border-slate-700 overflow-hidden group">
                <div className="relative aspect-[3/4] w-full rounded-xl overflow-hidden bg-slate-100 dark:bg-slate-900">
                   <img src={img} alt="Outfit" className="w-full h-full object-cover hover:scale-105 transition-transform duration-700" />
                   <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-3 pt-10">
                      <div className="text-white text-xs font-bold shadow-sm tracking-wide">{getStyleLabel(index)}</div>
                   </div>
                </div>
                <div className="mt-2 px-1 flex gap-2">
                   <a href={`https://www.pinterest.com/search/pins/?q=${encodeURIComponent(data.outfit.visualPrompts?.[index] || data.outfit.items[0].color + " fashion")}`} target="_blank" rel="noreferrer" className="flex-1 text-center text-[10px] py-2 rounded-lg bg-slate-100 dark:bg-slate-700 hover:bg-red-50 dark:hover:bg-red-900/30 text-slate-600 dark:text-slate-300 hover:text-red-600 dark:hover:text-red-400 transition-colors font-medium">📌 Pinterest</a>
                   <a href={`https://www.instagram.com/explore/tags/${encodeURIComponent((data.outfit.items[0].color + "outfit").replace(/\s/g, ''))}`} target="_blank" rel="noreferrer" className="flex-1 text-center text-[10px] py-2 rounded-lg bg-slate-100 dark:bg-slate-700 hover:bg-pink-50 dark:hover:bg-pink-900/30 text-slate-600 dark:text-slate-300 hover:text-pink-600 dark:hover:text-pink-400 transition-colors font-medium">📷 Instagram</a>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 3. 色票 (修正顯示問題) */}
      {data.outfit.colorPalette && data.outfit.colorPalette.length > 0 && (
        <div className="bg-white dark:bg-slate-800 rounded-2xl p-5 shadow-sm border border-slate-100 dark:border-slate-700">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Color Palette</h3>
          </div>
          <div className="flex flex-col md:flex-row gap-4 md:items-center">
            <div className="flex items-center gap-2">
              {data.outfit.colorPalette.map((color, idx) => (
                <div key={idx} className="group relative">
                  <div 
                    className="w-10 h-10 rounded-full shadow-md border-2 border-white dark:border-slate-600 transition-transform transform hover:scale-110 hover:z-10 cursor-pointer"
                    style={{ backgroundColor: getColorHex(color) }} 
                  ></div>
                  <span className="absolute -bottom-7 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 text-xs bg-slate-800 text-white px-2 py-1 rounded transition-opacity whitespace-nowrap z-20 pointer-events-none">
                    {color}
                  </span>
                </div>
              ))}
            </div>
            <div className="flex-1 pl-0 md:pl-4 border-l-0 md:border-l border-slate-100 dark:border-slate-700">
              <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed">
                {data.outfit.colorDescription}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* 4. 單品列表 (修正深色模式文字顏色) */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {data.outfit.items.map((item, index) => (
            <div key={index} className="group bg-white dark:bg-slate-800 rounded-2xl p-4 shadow-[0_4px_20px_rgb(0,0,0,0.03)] dark:shadow-none border border-slate-100 dark:border-slate-700 hover:shadow-[0_8px_25px_rgb(0,0,0,0.06)] transition-all duration-300 flex flex-col items-center justify-between text-center h-full relative overflow-hidden">
              <div className="absolute top-0 w-full h-1 bg-gradient-to-r from-transparent via-slate-200 dark:via-slate-700 to-transparent opacity-50"></div>
              <div className="w-14 h-14 mb-3 relative">
                 <div className="absolute inset-0 bg-slate-50 dark:bg-slate-700 rounded-full transform scale-0 group-hover:scale-100 transition-transform duration-300 ease-out"></div>
                 <div className="relative z-10 w-full h-full p-2.5 transform group-hover:-translate-y-1 transition-transform duration-300">{renderIcon(item.icon)}</div>
              </div>
              <div className="w-full space-y-2">
                <div><span className="inline-block px-2 py-0.5 bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 text-[10px] md:text-xs font-bold border border-slate-200 dark:border-slate-600 rounded-full">{item.color}</span></div>
                {/* 標題文字：深色模式下改為白色 (dark:text-white) */}
                <p className="font-bold text-slate-800 dark:text-white text-sm md:text-base leading-tight">{item.item}</p>
                {/* 描述文字：深色模式下改為淺灰 (dark:text-slate-400) */}
                <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed px-1 pb-1">{item.reason}</p>
              </div>
            </div>
          ))}
      </div>

      {/* 5. 專家建議 */}
      {data.outfit.tips && (
        <div className="bg-slate-900 dark:bg-black text-white rounded-2xl p-6 shadow-xl shadow-slate-400/20 dark:shadow-none relative overflow-hidden border border-slate-800 dark:border-slate-900">
          <div className="absolute top-0 right-0 w-48 h-48 bg-white opacity-5 rounded-full blur-3xl pointer-events-none"></div>
          <div className="relative z-10 flex flex-col md:flex-row gap-4 items-start">
             <div className="bg-white/10 p-2.5 rounded-xl">
                <svg className="w-5 h-5 text-yellow-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" /></svg>
             </div>
             <div>
               <h4 className="font-bold text-sm mb-1 text-yellow-300">Stylist Note</h4>
               <p className="text-slate-300 leading-relaxed font-light text-sm md:text-base">{data.outfit.tips}</p>
             </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ResultDisplay;
