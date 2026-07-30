import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Menu, X, ShoppingBag, Search, Sparkles, Download, Settings, Sun, Moon, Monitor, Check, Heart } from 'lucide-react';

interface NavbarProps {
  onCategorySelect?: (category: string) => void;
  onBrandSelect?: (brand: string) => void;
  onLogoClick?: () => void;
  onAdminEnter?: () => void;
  onEncyclopediaEnter?: () => void;
  searchQuery?: string;
  onSearchChange?: (query: string) => void;
  isInstallable?: boolean;
  onInstall?: () => void;
  cartCount?: number;
  wishlistCount?: number;
  showWishlistOnly?: boolean;
  onWishlistToggle?: () => void;
  activeCategory?: string | null;
  activeBrand?: string | null;
  categories?: any[];
  brands?: any[];
  theme?: 'light' | 'dark' | 'system';
  onThemeChange?: (theme: 'light' | 'dark' | 'system') => void;
}

export const Navbar: React.FC<NavbarProps> = ({ 
  onCategorySelect = () => {}, 
  onBrandSelect = () => {},
  onLogoClick = () => {},
  onAdminEnter = () => {},
  onEncyclopediaEnter = () => {},
  searchQuery = '', 
  onSearchChange = () => {},
  isInstallable = false,
  onInstall = () => {},
  cartCount = 0,
  wishlistCount = 0,
  showWishlistOnly = false,
  onWishlistToggle = () => {},
  activeCategory = null,
  activeBrand = null,
  categories = [],
  brands = [],
  theme = 'system',
  onThemeChange = () => {}
}) => {
  const [isOpen, setIsOpen] = React.useState(false);
  const [isSearchVisible, setIsSearchVisible] = React.useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = React.useState(false);

  return (
    <nav className="fixed top-0 left-0 right-0 z-50">
      {/* Top Bar */}
      <div className="glass-morphism h-20 flex items-center transition-[var(--transition-theme)]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
          <div className="flex justify-between items-center">
            {/* Right side: App Links (Desktop) */}
            <div className="hidden md:flex items-center space-x-6 space-x-reverse rtl">
              <button
                onClick={onEncyclopediaEnter}
                className="flex items-center gap-2 text-[10px] font-black text-saban-gold hover:text-white transition-all bg-white/5 px-4 py-2 rounded-full border border-saban-gold/20 tracking-[0.2em] shadow-sm shadow-black/5"
              >
                <Sparkles className="w-3 h-3" />
                <span>אנציקלופדיית חומרי בניין</span>
              </button>
              {isInstallable && (
                <button
                  onClick={onInstall}
                  className="flex items-center gap-2 text-[10px] font-black text-white bg-saban-gold px-4 py-2 rounded-full hover:scale-105 transition-all shadow-lg shadow-saban-gold/20 tracking-[0.1em]"
                >
                  <Download className="w-3 h-3" />
                  <span>הורד אפליקציה</span>
                </button>
              )}
            </div>

            {/* Center: Logo */}
            <div 
              className="flex-shrink-0 flex items-center cursor-pointer select-none group py-2"
              onClick={onLogoClick}
              onDoubleClick={onAdminEnter}
            >
              <img 
                src="https://i.postimg.cc/G20PxSVq/Gemini-Generated-Image-gmd5k7gmd5k7gmd5.png" 
                alt="ח.סבן חומרי בנין" 
                className="h-12 md:h-16 w-auto object-contain filter drop-shadow-[0_0_10px_rgba(212,175,55,0.3)] transition-all group-hover:scale-105"
              />
            </div>

              {/* Left side: Icons & Search */}
            <div className="flex items-center space-x-2 md:space-x-4 rtl">
              <div className="relative flex items-center">
                <AnimatePresence>
                  {isSearchVisible && (
                    <motion.input
                      initial={{ width: 0, opacity: 0 }}
                      animate={{ width: 200, opacity: 1 }}
                      exit={{ width: 0, opacity: 0 }}
                      type="text"
                      value={searchQuery}
                      onChange={(e) => onSearchChange(e.target.value)}
                      placeholder="חיפוש מוצר..."
                      className="bg-white/20 border border-white/30 rounded-full py-1.5 px-4 text-sm focus:outline-none focus:border-saban-gold/50 text-current ml-2 transition-[var(--transition-theme)] font-bold"
                      autoFocus
                    />
                  )}
                </AnimatePresence>
                <button 
                  onClick={() => setIsSearchVisible(!isSearchVisible)}
                  className="p-2 text-current hover:text-saban-gold transition-colors drop-shadow-sm"
                >
                  {isSearchVisible ? <X className="w-5 h-5" /> : <Search className="w-5 h-5" />}
                </button>
              </div>

              {/* Wishlist Button */}
              <button 
                onClick={onWishlistToggle}
                className={`relative p-2 transition-colors group drop-shadow-sm ${
                  showWishlistOnly ? 'text-rose-500' : 'text-current hover:text-rose-500'
                }`}
                title="מוצרים שאהבתי (מועדפים)"
              >
                <Heart className={`w-5 h-5 ${showWishlistOnly || wishlistCount > 0 ? 'fill-rose-500 text-rose-500' : 'group-hover:text-rose-500'}`} />
                <AnimatePresence>
                  {wishlistCount > 0 && (
                    <motion.span
                      initial={{ scale: 0, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      exit={{ scale: 0, opacity: 0 }}
                      key={wishlistCount}
                      className="absolute top-0 right-0 w-4 h-4 bg-rose-500 text-white text-[10px] font-black rounded-full flex items-center justify-center border border-black shadow-sm"
                    >
                      {wishlistCount}
                    </motion.span>
                  )}
                </AnimatePresence>
              </button>

              <button className="relative p-2 text-current hover:text-saban-gold transition-colors group drop-shadow-sm">
                <ShoppingBag className="w-5 h-5 group-hover:text-saban-gold transition-colors" />
                <AnimatePresence>
                  {cartCount > 0 && (
                    <motion.span
                      initial={{ scale: 0, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      exit={{ scale: 0, opacity: 0 }}
                      key={cartCount}
                      className="absolute top-0 right-0 w-4 h-4 bg-saban-gold text-black text-[10px] font-black rounded-full flex items-center justify-center border border-black shadow-sm"
                    >
                      {cartCount}
                    </motion.span>
                  )}
                </AnimatePresence>
              </button>

              <button className="md:hidden p-2 text-current" onClick={() => setIsOpen(!isOpen)}>
                {isOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Sub-Nav: Categories Strip */}
      <div className="glass-morphism border-t-0 border-b border-white/5 py-3 overflow-hidden transition-[var(--transition-theme)]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-3 overflow-x-auto no-scrollbar scroll-smooth snap-x">
             {categories.map((cat) => (
                <motion.button
                  key={cat.id}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => onCategorySelect(cat.id)}
                  className={`flex-shrink-0 snap-start flex items-center gap-3 px-6 py-3 rounded-2xl border-2 transition-all duration-300 min-w-[140px] glass-ripple pointer-events-auto ${
                    activeCategory === cat.id 
                    ? 'bg-saban-gold border-saban-gold text-saban-black shadow-[0_0_20px_rgba(212,175,55,0.4)]' 
                    : 'bg-white/10 border-white/20 text-[#0f172a] dark:text-[#f8fafc] hover:border-saban-gold/50 hover:text-saban-gold hover:shadow-[0_0_15px_rgba(212,175,55,0.1)]'
                  }`}
                >
                  {cat.icon && (
                    <img src={cat.icon} className={`w-6 h-6 object-contain ${activeCategory === cat.id ? 'brightness-100' : 'invert dark:invert-0'}`} alt="" />
                  )}
                  <span className="text-sm font-bold tracking-tight">{cat.name}</span>
                </motion.button>
             ))}
             {categories.length === 0 && (
                <div className="flex gap-4">
                  {[1,2,3,4].map(i => (
                    <div key={i} className="w-32 h-12 bg-white/5 rounded-2xl animate-pulse" />
                  ))}
                </div>
             )}
          </div>
        </div>
      </div>

      {/* Brand Filter Strip */}
      <div className="glass-morphism border-t-0 border-b border-white/5 py-3 transition-[var(--transition-theme)]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-2 overflow-x-auto no-scrollbar">
            <span className="text-[10px] font-black text-current/20 uppercase tracking-[0.2em] ml-4 whitespace-nowrap">סנן לפי מותג:</span>
            {brands.map((brand) => (
              <motion.button
                key={brand.id}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => onBrandSelect(brand.name)}
                className={`flex-shrink-0 px-4 py-1.5 rounded-full border text-xs font-black transition-all duration-200 glass-ripple pointer-events-auto ${
                  activeBrand === brand.name
                  ? 'bg-saban-gold text-black border-saban-gold shadow-[0_0_10px_rgba(212,175,55,0.2)]'
                  : 'bg-white/10 border-white/20 text-[#0f172a] dark:text-[#f8fafc] hover:text-saban-gold hover:border-saban-gold/30'
                }`}
              >
                {brand.name}
              </motion.button>
            ))}
          </div>
        </div>
      </div>

      {/* Mobile Menu - Slide out Drawer style */}
      <AnimatePresence>
        {isOpen && (
          <>
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsOpen(false)}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[-1]"
            />
            <motion.div 
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              className="fixed top-0 right-0 bottom-0 w-[80%] max-w-sm glass-morphism border-l border-white/10 p-6 z-[60] shadow-2xl transition-[var(--transition-theme)]"
            >
              <div className="flex justify-between items-center mb-10">
                <img 
                  src="https://i.postimg.cc/G20PxSVq/Gemini-Generated-Image-gmd5k7gmd5k7gmd5.png" 
                  alt="ח.סבן" 
                  className="h-10 w-auto object-contain"
                />
                <button onClick={() => setIsOpen(false)} className="touch-target text-current/40"><X size={24} /></button>
              </div>

              <div className="space-y-4">
                <button
                  onClick={() => { onEncyclopediaEnter(); setIsOpen(false); }}
                  className="w-full text-right p-4 rounded-2xl bg-white/5 border border-saban-gold/20 text-saban-gold font-bold flex items-center justify-between group shadow-lg shadow-saban-gold/10"
                >
                  <span>אנציקלופדיית חומרי בניין</span>
                  <Sparkles size={20} className="animate-pulse" />
                </button>

                <div className="h-px bg-white/5 my-6" />

                <div className="text-[10px] text-current/20 uppercase tracking-[0.2em] mb-4 pr-4">מחלקות המוצרים</div>
                
                <div className="grid grid-cols-1 gap-2">
                  {categories.map((cat) => (
                    <button
                      key={cat.id}
                      onClick={() => {
                        onCategorySelect(cat.id);
                        setIsOpen(false);
                      }}
                      className={`w-full text-right p-4 text-sm font-bold rounded-2xl transition-all flex items-center justify-between group ${
                        activeCategory === cat.id ? 'bg-saban-gold text-saban-black shadow-lg shadow-saban-gold/20' : 'text-current/60 hover:bg-white/5'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        {cat.icon && (
                          <img 
                            src={cat.icon} 
                            className={`w-6 h-6 object-contain transition-all ${activeCategory === cat.id ? 'brightness-0' : 'opacity-40 group-hover:opacity-100'}`} 
                            alt="" 
                          />
                        )}
                        <span>{cat.name}</span>
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              <div className="absolute bottom-8 left-6 right-6">
                {isInstallable && (
                  <button
                    onClick={onInstall}
                    className="w-full p-4 bg-saban-gold text-black rounded-2xl font-black text-sm flex items-center justify-center gap-3 shadow-xl shadow-saban-gold/20"
                  >
                    <Download size={20} />
                    <span>התקן אפליקציה</span>
                  </button>
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Fixed Theme Switcher - Moved to root level for consistent visibility */}
      <div className="fixed top-24 left-5 z-[9999] pointer-events-none">
        <div className="relative pointer-events-auto">
          <button 
            onClick={() => setIsSettingsOpen(!isSettingsOpen)}
            className="p-3 bg-[#0f172a] dark:bg-[#f8fafc] text-[#f8fafc] dark:text-[#0f172a] border border-saban-gold/40 rounded-full shadow-2xl hover:scale-110 transition-all will-change-transform group"
            title="Design Settings"
          >
            <Settings className={`w-6 h-6 group-hover:rotate-90 transition-transform duration-500`} />
          </button>
          
          <AnimatePresence>
            {isSettingsOpen && (
              <motion.div
                initial={{ opacity: 0, x: -20, scale: 0.95 }}
                animate={{ opacity: 1, x: 0, scale: 1 }}
                exit={{ opacity: 0, x: -20, scale: 0.95 }}
                className="absolute top-full left-0 mt-3 w-48 glass-morphism rounded-3xl p-2 shadow-2xl border-saban-gold/20"
              >
                <div className="text-[10px] font-black text-current/40 uppercase tracking-widest px-4 py-2 border-b border-white/10 mb-1">ממשק תצוגה</div>
                <div className="space-y-1">
                  {[
                    { id: 'light', label: 'בהיר', icon: Sun },
                    { id: 'dark', label: 'כהה', icon: Moon },
                    { id: 'system', label: 'בהיר/כהה', icon: Monitor }
                  ].map((opt) => (
                    <button
                      key={opt.id}
                      onClick={() => {
                        onThemeChange?.(opt.id as any);
                        setIsSettingsOpen(false);
                      }}
                      className={`w-full flex items-center justify-between px-3 py-2.5 rounded-2xl text-sm font-bold transition-all ${
                        theme === opt.id 
                          ? 'bg-saban-gold text-black shadow-lg shadow-saban-gold/20' 
                          : 'hover:bg-white/10 text-current'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <opt.icon className="w-4 h-4" />
                        <span>{opt.label}</span>
                      </div>
                      {theme === opt.id && <Check className="w-3 h-3" />}
                    </button>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </nav>
  );
};
