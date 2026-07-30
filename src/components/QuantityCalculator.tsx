import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Calculator, Ruler, Layers, ShoppingBag, Check, Sparkles, Info, RefreshCw, Plus, Minus } from 'lucide-react';

interface QuantityCalculatorProps {
  product: {
    id: string;
    name: string;
    category?: string;
    price?: number;
    coverage?: string;
    stock?: number;
  };
  onAddToCart?: (quantity: number) => void;
}

/**
 * Smart coverage parser for Hebrew technical strings
 */
function parseCoverageFromText(coverageText?: string, category?: string): { rate: number; unit: string; description: string } {
  if (!coverageText) {
    // Category fallbacks
    const cat = (category || '').toLowerCase();
    if (cat.includes('צבע') || cat.includes('paint')) {
      return { rate: 10, unit: 'מ"ר / ליטר', description: 'ערך מומלץ לצבע (10 מ"ר לליטר)' };
    }
    if (cat.includes('איטום') || cat.includes('seal')) {
      return { rate: 1.5, unit: 'ק"ג / מ"ר', description: 'ערך מומלץ לחומר איטום (1.5 ק"ג למ"ר)' };
    }
    if (cat.includes('דבק') || cat.includes('adhesive')) {
      return { rate: 4, unit: 'ק"ג / מ"ר', description: 'ערך מומלץ לדבק (4 ק"ג למ"ר)' };
    }
    return { rate: 8, unit: 'מ"ר / יחידה', description: 'ערך משוער סטנדרטי (8 מ"ר למוצר)' };
  }

  const cleanText = coverageText.trim();

  // Range pattern like "10-12 מ"ר לליטר" or "10-12 מ"ר לק"ג"
  const rangeMatch = cleanText.match(/(\d+(?:\.\d+)?)\s*-\s*(\d+(?:\.\d+)?)/);
  if (rangeMatch) {
    const min = parseFloat(rangeMatch[1]);
    const max = parseFloat(rangeMatch[2]);
    const avg = (min + max) / 2;
    return { rate: avg, unit: 'מ"ר לכיסוי', description: `מחושב לפי ממוצע ${min}-${max} מ"ר` };
  }

  // Single number pattern like "8 מ"ר לק"ג" or "1.5 ק"ג למ"ר"
  const singleMatch = cleanText.match(/(\d+(?:\.\d+)?)/);
  if (singleMatch) {
    const val = parseFloat(singleMatch[1]);
    if (cleanText.includes('למ"ר') || cleanText.includes('למטר')) {
      // Consumption per sq.m, e.g., 1.5 kg/m² -> 1/1.5 = ~0.66 m²/unit
      return { rate: val > 0 ? 1 / val : 8, unit: 'מ"ר לכיסוי', description: `לפי מפרט: ${cleanText}` };
    }
    return { rate: val, unit: 'מ"ר לכיסוי', description: `לפי מפרט: ${cleanText}` };
  }

  return { rate: 8, unit: 'מ"ר לכיסוי', description: 'כושר כיסוי לפי מפרט טכני' };
}

