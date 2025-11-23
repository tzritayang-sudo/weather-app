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

// 12季型全色彩對照表
const getColorHex = (colorName: string) => {
  const lower = colorName.toLowerCase();
  if (lower.includes('hot pink') || lower.includes('豔粉')) return '#FF1493';
  if (lower.includes('peach') || lower.includes('蜜桃')) return '#FFB7C5'; 
  if (lower.includes('salmon') || lower.includes('鮭魚')) return '#FA8072';
  if (lower.includes('coral') || lower.includes('珊瑚')) return '#FF7F50';
  if (lower.includes('rose') || lower.includes('玫瑰')) return '#FF007F';
  if (lower.includes('mauve') || lower.includes('錦葵')) return '#D473D4';
  if (lower.includes('burgundy') || lower.includes('酒紅')) return '#800020';
  if (lower.includes('red') || lower.includes('紅')) return '#FF4500';
  if (lower.includes('pink') || lower.includes('粉')) return '#FF69B4';
  if (lower.includes('electric') || lower.includes('電光')) return '#00FFFF'; 
  if (lower.includes('royal') || lower.includes('寶石')) return '#4361EE';
  if (lower.includes('navy') || lower.includes('海軍')) return '#000080';
  if (lower.includes('dusty blue') || lower.includes('灰藍')) return '#5B7C99';
  if (lower.includes('sky') || lower.includes('天藍')) return '#87CEEB';
  if (lower.includes('teal') || lower.includes('孔雀')) return '#008080';
  if (lower.includes('blue') || lower.includes('藍')) return '#4169E1';
  if (lower.includes('mustard') || lower.includes('芥末')) return '#FFD700';
  if (lower.includes('gold') || lower.includes('金')) return '#FFD700'; 
  if (lower.includes('yellow') || lower.includes('黃')) return '#FFFF00';
  if (lower.includes('orange') || lower.includes('橘')) return '#FFA500';
  if (lower.includes('camel') || lower.includes('駝')) return '#C19A6B';
  if (lower.includes('rust') || lower.includes('鐵鏽')) return '#B7410E';
  if (lower.includes('brown') || lower.includes('棕')) return '#A52A2A';
  if (lower.includes('emerald') || lower.includes('祖母')) return '#2ECC71';
  if (lower.includes('sage') || lower.includes('鼠尾')) return '#98FB98';
  if (lower.includes('grey green') || lower.includes('灰綠')) return '#8FBC8F';
  if (lower.includes('olive') || lower.includes('橄欖')) return '#808000';
  if (lower.includes('mint') || lower.includes('薄荷')) return '#98FF98';
  if (lower.includes('green') || lower.includes('綠')) return '#32CD32'; 
  if (lower.includes('icy') || lower.includes('冰')) return '#F0F8FF';
  if (lower.includes('charcoal') || lower.includes('炭')) return '#36454F';
  if (lower.includes('ivory') || lower.includes('象牙')) return '#FFFFF0';
  if (lower.includes('cream') || lower.includes('奶油')) return '#FFFDD0';
  if (lower.includes('grey') || lower.includes('gray') || lower.includes('灰')) return '#D3D3D3';
  if (lower.includes('white') || lower.includes('白')) return '#FFFFFF';
  if (lower.includes('beige') || lower.includes('米')) return '#F5F5DC';
  if (lower.includes('khaki') || lower.includes('卡其')) return '#F0E68C';
  if (lower.includes('taupe') || lower.includes('褐灰')) return '#483C32';
  if (lower.includes('black') || lower.includes('黑')) return '#000000';
  if (lower.includes('purple') || lower.includes('紫')) return '#9370DB';
  if (lower.includes('lavender') || lower.includes('薰衣草')) return '#E6E6FA';
  return '#CCCCCC'; 
};

