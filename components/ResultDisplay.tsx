import React, { useMemo } from 'react';
import { 
  CloudRainIcon, 
  SunIcon, 
  TShirtIcon, 
  ShirtIcon, 
  HoodieIcon, 
  CoatIcon, 
  PantsIcon, 
  ShortsIcon, 
  SkirtIcon, 
  DressIcon, 
  ShoesIcon, 
  SneakersIcon, 
  BootsIcon, 
  SandalsIcon, 
  BagIcon, 
  UmbrellaIcon, 
  GlassesIcon,
  ThermometerIcon,
  DropletsIcon,
  WindIcon
} from 'lucide-react';
import { WeatherOutfitResponse, Style, Gender, TargetDay, TimeOfDay } from '../types';

// ----------------------------------------------------------------------
// 1. 色彩與圖示對應邏輯 (Mapping Logic)
// ----------------------------------------------------------------------

// 修正後的色彩對應表 (支援中英文與特殊色)
const getColorHex = (colorName: string): string => {
  const name = colorName.toLowerCase().trim();
  
  // 特殊色與亮色系修正 (確保在深色模式下可見)
  if (name.includes('electric') || name.includes('neon') || name.includes('cyan')) return '#00FFFF'; // 螢光青
  if (name.includes('hot pink') || name.includes('fuchsia') || name.includes('magenta')) return '#FF00FF'; // 螢光粉
  if (name.includes('royal') || name.includes('sapphire') || name.includes('cobalt')) return '#4169E1'; // 寶石藍
  if (name.includes('bright white') || name.includes('pure white')) return '#F0F0F0'; // 亮白 (改用淺灰以免在白底消失)
  if (name.includes('jet black') || name.includes('pure black')) return '#1a1a1a'; // 亮黑

  // 標準色系
  if (name.includes('navy') || name.includes('深藍')) return '#000080';
  if (name.includes('blue') || name.includes('藍')) return '#3B82F6';
  if (name.includes('white') || name.includes('白')) return '#FFFFFF';
  if (name.includes('black') || name.includes('黑')) return '#000000';
  if (name.includes('gray') || name.includes('grey') || name.includes('灰')) return '#9CA3AF';
  if (name.includes('beige') || name.includes('米') || name.includes('卡其')) return '#D1D5DB';
  if (name.includes('brown') || name.includes('咖') || name.includes('褐')) return '#8B4513';
  if (name.includes('red') || name.includes('紅')) return '#EF4444';
  if (name.includes('pink') || name.includes('粉')) return '#EC4899';
  if (name.includes('orange') || name.includes('橘') || name.includes('橙')) return '#F97316';
  if (name.includes('yellow') || name.includes('黃')) return '#EAB308';
  if (name.includes('green') || name.includes('綠')) return '#22C55E';
  if (name.includes('purple') || name.includes('紫')) return '#A855F7';
  if (name.includes('gold') || name.includes('金')) return '#FFD700';
  if (name.includes('silver') || name.includes('銀')) return '#C0C0C0';

  return '#9CA3AF'; // 預設灰色
};

// 圖示選擇器
const getIconComponent = (itemName: string) => {
  const name = itemName.toLowerCase();
  
  // 上身
  if (name.includes('t-shirt') || name.includes('t恤') || name.includes('短袖')) return TShirtIcon;
  if (name.includes('shirt') || name.includes('襯衫') || name.includes('polo')) return ShirtIcon;
  if (name.includes('hoodie') || name.includes('sweatshirt') || name.includes('帽t') || name.includes('衛衣')) return HoodieIcon;
  if (name.includes('coat') || name.includes('jacket') || name.includes('blazer') || name.includes('cardigan') || name.includes('外套') || name.includes('大衣') || name.includes('西裝') || name.includes('針織')) return CoatIcon;
  
  // 下身
  if (name.includes('short') || name.includes('短褲')) return ShortsIcon;
  if (name.includes('skirt') || name.includes('裙')) return SkirtIcon;
  if (name.includes('dress') || name.includes('洋裝') || name.includes('連身')) return DressIcon;
  if (name.includes('pant') || name.includes('jeans') || name.includes('trousers') || name.includes('褲')) return PantsIcon;

  // 鞋子
  if (name.includes('sneaker') || name.includes('trainer') || name.includes('運動鞋') || name.includes('休閒鞋') || name.includes('小白鞋')) return SneakersIcon;
  if (name.includes('boot') || name.includes('靴')) return BootsIcon;
  if (name.includes('sandal') || name.includes('flip') || name.includes('涼鞋') || name.includes('拖鞋')) return SandalsIcon;
  if (name.includes('shoe') || name.includes('flat') || name.includes('loafer') || name.includes('皮鞋') || name.includes('樂福') || name.includes('平底')) return ShoesIcon;

  // 配件
  if (name.includes('bag') || name.includes('tote') || name.includes('purse') || name.includes('包')) return BagIcon;
  if (name.includes('umbrella') || name.includes('傘')) return UmbrellaIcon;
  if (name.includes('glass') || name.includes('sunglass') || name.includes('墨鏡') || name.includes('眼鏡')) return GlassesIcon;
  if (name.includes('scarf') || name.includes('圍巾')) return ShirtIcon; 
  if (name.includes('hat') || name.includes('cap') || name.includes('beanie') || name.includes('帽')) return SunIcon;

  return TShirtIcon; // 預設圖示
};