export const QuantityCalculator: React.FC<QuantityCalculatorProps> = ({ product, onAddToCart }) => {
  const [calcMode, setCalcMode] = useState<'dimensions' | 'area'>('dimensions');
  const [length, setLength] = useState<string>('4');
  const [width, setWidth] = useState<string>('3');
  const [totalAreaInput, setTotalAreaInput] = useState<string>('12');
  const [coats, setCoats] = useState<number>(2);
  const [bufferPercent, setBufferPercent] = useState<number>(10); // 10% waste buffer default
  const [addedSuccess, setAddedSuccess] = useState<boolean>(false);

  // Parse coverage
  const parsedCoverage = useMemo(() => {
    return parseCoverageFromText(product.coverage, product.category);
  }, [product.coverage, product.category]);

  const [customCoverageRate, setCustomCoverageRate] = useState<number>(parsedCoverage.rate);

  // Synchronize custom rate if product changes
  React.useEffect(() => {
    setCustomCoverageRate(parsedCoverage.rate);
  }, [parsedCoverage]);

  // Calculated Area in m²
  const baseArea = useMemo(() => {
    if (calcMode === 'dimensions') {
      const l = parseFloat(length) || 0;
      const w = parseFloat(width) || 0;
      return l * w;
    } else {
      return parseFloat(totalAreaInput) || 0;
    }
  }, [calcMode, length, width, totalAreaInput]);

  // Area considering number of coats and waste buffer
  const effectiveArea = useMemo(() => {
    const areaWithCoats = baseArea * coats;
    const bufferMultiplier = 1 + bufferPercent / 100;
    return areaWithCoats * bufferMultiplier;
  }, [baseArea, coats, bufferPercent]);

  // Recommended number of product packages/units
  const recommendedUnits = useMemo(() => {
    if (customCoverageRate <= 0 || effectiveArea <= 0) return 1;
    // Units needed = Total effective area / coverage rate per unit
    const unitsRaw = effectiveArea / customCoverageRate;
    return Math.max(1, Math.ceil(unitsRaw));
  }, [effectiveArea, customCoverageRate]);

  // Total estimated price
  const totalPrice = useMemo(() => {
    if (!product.price || product.price <= 0) return 0;
    return recommendedUnits * product.price;
  }, [product.price, recommendedUnits]);

  const handleAddCalcToCart = () => {
    if (window.navigator?.vibrate) window.navigator.vibrate(60);
    onAddToCart?.(recommendedUnits);
    setAddedSuccess(true);
    setTimeout(() => setAddedSuccess(false), 2500);
  };

  return (
    <div className="bg-current/[0.03] border border-current/10 rounded-3xl p-6 md:p-8 backdrop-blur-md shadow-xl text-right dir-rtl space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3 pb-4 border-b border-current/10">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-saban-gold/15 text-saban-gold rounded-2xl border border-saban-gold/30">
            <Calculator size={24} />
          </div>
          <div>
            <h3 className="text-xl font-serif font-bold text-current">מחשבון כמויות וכיסוי שטח</h3>
            <p className="text-xs text-current/60 font-medium">חישוב מוערך של כמות האריזות הנדרשת לפי מידות הפרויקט</p>
          </div>
        </div>

        {product.coverage && (
          <div className="px-3 py-1.5 bg-saban-gold/10 border border-saban-gold/30 rounded-full text-xs font-black text-saban-gold flex items-center gap-1.5">
            <Sparkles size={14} />
            <span>כיסוי: {product.coverage}</span>
          </div>
        )}
      </div>

      {/* Mode Switcher */}
      <div className="flex bg-white/5 border border-white/10 p-1 rounded-2xl gap-1">
        <button
          onClick={() => setCalcMode('dimensions')}
          className={`flex-1 py-2.5 px-4 rounded-xl text-xs font-black transition-all flex items-center justify-center gap-2 ${
            calcMode === 'dimensions'
              ? 'bg-saban-gold text-black shadow-md font-bold'
              : 'text-current/60 hover:text-current hover:bg-white/5'
          }`}
        >
          <Ruler size={16} />
          <span>חישוב לפי אורך x רוחב</span>
        </button>
        <button
          onClick={() => setCalcMode('area')}
          className={`flex-1 py-2.5 px-4 rounded-xl text-xs font-black transition-all flex items-center justify-center gap-2 ${
            calcMode === 'area'
              ? 'bg-saban-gold text-black shadow-md font-bold'
              : 'text-current/60 hover:text-current hover:bg-white/5'
          }`}
        >
          <Calculator size={16} />
          <span>להזנת שטח כולל (מ"ר)</span>
        </button>
      </div>

      {/* Inputs Grid */}
      {calcMode === 'dimensions' ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-current/70 block">אורך השטח (במטרים):</label>
            <div className="relative">
              <input
                type="number"
                min="0.1"
                step="0.1"
                value={length}
                onChange={(e) => setLength(e.target.value)}
                className="w-full bg-white/5 border border-white/15 rounded-xl px-4 py-3 text-current font-bold text-base focus:border-saban-gold focus:outline-none focus:ring-1 focus:ring-saban-gold/50"
                placeholder="0"
              />
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-bold text-current/40">מטרים</span>
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold text-current/70 block">רוחב השטח (במטרים):</label>
            <div className="relative">
              <input
                type="number"
                min="0.1"
                step="0.1"
                value={width}
                onChange={(e) => setWidth(e.target.value)}
                className="w-full bg-white/5 border border-white/15 rounded-xl px-4 py-3 text-current font-bold text-base focus:border-saban-gold focus:outline-none focus:ring-1 focus:ring-saban-gold/50"
                placeholder="0"
              />
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-bold text-current/40">מטרים</span>
            </div>
          </div>
        </div>
      ) : (
        <div className="space-y-1.5">
          <label className="text-xs font-bold text-current/70 block">שטח פנים כולל במ"ר:</label>
          <div className="relative">
            <input
              type="number"
              min="0.1"
              step="0.5"
              value={totalAreaInput}
              onChange={(e) => setTotalAreaInput(e.target.value)}
              className="w-full bg-white/5 border border-white/15 rounded-xl px-4 py-3 text-current font-bold text-base focus:border-saban-gold focus:outline-none focus:ring-1 focus:ring-saban-gold/50"
              placeholder="0"
            />
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-bold text-current/40">מ"ר</span>
          </div>
        </div>
      )}

      {/* Additional Controls: Coats & Waste Buffer */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
        {/* Number of Coats */}
        <div className="space-y-2">
          <label className="text-xs font-bold text-current/70 flex items-center justify-between">
            <span>מספר שכבות יישום:</span>
            <span className="text-saban-gold font-black">{coats} שכבות</span>
          </label>
          <div className="flex items-center gap-2">
            {[1, 2, 3].map((c) => (
              <button
                key={c}
                onClick={() => setCoats(c)}
                className={`flex-1 py-2 rounded-xl text-xs font-bold border transition-all ${
                  coats === c
                    ? 'bg-saban-gold/20 border-saban-gold text-saban-gold font-black'
                    : 'bg-white/5 border-white/10 text-current/60 hover:border-white/20'
                }`}
              >
                {c} {c === 1 ? 'שכבה' : 'שכבות'}
              </button>
            ))}
          </div>
        </div>

        {/* Waste Buffer */}
        <div className="space-y-2">
          <label className="text-xs font-bold text-current/70 flex items-center justify-between">
            <span>מקדם ביטחון ופחת:</span>
            <span className="text-saban-gold font-black">+{bufferPercent}%</span>
          </label>
          <div className="flex items-center gap-2">
            {[5, 10, 15].map((b) => (
              <button
                key={b}
                onClick={() => setBufferPercent(b)}
                className={`flex-1 py-2 rounded-xl text-xs font-bold border transition-all ${
                  bufferPercent === b
                    ? 'bg-saban-gold/20 border-saban-gold text-saban-gold font-black'
                    : 'bg-white/5 border-white/10 text-current/60 hover:border-white/20'
                }`}
              >
                +{b}%
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Summary Box & Calculation Output */}
      <div className="bg-saban-gold/10 border border-saban-gold/30 rounded-2xl p-5 space-y-3 relative overflow-hidden">
        <div className="flex justify-between items-center text-xs text-current/80 font-bold border-b border-saban-gold/20 pb-2.5">
          <span>שטח בסיס מחושב:</span>
          <span className="text-current font-black text-sm">{baseArea.toFixed(1)} מ"ר</span>
        </div>
        <div className="flex justify-between items-center text-xs text-current/80 font-bold border-b border-saban-gold/20 pb-2.5">
          <span>שטח כולל ({coats} שכבות + {bufferPercent}% פחת):</span>
          <span className="text-current font-black text-sm">{effectiveArea.toFixed(1)} מ"ר</span>
        </div>
        <div className="flex justify-between items-center text-sm font-bold text-current pt-1">
          <span className="text-saban-gold font-black text-base">כמות אריזות מומלצת:</span>
          <div className="text-left dir-ltr">
            <span className="text-2xl font-black text-saban-gold">{recommendedUnits}</span>
            <span className="text-xs font-bold text-current/60 mr-1.5">אריזות/יחידות</span>
          </div>
        </div>

        {totalPrice > 0 && (
          <div className="flex justify-between items-center pt-2 text-xs font-bold text-current/70 border-t border-saban-gold/20">
            <span>סה"כ מחיר משוער:</span>
            <span className="text-base font-black text-current">₪{totalPrice.toLocaleString()}</span>
          </div>
        )}
      </div>

      {/* Add to Cart Button */}
      <motion.button
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.97 }}
        onClick={handleAddCalcToCart}
        className={`w-full py-4 px-6 rounded-2xl font-black text-sm tracking-wider uppercase transition-all flex items-center justify-center gap-3 shadow-xl ${
          addedSuccess
            ? 'bg-emerald-500 text-white shadow-emerald-500/30'
            : 'bg-saban-gold hover:bg-white text-black shadow-saban-gold/25'
        }`}
      >
        {addedSuccess ? (
          <>
            <Check size={20} className="animate-bounce" />
            <span>נוספו {recommendedUnits} אריזות לסל הקניות בהצלחה!</span>
          </>
        ) : (
          <>
            <ShoppingBag size={20} />
            <span>
              הוסף {recommendedUnits} {recommendedUnits === 1 ? 'אריזה' : 'אריזות'} לסל הקניות
              {totalPrice > 0 ? ` (₪${totalPrice.toLocaleString()})` : ''}
            </span>
          </>
        )}
      </motion.button>
    </div>
  );
};
