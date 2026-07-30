// src/components/ProductDetail.tsx
import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ArrowLeft, Play, ChevronRight, ChevronLeft, ImageOff, ExternalLink, Box, ShoppingBag, Sparkles, Image as ImageIcon, Share2, MessageCircle } from 'lucide-react';
import { NoaAssistant } from './NoaAssistant';
import { ProductService, EncyclopediaService } from '../services/firebaseService';
import { ShareService } from '../services/ShareService';
import { useInputType } from '../hooks/useInputType';

// עדכון ה-Interface שיתאים לשדות השטוחים מה-DB שלך
import { VideoPlayer } from './VideoPlayer';
import { ThreeDViewer } from './ThreeDViewer';

interface Product {
  id: string;
  name: string;
  sku?: string;
  category: string;
  brand?: string;
  presentationId?: string;
  tutorialUrl?: string;
  description: string;
  imageUrl?: string;
  imageUrl2?: string;
  imageUrl3?: string;
  images?: string[];
  price?: number;
  dryingTime?: string;
  coverage?: string;
  applicationMethod?: string;
  waitBetweenCoats?: string;
  stock?: number;
  multimedia?: string[];
  modelUrl?: string;
}

interface ProductDetailProps {
  product: Product;
  onBack: () => void;
  onNavigateToProduct?: (sku: string) => void;
  onNextProduct?: () => void;
  onPrevProduct?: () => void;
}

const ProductImage: React.FC<{ src: string; alt: string; className?: string }> = ({ src, alt, className }) => {
  const [error, setError] = React.useState(false);
  const sanitized = ProductService.sanitizeImageUrl(src);

  if (error) {
    return (
      <div className={`flex flex-col items-center justify-center glass-morphism rounded-2xl p-8 text-center ${className}`}>
        <ImageOff size={48} className="text-white/20 mb-4" />
        <h4 className="text-white/60 font-medium mb-1">תמונה בטעינה / חסומה</h4>
        <p className="text-white/30 text-xs mb-4">לא ניתן להציג את התמונה כרגע עקב מגבלות אבטחה</p>
        <a 
          href={sanitized} 
          target="_blank" 
          rel="noreferrer" 
          className="flex items-center gap-2 px-4 py-2 bg-saban-gold/10 text-saban-gold rounded-full text-xs font-bold hover:bg-saban-gold hover:text-black transition-all"
        >
          <ExternalLink size={14} />
          <span>צפייה במקור</span>
        </a>
      </div>
    );
  }

  return (
    <img 
      src={sanitized} 
      alt={alt} 
      className={className} 
      onError={() => {
        console.warn(`Image failed to load: ${sanitized}`);
        setError(true);
      }}
    />
  );
};

const RelatedProductCard: React.FC<{ product: Product; onClick?: (sku: string) => void }> = ({ product, onClick }) => {
  return (
    <motion.button
      whileHover={{ y: -5 }}
      whileTap={{ scale: 0.98 }}
      onClick={() => onClick?.(product.sku || product.id)}
      className="flex flex-col glass-morphism rounded-2xl overflow-hidden group text-right rtl shadow-sm hover:shadow-xl transition-all"
      dir="rtl"
    >
      <div className="aspect-square overflow-hidden relative">
        <ProductImage 
          src={product.imageUrl || ''} 
          alt={product.name} 
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" 
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-4">
          <span className="text-saban-gold text-xs font-bold flex items-center gap-1">
            לפרטים נוספים <ChevronLeft size={14} />
          </span>
        </div>
      </div>
      <div className="p-4 flex-grow flex flex-col justify-between">
        <div>
          <span className="text-[10px] text-saban-gold uppercase tracking-wider font-black">{product.category}</span>
          <h4 className="text-current font-serif text-lg leading-tight mt-1 group-hover:text-saban-gold transition-colors font-bold">{product.name}</h4>
        </div>
        {product.price && (
          <div className="mt-3 text-current font-black">₪{product.price}</div>
        )}
      </div>
    </motion.button>
  );
};