// ----------------------------------------------------------------------
// 2. 主要元件 (Main Component)
// ----------------------------------------------------------------------

interface ResultDisplayProps {
  data: WeatherOutfitResponse;
  loading: boolean;
  onRetry: () => void;
  userGender: Gender;
  userStyle: Style;
  targetDay: TargetDay;
  timeOfDay: TimeOfDay;
}

const ResultDisplay: React.FC<ResultDisplayProps> = ({ 
  data, 
  loading, 
  onRetry,
  userGender, 
  userStyle,
  targetDay,
  timeOfDay
}) => {
  
  // 整理單品資料 (包含顏色 Hex 與對應圖示)
  const displayItems = useMemo(() => {
    if (!data?.outfit?.items) return [];
    return data.outfit.items.map(item => ({
      ...item,
      hexColor: getColorHex(item.color),
      IconComponent: getIconComponent(item.name)
    }));
  }, [data]);

  // 整理色票 (Color Palette)
  const colorPalette = useMemo(() => {
    if (!data?.outfit?.color_palette) return [];
    return data.outfit.color_palette.map(colorName => ({
      name: colorName,
      hex: getColorHex(colorName)
    }));
  }, [data]);

  // 時間顯示邏輯
  const timeLabel = targetDay === 'today' ? '今天' : '明天';
  const periodLabel = 
    timeOfDay === 'current' ? '現在' :
    timeOfDay === 'morning' ? '早上' :
    timeOfDay === 'afternoon' ? '下午' : '晚上';

  if (loading) {
    return (
      <div className="w-full max-w-md mx-auto p-8 flex flex-col items-center justify-center min-h-[400px] text-slate-300">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-400 mb-4"></div>
        <p className="text-lg animate-pulse">AI 造型師正在分析天氣與您的色彩季型...</p>
        <p className="text-sm text-slate-500 mt-2">正在配對：{data?.weather?.location || '台灣'} 的氣溫與穿搭</p>
      </div>
    );
  }

  if (!data) return null;

  return (
    <div className="w-full max-w-md mx-auto space-y-6 pb-20 animate-fade-in">
      
      {/* 1. 天氣卡片 (Weather Card) */}
      <div className="bg-slate-800/80 backdrop-blur-md rounded-3xl p-6 shadow-xl border border-slate-700 text-white relative overflow-hidden">
        {/* 背景裝飾 */}
        <div className="absolute top-0 right-0 -mt-4 -mr-4 w-24 h-24 bg-blue-500 rounded-full opacity-20 blur-xl"></div>
        <div className="absolute bottom-0 left-0 -mb-4 -ml-4 w-20 h-20 bg-purple-500 rounded-full opacity-20 blur-xl"></div>

        <div className="relative z-10">
          <div className="flex justify-between items-start mb-6">
            <div>
              <div className="inline-flex items-center px-3 py-1 rounded-full bg-slate-700/50 border border-slate-600 text-xs font-medium text-blue-300 mb-2">
                <span className="w-2 h-2 rounded-full bg-blue-400 mr-2 animate-pulse"></span>
                SELECTED TIME
              </div>
              <h2 className="text-3xl font-bold tracking-tight text-white">
                {data.weather.location.split(',')[0]}
              </h2>
              <p className="text-slate-400 text-sm mt-1 flex items-center">
                {timeLabel} {periodLabel} • {data.weather.condition}
              </p>
            </div>
            {/* 天氣圖示 */}
            <div className="p-3 bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl shadow-lg">
               <CloudRainIcon className="w-8 h-8 text-white" />
            </div>
          </div>

          {/* 氣溫數據 Grid */}
          <div className="grid grid-cols-3 gap-4 mb-6">
            <div className="text-center p-3 rounded-2xl bg-slate-700/30 border border-slate-700/50 backdrop-blur-sm">
              <div className="flex justify-center mb-2 text-blue-300"><ThermometerIcon size={20} /></div>
              <div className="text-2xl font-bold">{data.weather.temperature}°C</div>
              <div className="text-xs text-slate-400 mt-1">氣溫</div>
            </div>
            <div className="text-center p-3 rounded-2xl bg-slate-700/30 border border-slate-700/50 backdrop-blur-sm">
              <div className="flex justify-center mb-2 text-purple-300"><WindIcon size={20} /></div>
              <div className="text-2xl font-bold">{data.weather.feels_like}°C</div>
              <div className="text-xs text-slate-400 mt-1">體感</div>
            </div>
            <div className="text-center p-3 rounded-2xl bg-slate-700/30 border border-slate-700/50 backdrop-blur-sm">
              <div className="flex justify-center mb-2 text-cyan-300"><DropletsIcon size={20} /></div>
              <div className="text-2xl font-bold">{data.weather.precipitation}</div>
              <div className="text-xs text-slate-400 mt-1">降雨率</div>
            </div>
          </div>

          {/* 穿搭小建議 (AI Advice) */}
          {data.outfit.tips && (
            <div className="flex items-start gap-3 p-4 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-200 text-sm leading-relaxed">
              <div className="mt-0.5 min-w-[16px]">💡</div>
              <p>{data.outfit.tips}</p>
            </div>
          )}
        </div>
      </div>

      {/* 2. 色票卡片 (Color Palette) */}
      <div className="bg-slate-800/50 backdrop-blur-sm rounded-2xl p-5 border border-slate-700/50">
        <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4">Color Palette</h3>
        <div className="flex items-center gap-4">
          {colorPalette.map((color, idx) => (
            <div key={idx} className="group relative">
              <div 
                className="w-10 h-10 rounded-full border-2 border-white/10 shadow-lg transform transition-transform group-hover:scale-110"
                style={{ backgroundColor: color.hex }}
                title={color.name}
              />
              {/* Tooltip */}
              <div className="absolute -bottom-8 left-1/2 -translate-x-1/2 px-2 py-1 bg-black/90 text-white text-[10px] rounded opacity-0 group-hover:opacity-100 whitespace-nowrap pointer-events-none transition-opacity z-20">
                {color.name}
              </div>
            </div>
          ))}
          <div className="h-8 w-px bg-slate-700 mx-2"></div>
          <p className="text-xs text-slate-400 leading-relaxed flex-1">
            {data.outfit.reason}
          </p>
        </div>
      </div>

      {/* 3. 穿搭單品 Grid (Outfit Items) */}
      <div className="grid grid-cols-2 gap-4">
        {displayItems.map((item, index) => (
          <div 
            key={index}
            className="group bg-slate-800 rounded-2xl p-5 border border-slate-700 hover:border-blue-500/50 transition-all hover:shadow-lg hover:shadow-blue-500/10 flex flex-col items-center text-center relative overflow-hidden"
          >
            {/* 頂部光暈 */}
            <div 
              className="absolute top-0 left-0 w-full h-1 opacity-50"
              style={{ backgroundColor: item.hexColor }}
            />
            
            {/* 圖示 (強制上色) */}
            <div className="mb-4 p-3 rounded-full bg-slate-900/50 ring-1 ring-white/5 group-hover:ring-white/20 transition-all">
              <item.IconComponent 
                size={32} 
                color={item.hexColor} // 直接傳入 hex 顏色給 SVG
                style={{ color: item.hexColor }} // 雙重保險
              />
            </div>

            {/* 色名標籤 */}
            <div className="inline-block px-2 py-1 rounded-md bg-slate-900 border border-slate-700 text-[10px] text-slate-400 mb-2">
              {item.color}
            </div>

            {/* 單品名稱 */}
            <h4 className="text-white font-medium text-base mb-1">
              {item.name}
            </h4>

            {/* 單品描述 */}
            <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed group-hover:text-slate-400 transition-colors">
              {item.material}材質，{item.reason}
            </p>
          </div>
        ))}
      </div>

      {/* 4. 圖片展示區 (Generated Images) */}
      {data.generatedImages && data.generatedImages.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center justify-between px-1">
            <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider">Style Inspiration</h3>
            <span className="text-xs text-slate-600">Powered by Pexels</span>
          </div>
          
          <div className="grid grid-cols-2 gap-3">
            {/* 第一張大圖 */}
            <div className="col-span-2 aspect-[16/9] rounded-2xl overflow-hidden border border-slate-700 relative group">
              <img 
                src={data.generatedImages[0].src.large} 
                alt={data.generatedImages[0].alt}
                className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-4">
                <p className="text-white text-sm font-medium line-clamp-1">{data.generatedImages[0].alt}</p>
              </div>
            </div>

            {/* 下方小圖 */}
            {data.generatedImages.slice(1, 3).map((img, idx) => (
              <div key={idx} className="aspect-[4/3] rounded-2xl overflow-hidden border border-slate-700 relative group">
                <img 
                  src={img.src.medium} 
                  alt={img.alt}
                  className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 重新整理按鈕 */}
      <button 
        onClick={onRetry}
        className="w-full py-4 rounded-2xl bg-slate-800 border border-slate-700 text-slate-400 font-medium hover:bg-slate-700 hover:text-white transition-all flex items-center justify-center gap-2 group"
      >
        <span className="group-hover:rotate-180 transition-transform duration-500">↻</span>
        生成新的穿搭建議
      </button>

    </div>
  );
};

export default ResultDisplay;