// 強制變色 renderIcon
const renderIcon = (iconKey: string, colorHex: string) => {
  const style = { 
      color: colorHex, 
      fill: colorHex, 
      stroke: colorHex,
      filter: 'drop-shadow(0 0 2px rgba(0,0,0,0.6))' 
  };
  const props = { className: "w-full h-full", style, color: colorHex }; 

  switch (iconKey.toLowerCase()) {
    case 't-shirt': return <TShirtIcon {...props} />;
    case 'shirt': case 'polo': return <ShirtIcon {...props} />;
    case 'sweater': return <SweaterIcon {...props} />;
    case 'hoodie': return <HoodieIcon {...props} />;
    case 'jacket': return <JacketIcon {...props} />;
    case 'coat': return <CoatIcon {...props} />;
    case 'pants': return <PantsIcon {...props} />;
    case 'shorts': return <ShortsIcon {...props} />;
    case 'skirt': return <SkirtIcon {...props} />;
    case 'dress': return <DressIcon {...props} />;
    case 'sneakers': return <SneakerIcon {...props} />;
    case 'boots': return <BootIcon {...props} />;
    case 'formal': case 'formal-shoes': return <FormalShoeIcon {...props} />;
    case 'sandals': case 'heels': return <SandalsIcon {...props} />;
    case 'bag': return <BagIcon {...props} />;
    case 'umbrella': return <UmbrellaIcon {...props} />;
    case 'hat': return <HatIcon {...props} />;
    case 'scarf': return <ScarfIcon {...props} />;
    case 'glasses': return <GlassesIcon {...props} />;
    case 'watch': return <WatchIcon {...props} />;
    default: return <GenericClothingIcon {...props} />;
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
            
            {/* 🔥 2x2 Grid 顯示濕度 */}
            <div className="mt-4 w-full grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-2 md:divide-x divide-slate-200 dark:divide-slate-700">
               <div className="text-center px-1">
                 <div className="text-3xl font-bold text-slate-800 dark:text-white truncate">
                   {data.weather.temperature.split(' ')[0]}
                 </div>
                 <div className="text-xs text-slate-500 dark:text-slate-400 font-medium uppercase tracking-wider mt-1">氣溫</div>
               </div>
               <div className="text-center px-1">
                 <div className="text-3xl font-bold text-indigo-600 dark:text-indigo-400 truncate">
                   {data.weather.feelsLike || data.weather.temperature.split(' ')[0]}
                 </div>
                 <div className="text-xs text-indigo-500 dark:text-indigo-300 font-medium uppercase tracking-wider mt-1">體感</div>
               </div>
               {/* 濕度 */}
               <div className="text-center px-1">
                 <div className="text-3xl font-bold text-cyan-600 dark:text-cyan-400 truncate">
                   {data.weather.humidity || "N/A"}
                 </div>
                 <div className="text-xs text-cyan-600 dark:text-cyan-300 font-medium uppercase tracking-wider mt-1">濕度</div>
               </div>
               <div className="text-center px-1">
                 <div className="text-3xl font-bold text-slate-800 dark:text-white truncate">
                   {data.weather.rainProb}
                 </div>
                 <div className="text-xs text-slate-500 dark:text-slate-400 font-medium uppercase tracking-wider mt-1">降雨率</div>
               </div>
            </div>

            {data.weather.advice && (
               <div className="mt-4 w-full bg-amber-50 dark:bg-slate-800 border border-amber-100 dark:border-amber-900/30 rounded-xl p-4 text-sm text-amber-900 dark:text-amber-100 text-left shadow-sm flex gap-3 items-start">
                  <div className="shrink-0 mt-0.5 text-lg">💡</div>
                  <div className="leading-relaxed font-medium opacity-90">{data.weather.advice}</div>
               </div>
            )}
          </div>
          <div className="flex-shrink-0 p-2 animate-blob transform scale-90 md:scale-100">{WeatherIcon}</div>
        </div>
      </div>

      {/* 圖片 (保持不變) */}
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
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 色票 */}
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
                    className="w-10 h-10 rounded-full shadow-lg border-2 border-white dark:border-slate-600 ring-1 ring-slate-100 dark:ring-slate-700 transition-transform transform hover:scale-110 hover:z-10 cursor-pointer relative z-10"
                    style={{ backgroundColor: getColorHex(color), opacity: 1, isolation: 'isolate' }} 
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

      {/* 單品列表 */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {data.outfit.items.map((item, index) => (
            <div key={index} className="group bg-white dark:bg-slate-800 rounded-2xl p-4 shadow-[0_4px_20px_rgb(0,0,0,0.03)] dark:shadow-none border border-slate-100 dark:border-slate-700 hover:shadow-[0_8px_25px_rgb(0,0,0,0.06)] transition-all duration-300 flex flex-col items-center justify-between text-center h-full relative overflow-hidden">
              <div className="absolute top-0 w-full h-1 bg-gradient-to-r from-transparent via-slate-200 dark:via-slate-700 to-transparent opacity-50"></div>
              <div className="w-14 h-14 mb-3 relative">
                 <div className="absolute inset-0 bg-slate-50 dark:bg-slate-700 rounded-full transform scale-0 group-hover:scale-100 transition-transform duration-300 ease-out"></div>
                 <div className="relative z-10 w-full h-full p-2.5 transform group-hover:-translate-y-1 transition-transform duration-300">
                   {renderIcon(item.icon, getColorHex(item.color))}
                 </div>
              </div>
              <div className="w-full space-y-2">
                <div><span className="inline-block px-2 py-0.5 bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 text-[10px] md:text-xs font-bold border border-slate-200 dark:border-slate-600 rounded-full">{item.color}</span></div>
                <p className="font-bold text-slate-800 dark:text-white text-sm md:text-base leading-tight">{item.item}</p>
                <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed px-1 pb-1">{item.reason}</p>
              </div>
            </div>
          ))}
      </div>

      {/* 專家建議 */}
      {data.outfit.tips && (
        <div className="bg-slate-900 dark:bg-black text-white rounded-2xl p-6 shadow-xl shadow-slate-400/20 dark:shadow-none relative overflow-hidden border border-slate-800 dark:border-slate-900">
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