export const ProductDetail: React.FC<ProductDetailProps> = ({ 
  product, 
  onBack, 
  onNavigateToProduct,
  onNextProduct,
  onPrevProduct 
}) => {
  const inputType = useInputType();
  const [relatedProducts, setRelatedProducts] = React.useState<{ complementary: Product[]; upsells: Product[] }>({ complementary: [], upsells: [] });
  const [isLoadingRelated, setIsLoadingRelated] = React.useState(true);

  // Swipe Gesture Handling for Mobile
  const touchStartX = React.useRef<number | null>(null);
  const touchStartY = React.useRef<number | null>(null);

  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
    touchStartY.current = e.touches[0].clientY;
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStartX.current === null || touchStartY.current === null) return;
    const deltaX = e.changedTouches[0].clientX - touchStartX.current;
    const deltaY = e.changedTouches[0].clientY - touchStartY.current;

    // Minimum horizontal swipe distance of 45px, horizontal slope > 1.2
    if (Math.abs(deltaX) > 45 && Math.abs(deltaX) > Math.abs(deltaY) * 1.2) {
      if (deltaX < 0) {
        // Swiped Left -> Go to Next Product
        onNextProduct?.();
      } else {
        // Swiped Right -> Go to Prev Product
        onPrevProduct?.();
      }
    }

    touchStartX.current = null;
    touchStartY.current = null;
  };

  // Fetch related products
  React.useEffect(() => {
    const fetchRelated = async () => {
      setIsLoadingRelated(true);
      try {
        const related = await ProductService.getRelatedProducts(product);
        setRelatedProducts(related as { complementary: Product[]; upsells: Product[] });
      } catch (err) {
        console.error("Failed to load related products", err);
      } finally {
        setIsLoadingRelated(false);
      }
    };
    fetchRelated();
  }, [product.id, product.category]);

  // לוגיקת תמונות משודרגת - תמיכה ב-imageUrl כברירת מחדל
  const allImages = React.useMemo(() => {
    const imgs = product.images || [];
    const collected: string[] = [];
    
    if (product.imageUrl) collected.push(product.imageUrl);
    if (product.imageUrl2) collected.push(product.imageUrl2);
    if (product.imageUrl3) collected.push(product.imageUrl3);
    
    // Add unique images from the array if any
    imgs.forEach(img => {
      if (!collected.includes(img)) collected.push(img);
    });
    
    if (collected.length === 0) return ['https://placehold.co/800?text=Saban+Products'];
    return collected.map(img => ProductService.sanitizeImageUrl(img));
  }, [product.images, product.imageUrl, product.imageUrl2, product.imageUrl3]);

  const [currentImageIndex, setCurrentImageIndex] = React.useState(0);
  const [show3D, setShow3D] = React.useState(false);
  const [triggerProd, setTriggerProd] = React.useState<any>(null);

  // Reset states when product changes
  React.useEffect(() => {
    setCurrentImageIndex(0);
    setShow3D(false);
  }, [product.id]);

  const nextImage = () => {
    setCurrentImageIndex((prev) => (prev + 1) % allImages.length);
  };

  const prevImage = () => {
    setCurrentImageIndex((prev) => (prev - 1 + allImages.length) % allImages.length);
  };

  const [isSearchingMedia, setIsSearchingMedia] = React.useState(true);
  const [discoveredMedia, setDiscoveredMedia] = React.useState<any[]>([]);

  // Search for linked media in encyclopedia
  React.useEffect(() => {
    setIsSearchingMedia(true);
    const unsub = EncyclopediaService.listenItems((items) => {
      const related = items.filter(item => {
        const sku = product.sku || product.id;
        return item.associatedSku === sku || (Array.isArray(item.associatedSkus) && item.associatedSkus.includes(sku));
      });
      setDiscoveredMedia(related);
      setIsSearchingMedia(false);
    });
    return () => unsub();
  }, [product.sku, product.id]);

  // Memoized search check
  const hasProfessionalMedia = React.useMemo(() => {
    return product.presentationId || product.tutorialUrl || discoveredMedia.length > 0;
  }, [product.presentationId, product.tutorialUrl, discoveredMedia]);

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
      className="min-h-screen transition-[var(--transition-theme)] pt-28 pb-32 rtl text-right relative select-none" 
      dir="rtl"
      style={{ backgroundColor: 'var(--page-bg)', color: 'var(--glass-text)' }}
    >
      {/* Floating Side Arrows for Desktop/Tablet */}
      {onPrevProduct && (
        <button
          onClick={onPrevProduct}
          className="hidden md:flex fixed right-4 top-1/2 -translate-y-1/2 z-40 p-3 bg-black/60 hover:bg-saban-gold text-white hover:text-black rounded-full backdrop-blur-md border border-white/20 shadow-2xl transition-all"
          title="מוצר קודם"
        >
          <ChevronRight size={24} />
        </button>
      )}

      {onNextProduct && (
        <button
          onClick={onNextProduct}
          className="hidden md:flex fixed left-4 top-1/2 -translate-y-1/2 z-40 p-3 bg-black/60 hover:bg-saban-gold text-white hover:text-black rounded-full backdrop-blur-md border border-white/20 shadow-2xl transition-all"
          title="מוצר הבא"
        >
          <ChevronLeft size={24} />
        </button>
      )}

      {/* PROFESSIONAL TRAINING FAB / SHIMMER BUTTON */}
      <AnimatePresence>
        {hasProfessionalMedia && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8, x: 20 }}
            animate={{ opacity: 1, scale: 1, x: 0 }}
            className="fixed bottom-24 right-6 min-[1300px]:right-24 z-[100]"
          >
            <motion.button
              whileHover={{ scale: 1.05, y: -5 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => {
                const targetMedia = discoveredMedia[0] || { type: product.presentationId ? 'slide' : 'video', url: product.tutorialUrl };
                window.dispatchEvent(new CustomEvent('portal-navigation', { 
                  detail: { type: 'encyclopedia', productSku: product.sku, mediaId: targetMedia?.id } 
                }));
              }}
              className="relative group overflow-hidden px-8 py-4 bg-saban-gold rounded-full shadow-[0_15px_40px_rgba(197,160,89,0.4)] flex items-center gap-3 border-2 border-white/20"
            >
              <motion.div 
                animate={{ 
                  left: ['-100%', '200%']
                }}
                transition={{ 
                  duration: 2, 
                  repeat: Infinity, 
                  ease: "linear",
                  repeatDelay: 1
                }}
                className="absolute inset-0 w-1/2 h-full bg-gradient-to-r from-transparent via-white/40 to-transparent skew-x-12"
              />
              <Sparkles size={20} className="text-black animate-pulse" />
              <span className="text-black font-black uppercase tracking-widest text-sm relative z-10">צפה בהדרכה מקצועית</span>
            </motion.button>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Mobile Swipe Navigation Toolbar */}
        {(onNextProduct || onPrevProduct) && (
          <div className="flex items-center justify-between mb-6 bg-white/5 border border-white/10 p-2.5 rounded-2xl md:hidden">
            <button
              onClick={onPrevProduct}
              disabled={!onPrevProduct}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-saban-gold/10 text-saban-gold font-bold text-xs hover:bg-saban-gold hover:text-black transition-all disabled:opacity-30"
            >
              <ChevronRight size={16} />
              <span>הקודם</span>
            </button>
            <div className="text-[11px] text-current/60 font-medium flex items-center gap-1 dir-rtl">
              <span>← החלק שמאלה/ימינה למעבר →</span>
            </div>
            <button
              onClick={onNextProduct}
              disabled={!onNextProduct}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-saban-gold/10 text-saban-gold font-bold text-xs hover:bg-saban-gold hover:text-black transition-all disabled:opacity-30"
            >
              <span>הבא</span>
              <ChevronLeft size={16} />
            </button>
          </div>
        )}

        <div className="flex justify-between items-center mb-8">
          <button 
            onClick={onBack} 
            className="flex items-center gap-2 text-current/60 hover:text-current transition-colors group touch-target"
          >
            <ArrowLeft className="w-5 h-5 transition-transform group-hover:translate-x-1" />
            <span className="font-bold uppercase tracking-widest text-xs">חזרה לקטלוג</span>
          </button>

          <div className="flex gap-3">
            <motion.button
              whileHover={{ scale: 1.1, backgroundColor: 'rgba(37, 211, 102, 0.1)' }}
              whileTap={{ scale: 0.9 }}
              onClick={() => {
                ShareService.shareToWhatsApp(product);
                ShareService.trackShare(`WhatsApp_Shared_${product.name.replace(/\s+/g, '_')}`);
              }}
              className="w-12 h-12 rounded-full border-2 border-[#25D366]/50 bg-[#25D366]/5 text-[#25D366] flex items-center justify-center shadow-[0_0_15px_rgba(37,211,102,0.1)] transition-all"
              title="שתף ב-WhatsApp"
            >
              <MessageCircle size={20} fill="currentColor" fillOpacity={0.1} />
            </motion.button>

            <motion.button
              whileHover={{ scale: 1.1, backgroundColor: 'rgba(214, 175, 55, 0.2)' }}
              whileTap={{ scale: 0.9 }}
              onClick={() => {
                ShareService.shareProduct(product, window.location.origin);
              }}
              className="w-12 h-12 rounded-full border-2 border-saban-gold bg-saban-gold/10 text-saban-gold flex items-center justify-center shadow-[0_0_15px_rgba(214,175,55,0.2)] transition-all"
              title="שתף מוצר"
            >
              <Share2 size={20} />
            </motion.button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 md:gap-12">
          {/* תצוגת מדיה */}
          <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}>
            {product.modelUrl && (
              <div className="flex gap-2 mb-4">
                <button 
                  onClick={() => setShow3D(false)}
                  className={`flex-1 py-3 rounded-xl border font-bold text-xs uppercase tracking-widest flex items-center justify-center gap-2 transition-all ${
                    !show3D ? 'bg-saban-gold text-black border-saban-gold shadow-lg shadow-saban-gold/20' : 'glass-morphism text-current/40 border-white/10 hover:bg-white/10'
                  }`}
                >
                  <ImageIcon size={14} />
                  <span>גלריית תמונות</span>
                </button>
                <button 
                  onClick={() => setShow3D(true)}
                  className={`flex-1 py-3 rounded-xl border font-bold text-xs uppercase tracking-widest flex items-center justify-center gap-2 transition-all ${
                    show3D ? 'bg-saban-gold text-black border-saban-gold shadow-lg shadow-saban-gold/20' : 'glass-morphism text-current/40 border-white/10 hover:bg-white/10'
                  }`}
                >
                  <Box size={14} />
                  <span>מבט תלת-מימדי</span>
                </button>
              </div>
            )}

            <div className="relative aspect-square glass-morphism rounded-3xl overflow-hidden group flex items-center justify-center shadow-3xl">
                <AnimatePresence mode="wait">
                  {show3D && product.modelUrl ? (
                    <motion.div
                      key="3d-viewer"
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 1.05 }}
                      className="w-full h-full"
                    >
                      <ThreeDViewer modelUrl={product.modelUrl} />
                    </motion.div>
                  ) : (
                    <motion.div
                      key={currentImageIndex}
                      initial={{ opacity: 0, scale: 1.05 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                      transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
                      className="w-full h-full"
                    >
                      <ProductImage 
                        src={allImages[currentImageIndex]} 
                        alt={product.name}
                        className="w-full h-full object-cover"
                      />
                    </motion.div>
                  )}
                </AnimatePresence>

                {!show3D && allImages.length > 1 && (
                  <>
                    <button 
                      onClick={prevImage}
                      className="absolute right-4 top-1/2 -translate-y-1/2 p-3 bg-black/40 backdrop-blur-md rounded-full text-white opacity-0 group-hover:opacity-100 transition-all hover:bg-saban-gold hover:text-black z-10"
                    >
                      <ChevronRight className="w-6 h-6" />
                    </button>
                    <button 
                      onClick={nextImage}
                      className="absolute left-4 top-1/2 -translate-y-1/2 p-3 bg-black/40 backdrop-blur-md rounded-full text-white opacity-0 group-hover:opacity-100 transition-all hover:bg-saban-gold hover:text-black z-10"
                    >
                      <ChevronLeft className="w-6 h-6" />
                    </button>
                  </>
                )}
             </div>

             {/* Thumbnails */}
             {!show3D && allImages.length > 1 && (
                <div className="flex gap-4 mt-4 overflow-x-auto pb-2 scrollbar-none">
                  {allImages.map((img, i) => (
                    <button
                      key={i}
                      onClick={() => setCurrentImageIndex(i)}
                      className={`flex-shrink-0 w-20 h-20 rounded-xl overflow-hidden border-2 transition-all duration-300 ${
                        currentImageIndex === i ? 'border-saban-gold scale-105' : 'border-transparent opacity-40 hover:opacity-100'
                      }`}
                    >
                      <ProductImage src={img} alt="" className="w-full h-full object-cover" />
                    </button>
                  ))}
                </div>
             )}

             {/* Video Tutorial Integration */}
             {product.tutorialUrl && (
               <div className="mt-8 space-y-4">
                 <h3 className="text-xl font-serif text-current border-r-4 border-saban-gold pr-4 font-bold">סרטון הדרכה ויישום</h3>
                 <VideoPlayer url={product.tutorialUrl} poster={product.imageUrl} />
               </div>
             )}

             {/* קישורי וידאו נוספים */}
             {product.multimedia && product.multimedia.length > 0 && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-6">
                  {product.multimedia.map((url, i) => (
                    <a 
                      key={i}
                      href={url}
                      target="_blank"
                      rel="noreferrer"
                      className="flex items-center gap-3 p-4 bg-white/10 border border-white/20 rounded-2xl hover:bg-white/20 transition-all group pointer-events-auto"
                    >
                      <div className="w-10 h-10 rounded-full bg-red-600/10 flex items-center justify-center text-red-600 group-hover:scale-110 transition-transform">
                        <Play className="w-4 h-4 fill-current" />
                      </div>
                      <span className="text-sm font-black text-current">הדרכת וידאו נוספת</span>
                    </a>
                  ))}
                </div>
             )}

             {/* תצוגת מצגת Google Slides */}
             {product.presentationId && (
               <div className="mt-8 space-y-4">
                 <h3 className="text-current border-r-4 border-saban-gold pr-4 font-bold">מצגת טכנית</h3>
                 <div className="relative aspect-video glass-morphism rounded-3xl overflow-hidden shadow-2xl">
                    <iframe 
                      src={`https://docs.google.com/presentation/d/${product.presentationId}/embed?start=false&loop=false&delayms=3000`} 
                      frameBorder="0" 
                      width="100%" 
                      height="100%" 
                      allowFullScreen={true}
                      className="absolute inset-0"
                    />
                 </div>
               </div>
             )}

             {/* הצגת מלאי זמין לנועה */}
             <div className="mt-4 p-4 glass-morphism rounded-2xl">
                <span className="text-current/60 text-sm font-bold">סטטוס מלאי: </span>
                <span className={product.stock !== undefined && product.stock > 0 ? "text-emerald-500 font-bold" : "text-rose-500 font-bold"}>
                    {product.stock !== undefined && product.stock > 0 ? `${product.stock} יחידות במלאי` : 'חסר במלאי'}
                </span>
             </div>
          </motion.div>

          <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} className="space-y-10">
              <div>
                <div className="flex justify-between items-start">
                  <div className="flex items-center gap-3">
                    <span className="text-saban-gold text-xs font-black tracking-[0.2em] uppercase">{product.category}</span>
                    {product.brand && (
                      <>
                        <span className="text-current/20">•</span>
                        <span className="px-3 py-1 bg-white/10 border border-white/20 rounded-full text-[9px] uppercase font-black tracking-tighter text-current">
                          {product.brand}
                        </span>
                      </>
                    )}
                  </div>
                  {product.price && product.price > 0 && (
                    <span className="text-4xl font-serif text-current font-black">₪{product.price}</span>
                  )}
                </div>
                <h1 className="text-5xl md:text-7xl font-serif text-current mt-4 leading-none tracking-tighter font-bold">{product.name}</h1>
                <p className="text-lg md:text-xl text-current/70 leading-relaxed mt-6 font-medium">{product.description}</p>
                
                <motion.button 
                  whileHover={inputType === 'mouse' ? { scale: 1.02 } : {}}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => {
                    if (window.navigator?.vibrate) window.navigator.vibrate(50);
                    setTriggerProd(product);
                  }}
                  className="mt-10 w-full px-12 py-5 bg-saban-gold text-black font-black uppercase tracking-widest rounded-2xl shadow-[0_20px_50px_rgba(197,160,89,0.3)] hover:bg-white transition-all duration-300 flex items-center justify-center gap-3 group"
                >
                  <ShoppingBag size={20} className="group-hover:rotate-12 transition-transform" />
                  <span>הוספה לסל הקניות</span>
                </motion.button>
              </div>

              <div className="space-y-8 p-8 bg-current/[0.02] border border-current/5 rounded-3xl backdrop-blur-sm">
                <h3 className="text-xl font-serif text-current flex items-center gap-3 font-bold">
                  <Box className="text-saban-gold" size={20} />
                  <span>מפרט טכני מלא</span>
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
                  {product.dryingTime && (
                    <div className="group">
                      <span className="block text-[10px] text-current/30 uppercase tracking-[0.2em] mb-2 group-hover:text-saban-gold transition-colors font-black">זמן ייבוש</span>
                      <span className="text-xl font-black text-current">{product.dryingTime}</span>
                    </div>
                  )}
                  {product.coverage && (
                    <div className="group">
                      <span className="block text-[10px] text-current/30 uppercase tracking-[0.2em] mb-2 group-hover:text-saban-gold transition-colors font-black">כושר כיסוי</span>
                      <span className="text-xl font-black text-current">{product.coverage}</span>
                    </div>
                  )}
                  {product.applicationMethod && (
                    <div className="group">
                      <span className="block text-[10px] text-current/30 uppercase tracking-[0.2em] mb-2 group-hover:text-saban-gold transition-colors font-black">שיטת יישום</span>
                      <span className="text-xl font-black text-current">{product.applicationMethod}</span>
                    </div>
                  )}
                  {product.sku && (
                    <div className="group">
                      <span className="block text-[10px] text-current/30 uppercase tracking-[0.2em] mb-2 group-hover:text-saban-gold transition-colors font-black">מק"ט מערכת</span>
                      <span className="text-xl font-mono text-current/80 font-bold">{product.sku}</span>
                    </div>
                  )}
                </div>
              </div>
          </motion.div>
        </div>

        {/* RELATED PRODUCTS SECTION */}
        <AnimatePresence>
          {(relatedProducts.complementary.length > 0 || relatedProducts.upsells.length > 0) && (
            <motion.div 
              initial={{ opacity: 0, y: 40 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="mt-20 pt-20 border-t border-white/10 space-y-24"
            >
              {/* UPSELLS */}
              {relatedProducts.upsells.length > 0 && (
                <div className="space-y-12">
                  <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                    <div className="space-y-4">
                      <div className="flex items-center gap-3">
                        <Sparkles className="text-saban-gold w-5 h-5" />
                        <span className="text-saban-gold text-xs font-black tracking-widest uppercase">שדרוג הפרויקט</span>
                      </div>
                      <h2 className="text-4xl md:text-6xl font-serif text-current tracking-tighter font-bold">פתרונות פרימיום</h2>
                      <p className="text-current/40 max-w-2xl text-lg font-medium">
                        מוצרים מתקדמים מאותה קטגוריה שיכולים להעניק תוצאה עמידה ומרשימה עוד יותר.
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-8">
                    {relatedProducts.upsells.map((p, idx) => (
                      <RelatedProductCard 
                        key={`${p.id || p.sku || 'upsell'}-${idx}`} 
                        product={p} 
                        onClick={onNavigateToProduct} 
                      />
                    ))}
                  </div>
                </div>
              )}

              {/* COMPLEMENTARY */}
              {relatedProducts.complementary.length > 0 && (
                <div className="space-y-12">
                  <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                    <div className="space-y-4">
                      <div className="flex items-center gap-3">
                        <ShoppingBag className="text-saban-gold w-5 h-5" />
                        <span className="text-saban-gold text-xs font-black tracking-widest uppercase">המלצות סבן</span>
                      </div>
                      <h2 className="text-4xl md:text-6xl font-serif text-current tracking-tighter font-bold">מוצרים משלימים</h2>
                      <p className="text-current/40 max-w-2xl text-lg font-medium">
                        השלם את המלאי שלך עם מוצרים דומים שמתאימים בדיוק לצרכי העבודה שלך.
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-8">
                    {relatedProducts.complementary.map((p, idx) => (
                      <RelatedProductCard 
                        key={`${p.id || p.sku || 'comp'}-${idx}`} 
                        product={p} 
                        onClick={onNavigateToProduct} 
                      />
                    ))}
                  </div>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
      
      {/* נועה מקבלת את ההקשר המלא של המוצר */}
      <NoaAssistant 
        productContext={JSON.stringify(product)} 
        triggerProduct={triggerProd}
        onTriggerProcessed={() => setTriggerProd(null)}
        onNavigateToProduct={onNavigateToProduct}
      />
    </motion.div>
  );
};