import React, { useMemo } from 'react';
import { 
  CloudRainIcon, 
  SunIcon, 
  TShirtIcon, 
  ShirtIcon, 
  HoodieIcon, 
  SweaterIcon, 
  JacketIcon, 
  CoatIcon, 
  PantsIcon, 
  ShortsIcon, 
  SkirtIcon, 
  DressIcon, 
  SneakerIcon, 
  BootIcon, 
  FormalShoeIcon, 
  SandalsIcon, 
  ScarfIcon, 
  HatIcon, 
  BagIcon, 
  GlassesIcon, 
  WatchIcon, 
  GenericClothingIcon, 
  UmbrellaIcon,
  SearchIcon // 確保你的 Icons.tsx 有匯出這個 (沒有的話用 Generic 也可以)
} from './Icons';
import { WeatherOutfitResponse } from '../types';

interface ResultDisplayProps {
  data: WeatherOutfitResponse;
}

// 圖標渲染邏輯 (保持原樣)
const renderIcon = (iconKey: string) => {
  const props = { className: "w-full h-full" };
  switch (iconKey.toLowerCase()) {
    case 't-shirt': return <TShirtIcon {...props} className="text-sky-600" />;
    case 'shirt': return <ShirtIcon {...props} className="text-indigo-600" />;
    case 'polo': return <ShirtIcon {...props} className="text-cyan-700" />;
    case 'sweater': return <SweaterIcon {...props} className="text-orange-400" />;
    case 'hoodie': return <HoodieIcon {...props} className="text-violet-500" />;
    case 'jacket': return <JacketIcon {...props} className="text-slate-700" />;
    case 'coat': return <CoatIcon {...props} className="text-stone-600" />;
    case 'pants': return <PantsIcon {...props} className="text-slate-600" />;
    case 'shorts': return <ShortsIcon {...props} className="text-amber-600" />;
    case 'skirt': return <SkirtIcon {...props} className="text-rose-400" />;
    case 'dress': return <DressIcon {...props} className="text-rose-500" />;
    case 'sneakers': return <SneakerIcon {...props} className="text-emerald-600" />;
    case 'boots': return <BootIcon {...props} className="text-stone-700" />;
    case 'formal': 
    case 'formal-shoes': return <FormalShoeIcon {...props} className="text-slate-800" />;
    case 'sandals': 
    case 'heels': return <SandalsIcon {...props} className="text-red-400" />;
    case 'bag': return <BagIcon {...props} className="text-amber-800" />;
    case 'umbrella': return <UmbrellaIcon {...props} className="text-blue-500" />;
    case 'hat': return <HatIcon {...props} className="text-orange-600" />;
    case 'scarf': return <ScarfIcon {...props} className="text-purple-600" />;
    case 'glasses': return <GlassesIcon {...props} className="text-slate-900" />;
    case 'watch': return <WatchIcon {...props} className="text-zinc-600" />;
    default: return <GenericClothingIcon {...props} className="text-gray-400" />;
  }
};

