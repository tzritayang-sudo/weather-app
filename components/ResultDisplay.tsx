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
  UmbrellaIcon
} from './Icons';
import { WeatherOutfitResponse } from '../types';

interface ResultDisplayProps {
  data: WeatherOutfitResponse;
}

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
      return <CloudRainIcon className="w-24 h-24 text-blue-500 drop-shadow-2xl" />;
    }
    return <SunIcon className="w-24 h-24 text-amber-400 drop-shadow-2xl" />;
  }, [data.weather]);

  const getStyleLabel = (index: number) => {
    switch(index) {
      case 0: return "✨ 標準推薦 (Main)";
      case 1: return "🔥 時尚變體 (Trendy)";
      case 2: return "🌿 氛圍感 (Vibe)";
      default: return `Style ${index + 1}`;
    }
  };

  return (
    <div className="space-y-6 animate-fade-in pb-10">
      
      {/* 1. Weather Widget with Feels Like & Forecast */}
      <div className="bg-white rounded-[2rem] shadow-xl shadow-blue-100/50 overflow-hidden relative border border-slate-50">
        <div className="absolute top-0 right-0 w-96 h-96 bg-blue-50/50 rounded-full filter blur-3xl translate-x-1/2 -translate-y-1/2"></div>
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-yellow-50/50 rounded-full filter blur-3xl -translate-x-1/2 translate-y-1/2"></div>
        
        <div className="relative z-10 p-6 flex flex-col md:flex-row items-center md:items-stretch justify-between gap-6">
          
          {/* Current Weather */}
          <div className="flex-1 flex flex-col items-center md:items-start text-center md:text-left space-y-1">
            <span className="text-slate-400 text-[10px] font-bold tracking-widest uppercase bg-slate-50 px-2 py-0.5 rounded-full border border-slate-100">Selected Time</span>
            <h2 className="text-3xl md:text-4xl font-bold text-slate-800 tracking-tight">
              {data.location}
            </h2>
            <p className="text-base text-slate-500 font-medium">{data.weather.description}</p>
            
            <div className="mt-4 flex items-center gap-6">
               <div className="text-center">
                 <div className="text-2xl font-bold text-slate-800">{data.weather.temperature.split(' ')[0]}</div>
                 <div className="text-[10px] text-slate-400 font-medium">氣溫</div>
               </div>
               <div className="w-px h-8 bg-slate-200"></div>
               <div className="text-center">
                 <div className="text-2xl font-bold text-indigo-600">{data.weather.feelsLike || data.weather.temperature.split(' ')[0]}</div>
                 <div className="text-[10px] text-indigo-400 font-medium">體感</div>
               </div>
               <div className="w-px h-8 bg-slate-200"></div>
               <div className="text-center">
                 <div className="text-2xl font-bold text-slate-800">{data.weather.rainProb}</div>
                 <div className="text-[10px] text-slate-400 font-medium">降雨率</div>
               </div>
            </div>
          </div>

          <div className="flex-shrink-0 p-2 animate-blob transform scale-90 md:scale-100">
            {WeatherIcon}
          </div>
        </div>

        {/* 3-Day Forecast Section */}
        {data.weather.forecast && data.weather.forecast.length > 0 && (
           <div className="relative z-10 border-t border-slate-100 bg-slate-50/50 p-4">
              <div className="grid grid-cols-3 gap-2 divide-x divide-slate-200/50">
                 {data.weather.forecast.map((day, idx) => (
                   <div key={idx} className="text-center px-2">
                      <div className="text-xs font-bold text-slate-400 mb-1">{day.day}</div>
                      <div className="text-sm font-semibold text-slate-700">{day.condition}</div>
                      <div className="text-xs text-slate-500 mt-1">{day.low} - {day.high}</div>
                      <div className="text-[10px] text-blue-500 mt-0.5">☔ {day.rainProb}</div>
                   </div>
                 ))}
              </div>
           </div>
        )}
      </div>

      {/* 2. Generated Outfit Images (3 Distinct Variations) */}
      {data.generatedImages && data.generatedImages.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center justify-between px-1">
             <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">AI Style Gallery</h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {data.generatedImages.map((img, index) => (
              <div key={index} className="bg-white rounded-2xl p-2 shadow-lg border border-slate-100 overflow-hidden group">
                <div className="relative aspect-[3/4] w-full rounded-xl overflow-hidden bg-slate-100">
                   <img 
                     src={img} 
                     alt={`AI Generated Outfit ${index + 1}`} 
                     className="w-full h-full object-cover hover:scale-105 transition-transform duration-700"
                   />
                   <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent p-3 pt-8">
                      <div className="text-white text-[10px] font-bold shadow-sm uppercase tracking-wide">
                        {getStyleLabel(index)}
                      </div>
                   </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 3. Color Analysis Palette Bar */}
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
                  <span className="absolute -bottom-6 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 text-[10px] bg-slate-800 text-white px-1.5 py-0.5 rounded transition-opacity whitespace-nowrap z-20">
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

      {/* 4. Outfit Gallery Items */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {data.outfit.items.map((item, index) => (
            <div 
              key={index} 
              className="group bg-white rounded-2xl p-4 shadow-[0_4px_20px_rgb(0,0,0,0.03)] border border-slate-50 hover:shadow-[0_8px_25px_rgb(0,0,0,0.06)] transition-all duration-300 flex flex-col items-center justify-between text-center h-full relative overflow-hidden"
            >
              <div className="absolute top-0 w-full h-1 bg-gradient-to-r from-transparent via-slate-200 to-transparent opacity-50"></div>
              <div className="w-16 h-16 mb-3 relative">
                 <div className="absolute inset-0 bg-slate-50 rounded-full transform scale-0 group-hover:scale-100 transition-transform duration-300 ease-out"></div>
                 <div className="relative z-10 w-full h-full p-3 transform group-hover:-translate-y-1 transition-transform duration-300">
                   {renderIcon(item.icon)}
                 </div>
              </div>
              <div className="w-full space-y-1">
                <div>
                   <span className="inline-block px-2 py-0.5 bg-slate-100 text-slate-600 text-[10px] font-bold border border-slate-200 rounded-full">
                     {item.color}
                   </span>
                </div>
                <p className="font-bold text-slate-800 text-base leading-tight">{item.item}</p>
                <p className="text-xs text-slate-500 leading-relaxed line-clamp-2 px-1">
                  {item.reason}
                </p>
              </div>
            </div>
          ))}
        </div>

      {/* 5. Pro Tip Card */}
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