const ResultDisplay: React.FC<ResultDisplayProps> = ({ data }) => {
  const WeatherIcon = useMemo(() => {
    const desc = data.weather.description.toLowerCase();
    const rainProbStr = String(data.weather.rainProb || '0');
    const rainProb = parseInt(rainProbStr.replace('%', '')) || 0;

    if (desc.includes('雨') || desc.includes('rain') || rainProb > 40) {
      return <CloudRainIcon className="w-20 h-20 md:w-24 md:h-24 text-blue-500 drop-shadow-2xl" />;
    }
    return <SunIcon className="w-20 h-20 md:w-24 md:h-24 text-amber-400 drop-shadow-2xl" />;
  }, [data.weather]);

  const getStyleLabel = (index: number) => {
    switch(index) {
      case 0: return "✨ Style A";
      case 1: return "🔥 Style B";
      case 2: return "🌿 Style C";
      default: return `Style ${index + 1}`;
    }
  };

  return (
    <div className="space-y-5 animate-fade-in pb-12">
      
      {/* 1. 天氣卡片區塊 */}
      <div className="bg-white rounded-[2rem] shadow-xl shadow-blue-100/50 overflow-hidden relative border border-slate-50">
        <div className="absolute top-0 right-0 w-96 h-96 bg-blue-50/50 rounded-full filter blur-3xl translate-x-1/2 -translate-y-1/2"></div>
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-yellow-50/50 rounded-full filter blur-3xl -translate-x-1/2 translate-y-1/2"></div>
        
        <div className="relative z-10 p-6 flex flex-col md:flex-row items-center md:items-stretch justify-between gap-6">
          
          {/* 主要天氣資訊 */}
          <div className="flex-1 flex flex-col items-center md:items-start text-center md:text-left space-y-2 w-full">
            <span className="text-slate-400 text-xs font-bold tracking-widest uppercase bg-slate-50 px-2 py-0.5 rounded-full border border-slate-100">
              Selected Time
            </span>
            <h2 className="text-2xl md:text-3xl font-bold text-slate-800 tracking-tight leading-tight">
              {data.location}
            </h2>
            <p className="text-base text-slate-500 font-medium">{data.weather.description}</p>
            
            <div className="mt-2 flex items-center justify-center md:justify-start gap-6">
               <div className="text-center">
                 <div className="text-3xl font-bold text-slate-800">{data.weather.temperature.split(' ')[0]}</div>
                 <div className="text-xs text-slate-400 font-medium">氣溫</div>
               </div>
               <div className="w-px h-10 bg-slate-200"></div>
               <div className="text-center">
                 <div className="text-3xl font-bold text-indigo-600">{data.weather.feelsLike || data.weather.temperature.split(' ')[0]}</div>
                 <div className="text-xs text-indigo-400 font-medium">體感</div>
               </div>
               <div className="w-px h-10 bg-slate-200"></div>
               <div className="text-center">
                 <div className="text-3xl font-bold text-slate-800">{data.weather.rainProb}</div>
                 <div className="text-xs text-slate-400 font-medium">降雨率</div>
               </div>
            </div>

            {/* 🔥 新增：氣象小叮嚀 (Advice) */}
            {data.weather.advice && (
               <div className="mt-4 w-full bg-amber-50 border border-amber-100 rounded-xl p-3 text-sm text-amber-800 text-left shadow-sm flex gap-3 items-start">
                  <div className="shrink-0 mt-0.5">💡</div>
                  <div className="leading-relaxed">{data.weather.advice}</div>
               </div>
            )}
          </div>

          <div className="flex-shrink-0 p-2 animate-blob transform scale-90 md:scale-100">
            {WeatherIcon}
          </div>
        </div>

        {/* 三日預報 */}
        {data.weather.forecast && data.weather.forecast.length > 0 && (
           <div className="relative z-10 border-t border-slate-100 bg-slate-50/50 p-4">
              <div className="grid grid-cols-3 gap-2 divide-x divide-slate-200/50">
                 {data.weather.forecast.map((day, idx) => (
                   <div key={idx} className="text-center px-1">
                      <div className="text-xs font-bold text-slate-500 mb-1">{day.day}</div>
                      <div className="text-sm font-semibold text-slate-700 leading-tight">{day.condition}</div>
                      <div className="text-xs text-slate-400 mt-1">{day.low} - {day.high}</div>
                      <div className="text-xs text-blue-500 mt-0.5 font-medium">☔ {day.rainProb}</div>
                   </div>
                 ))}
              </div>
           </div>
        )}
      </div>

      {/* 2. 圖片展示區 (包含外部搜尋按鈕) */}
      {data.generatedImages && data.generatedImages.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center justify-between px-1">
             <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Style Inspiration (from Pexels)</h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {data.generatedImages.map((img, index) => (
              <div key={index} className="bg-white rounded-2xl p-2 shadow-lg border border-slate-100 overflow-hidden group">
                <div className="relative aspect-[3/4] w-full rounded-xl overflow-hidden bg-slate-100">
                   <img 
                     src={img} 
                     alt={`Outfit Inspiration ${index + 1}`} 
                     className="w-full h-full object-cover hover:scale-105 transition-transform duration-700"
                   />
                   <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-3 pt-10">
                      <div className="text-white text-xs font-bold shadow-sm tracking-wide">
                        {getStyleLabel(index)}
                      </div>
                   </div>
                </div>
                
                {/* 🔥 新增：針對這張圖的關鍵字，一鍵去外部搜尋 */}
                <div className="mt-2 px-1 flex gap-2">
                   <a 
                     href={`https://www.pinterest.com/search/pins/?q=${encodeURIComponent(data.outfit.visualPrompts?.[index] || data.outfit.items[0].color + " fashion")}`}
                     target="_blank"
                     rel="noreferrer"
                     className="flex-1 text-center text-[10px] py-1.5 rounded-lg bg-slate-50 hover:bg-red-50 text-slate-500 hover:text-red-600 transition-colors font-medium border border-slate-100"
                   >
                     📌 Pinterest
                   </a>
                   <a 
                     href={`https://www.instagram.com/explore/tags/${encodeURIComponent((data.outfit.items[0].color + "outfit").replace(/\s/g, ''))}`}
                     target="_blank"
                     rel="noreferrer"
                     className="flex-1 text-center text-[10px] py-1.5 rounded-lg bg-slate-50 hover:bg-pink-50 text-slate-500 hover:text-pink-600 transition-colors font-medium border border-slate-100"
                   >
                     📷 Instagram
                   </a>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 3. 色票區 (保持原樣) */}
      {data.outfit.colorPalette && data.outfit.colorPalette.length > 0 && (
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Color Palette</h3>
          </div>
          <div className="flex flex-col md:flex-row gap-4 md:items-center">
            <div className="flex items-center gap-2">
              {data.outfit.colorPalette.map((color, idx) => (
                <div key={idx} className="group relative">
                  <div 
                    className="w-10 h-10 rounded-full shadow-md border-2 border-white transition-transform transform hover:scale-110 hover:z-10 cursor-pointer"
                    style={{ backgroundColor: color }}
                  ></div>
                  <span className="absolute -bottom-7 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 text-xs bg-slate-800 text-white px-2 py-1 rounded transition-opacity whitespace-nowrap z-20 pointer-events-none">
                    {color}
                  </span>
                </div>
              ))}
            </div>
            <div className="flex-1 pl-0 md:pl-4 border-l-0 md:border-l border-slate-100">
              <p className="text-sm text-slate-600 leading-relaxed">
                {data.outfit.colorDescription}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* 4. 單品列表 (保持原樣) */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {data.outfit.items.map((item, index) => (
            <div 
              key={index} 
              className="group bg-white rounded-2xl p-4 shadow-[0_4px_20px_rgb(0,0,0,0.03)] border border-slate-50 hover:shadow-[0_8px_25px_rgb(0,0,0,0.06)] transition-all duration-300 flex flex-col items-center justify-between text-center h-full relative overflow-hidden"
            >
              <div className="absolute top-0 w-full h-1 bg-gradient-to-r from-transparent via-slate-200 to-transparent opacity-50"></div>
              <div className="w-14 h-14 mb-3 relative">
                 <div className="absolute inset-0 bg-slate-50 rounded-full transform scale-0 group-hover:scale-100 transition-transform duration-300 ease-out"></div>
                 <div className="relative z-10 w-full h-full p-2.5 transform group-hover:-translate-y-1 transition-transform duration-300">
                   {renderIcon(item.icon)}
                 </div>
              </div>
              <div className="w-full space-y-1">
                <div>
                   <span className="inline-block px-2 py-0.5 bg-slate-100 text-slate-600 text-[10px] md:text-xs font-bold border border-slate-200 rounded-full">
                     {item.color}
                   </span>
                </div>
                <p className="font-bold text-slate-800 text-sm md:text-base leading-tight">{item.item}</p>
                <p className="text-xs text-slate-500 leading-relaxed line-clamp-2 px-1">
                  {item.reason}
                </p>
              </div>
            </div>
          ))}
        </div>

      {/* 5. 專家建議 (Stylist Note) */}
      {data.outfit.tips && (
        <div className="bg-slate-900 text-white rounded-2xl p-6 shadow-xl shadow-slate-400/20 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-48 h-48 bg-white opacity-5 rounded-full blur-3xl pointer-events-none"></div>
          <div className="relative z-10 flex flex-col md:flex-row gap-4 items-start">
             <div className="bg-white/10 p-2.5 rounded-xl">
                <svg className="w-5 h-5 text-yellow-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                </svg>
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
