"use client";

import React, { useState, useEffect, useRef, useMemo, createContext } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import NextImage from 'next/image';
import { Navbar } from '@/components/Navbar';
import { ProductDetail } from '@/components/ProductDetail';
import { QuickViewModal } from '@/components/QuickViewModal';
import { NoaAssistant } from '@/components/NoaAssistant';
import { AdminDashboard } from '@/components/AdminDashboard';
import { SabanPedia } from '@/components/SabanPedia';
import { ProductService, CategoryService, BrandService } from '@/services/firebaseService';
import { LayoutGrid, List, Sparkles, Database, BookOpen, ImageOff, ExternalLink, Download, Home as HomeIcon, Box, Info, Tag, Settings } from 'lucide-react';
import { SplashScreen } from '@/components/SplashScreen';
import { useInputType } from '@/hooks/useInputType';
import { useGlobalTheme } from '@/context/GlobalThemeContext';

class RootErrorBoundary extends React.Component<{ children: React.ReactNode }, { hasError: boolean; count: number }> {
  constructor(props: any) {
    super(props);
    this.state = { hasError: false, count: 5 };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error: any, errorInfo: any) {
    console.error("ח.סבן - התאוששות חירום:", error, errorInfo);
  }

  componentDidUpdate(_prevProps: any, prevState: { hasError: boolean }) {
    if (this.state.hasError && !prevState.hasError) {
      const timer = setInterval(() => {
        this.setState(s => {
          if (s.count <= 1) {
            clearInterval(timer);
            window.location.reload();
          }
          return { count: s.count - 1 };
        });
      }, 1000);
    }
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex flex-col items-center justify-center p-8 text-center rtl selection:bg-saban-gold selection:text-black transition-[var(--transition-theme)]" dir="rtl" style={{ backgroundColor: 'var(--page-bg)', color: 'var(--glass-text)' }}>
          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="max-w-md space-y-8"
          >
            <div className="relative w-48 h-48 mx-auto mb-8">
              <img 
                src="https://i.postimg.cc/qqWtk5qr/Gemini-Generated-Image-6z6qts6z6qts6z6q.png" 
                alt="Noa"
                className="w-full h-full object-cover rounded-full border-2 border-saban-gold shadow-[0_0_50px_rgba(212,175,55,0.3)] animate-pulse"
              />
              <div className="absolute inset-0 rounded-full bg-gradient-to-t from-black/60 to-transparent opacity-40 dark:opacity-60" />
            </div>
            
            <div className="space-y-4">
              <h1 className="text-4xl font-serif text-saban-gold tracking-tighter">מערכת ח.סבן מתאוששת...</h1>
              <p className="text-current/60 text-lg leading-relaxed">זיהינו חוסר יציבות זמני בחיבור. נועה מבצעות אתחול מחדש למערכת המעטפת.</p>
            </div>

            <div className="flex flex-col items-center gap-6">
              <div className="w-full h-1 bg-current/10 rounded-full overflow-hidden">
                <motion.div 
                  initial={{ width: "0%" }}
                  animate={{ width: "100%" }}
                  transition={{ duration: 5, ease: "linear" }}
                  className="h-full bg-saban-gold"
                />
              </div>
              
              <p className="text-saban-gold font-mono text-sm uppercase tracking-widest">
                טעינה מחדש בעוד {this.state.count} שניות...
              </p>

              <button 
                onClick={() => window.location.reload()}
                className="px-8 py-3 bg-white/5 border border-white/10 text-current rounded-full font-bold hover:bg-white/10 hover:border-saban-gold/50 transition-all font-black"
              >
                נסה שוב כעת
              </button>
            </div>
          </motion.div>
        </div>
      );
    }
    return this.props.children;
  }
}

const ProductCardImage: React.FC<{ src: string; alt: string }> = ({ src, alt }) => {
  const [error, setError] = useState(false);
  const sanitized = ProductService.sanitizeImageUrl(src);

  if (error) {
    return (
      <div className="w-full h-full flex flex-col items-center justify-center bg-white/5 p-4 text-center">
        <ImageOff size={32} className="text-current/10 mb-2" />
        <span className="text-[10px] text-current/40 uppercase tracking-tighter mb-2">Image Blocked</span>
        <a 
          href={sanitized} 
          target="_blank" 
          rel="noreferrer" 
          onClick={(e) => e.stopPropagation()}
          className="p-2 bg-saban-gold/10 text-saban-gold rounded-full hover:bg-saban-gold hover:text-black transition-all"
        >
          <ExternalLink size={12} />
        </a>
      </div>
    );
  }

  return (
    <NextImage 
      src={sanitized} 
      alt={alt}
      fill
      sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
      priority={false}
      referrerPolicy="no-referrer"
      unoptimized
      className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
      onError={() => setError(true)}
    />
  );
};

export default function Home() {
  const inputType = useInputType();
  const { theme, setTheme } = useGlobalTheme();
  const [showSplash, setShowSplash] = useState(true);
  const [selectedProduct, setSelectedProduct] = useState<any>(null);
  const [quickViewProduct, setQuickViewProduct] = useState<any>(null);
  const [isQuickViewOpen, setIsQuickViewOpen] = useState(false);
  const [cartCount, setCartCount] = useState(0);
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [products, setProducts] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [brands, setBrands] = useState<any[]>([]);
  const [activeBrand, setActiveBrand] = useState<string | null>(null);
  const [isLoadingProducts, setIsLoadingProducts] = useState(true);
  const [currentPage, setCurrentPage] = useState<'catalog' | 'admin' | 'encyclopedia'>('catalog');
  const [noaTrigger, setNoaTrigger] = useState<any>(null);
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);

  // Vercel Deployment Shield Health Log
  useEffect(() => {
    console.log("Vercel Deployment Shield: Assets fixed, Routing stabilized, Noa Splash Ready.");
    
    const requiredEnv = ['NEXT_PUBLIC_GAS_ORDER_URL'];
    requiredEnv.forEach(key => {
      if (!(process.env as any)[key]) {
        console.warn(`[Vercel Shield] Critical Warning: Missing Environment Variable ${key}. Business logic may fail.`);
      }
    });
  }, []);

  // Pre-load Noa Splash Image
  useEffect(() => {
    const img = new Image();
    img.src = "https://i.postimg.cc/qqWtk5qr/Gemini-Generated-Image-6z6qts6z6qts6z6q.png";
  }, []);

  // PWA Install Logic
  useEffect(() => {
    const handler = (e: any) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };
    window.addEventListener('beforeinstallprompt', handler);
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') {
      setDeferredPrompt(null);
    }
  };

  // Fetch live inventory from Firestore
  useEffect(() => {
    setIsLoadingProducts(true);
    const unsubscribe = ProductService.listenProducts((data) => {
      setProducts(data || []);
      setIsLoadingProducts(false);
    });

    const unsubCat = CategoryService.listenCategories((data) => {
      setCategories(data || []);
    });

    const unsubBrands = BrandService.listenBrands((data) => {
      setBrands(data || []);
    });

    return () => {
      unsubscribe();
      unsubCat();
      unsubBrands();
    };
  }, []);

  // Deep-linking logic for shared products via Vercel production links
  useEffect(() => {
    if (products.length > 0) {
      const params = new URLSearchParams(window.location.search);
      const categoryID = params.get('category');
      const productID = params.get('product');

      if (categoryID) {
        setActiveCategory(categoryID);
      }

      if (productID) {
        const found = products.find(p => 
          String(p.sku) === productID || 
          String(p.id) === productID || 
          String(p.productId) === productID
        );
        if (found) {
          setSelectedProduct(found);
          setShowSplash(false); // Skip splash to show shared content immediately
          console.log(`[Deep Link] Navigating to: ${found.name}`);
        }
      }
    }
  }, [products]);

  const handleAddToCart = (product: any) => {
    setCartCount(prev => prev + 1);
    console.log(`Added ${product.name} to cart`);
  };

  const handleQuickView = (product: any, e: React.MouseEvent) => {
    e.stopPropagation(); 
    setQuickViewProduct(product);
    setIsQuickViewOpen(true);
  };

  const filteredProducts = products.filter(p => {
    const matchesCategory = activeCategory ? p.category === activeCategory : true;
    const matchesBrand = activeBrand ? p.brand === activeBrand : true;
    const matchesSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          p.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          p.id.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesBrand && matchesSearch;
  });

  const [portalMetadata, setPortalMetadata] = useState<{ originSku: string; mediaId?: string } | null>(null);

  // Portal Navigation Listener
  useEffect(() => {
    const handlePortal = (e: any) => {
      const { productSku, mediaId } = e.detail;
      setPortalMetadata({ originSku: productSku, mediaId });
      setCurrentPage('encyclopedia');
      if (window.navigator?.vibrate) window.navigator.vibrate([100, 50, 100]);
    };
    
    const handleNavToProduct = (e: any) => {
      const product = e.detail;
      setSelectedProduct(product);
      setCurrentPage('catalog');
    };

    window.addEventListener('portal-navigation', handlePortal);
    window.addEventListener('nav-to-product', handleNavToProduct);
    return () => {
      window.removeEventListener('portal-navigation', handlePortal);
      window.removeEventListener('nav-to-product', handleNavToProduct);
    };
  }, []);

  if (currentPage === 'admin') {
    return <AdminDashboard onBack={() => setCurrentPage('catalog')} />;
  }

  if (currentPage === 'encyclopedia') {
    return (
      <SabanPedia 
        inventory={products} 
        onAddToCart={handleAddToCart}
        onBack={() => {
          if (portalMetadata?.originSku) {
            const prod = products.find(p => p.sku === portalMetadata.originSku);
            if (prod) setSelectedProduct(prod);
          }
          setPortalMetadata(null);
          setCurrentPage('catalog');
        }}
        originProductSku={portalMetadata?.originSku}
        targetMediaId={portalMetadata?.mediaId}
        onConsultNoa={(topicName) => {
          setNoaTrigger({ 
            content: `המשתמש צופה במדריך של ${topicName}. שאל אותו אם יש משהו טכני שתרצה לשאול עליו או שנוסיף אותו לפרויקט שלו.` 
          });
        }}
      />
    );
  }

  if (selectedProduct) {
    return (
      <>
        <AnimatePresence>
          {showSplash && <SplashScreen onComplete={() => setShowSplash(false)} />}
        </AnimatePresence>
        <ProductDetail 
          product={selectedProduct} 
          onBack={() => setSelectedProduct(null)} 
          onNavigateToProduct={(sku) => {
            const p = products.find(prod => String(prod.sku) === sku || String(prod.id) === sku);
            if (p) {
              setSelectedProduct(p);
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }
          }}
        />
      </>
    );
  }

  return (
    <RootErrorBoundary>
      <div className="min-h-screen relative overflow-hidden transition-colors duration-500">
      <AnimatePresence>
        {showSplash && <SplashScreen onComplete={() => setShowSplash(false)} />}
      </AnimatePresence>
      
      {/* Atmospheric background */}
      <div className="fixed inset-0 pointer-events-none opacity-50 dark:opacity-100">
        <div className="absolute top-[-10%] right-[-10%] w-[50%] h-[50%] bg-saban-gold/5 blur-[120px] rounded-full" />
        <div className="absolute bottom-[-10%] left-[-10%] w-[50%] h-[50%] bg-blue-500/5 blur-[120px] rounded-full" />
      </div>

      <Navbar 
        onCategorySelect={(cat) => {
          setActiveCategory(cat === activeCategory ? null : cat);
          setSearchQuery(''); 
        }} 
        onBrandSelect={(brand) => {
          setActiveBrand(brand === activeBrand ? null : brand);
          setSearchQuery('');
        }}
        activeCategory={activeCategory}
        activeBrand={activeBrand}
        categories={categories}
        brands={brands}
        onLogoClick={() => {
          setActiveCategory(null);
          setActiveBrand(null);
          setSelectedProduct(null);
          setSearchQuery('');
        }}
        onAdminEnter={() => setCurrentPage('admin')}
        onEncyclopediaEnter={() => setCurrentPage('encyclopedia')}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        isInstallable={!!deferredPrompt}
        onInstall={handleInstall}
        cartCount={cartCount}
        theme={theme}
        onThemeChange={setTheme}
      />

      <main className="relative pt-32 pb-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto rtl text-right">
        {/* Hero Section */}
        <div className="mb-20">
          {!activeBrand || activeBrand !== 'ח.סבן' ? (
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-center"
            >
              <span className="text-saban-gold text-sm font-bold tracking-[0.3em] uppercase mb-4 block">
                סבאן חומרי בניין
              </span>
              <h1 className="text-6xl md:text-8xl font-serif mb-6 tracking-tighter">
                עידן חדש של <span className="italic text-saban-gold">בנייה</span>
              </h1>
              <p className="max-w-2xl mx-auto text-lg text-current/40 leading-relaxed">
                גלו את קטלוג המוצרים היוקרתי שלנו, המגובה בייעוץ מקצועי מבוסס בינה מלאכותית.
                איכות ללא פשרות לכל פרויקט.
              </p>
            </motion.div>
          ) : (
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              key="brand-header-saban"
              className="text-center space-y-8"
            >
               <div className="flex flex-col items-center gap-6">
                  <motion.img 
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    src="https://i.postimg.cc/G20PxSVq/Gemini-Generated-Image-gmd5k7gmd5k7gmd5.png" 
                    alt="ח.סבן" 
                    className="h-24 md:h-32 w-auto object-contain filter drop-shadow-[0_0_20px_rgba(212,175,55,0.4)]"
                  />
                  <h1 className="text-5xl md:text-7xl font-serif tracking-tighter uppercase">ח.סבן חומרי בניין</h1>
               </div>
               
               <p className="max-w-3xl mx-auto font-inter text-base md:text-[16px] text-[#64748b] leading-relaxed px-4 text-center">
                 ח.סבן חומרי בניין מספקת פתרונות מתקדמים ומקצועיים לענפי הבנייה והשיפוצים מאז 1970. אנו מחויבים לאיכות ללא פשרות, שירות אישי וליווי טכני צמוד לכל לקוח.
               </p>

               <div className="flex flex-wrap justify-center gap-3 mt-8">
                  {['בלוקים', 'מלט', 'פינוי פסולת'].map(badge => (
                    <motion.div 
                      key={badge}
                      whileHover={{ scale: 1.05, boxShadow: "0 0 20px rgba(212,175,55,0.3)" }}
                      className="px-8 py-2.5 rounded-full border border-saban-gold bg-transparent text-saban-gold text-xs font-black uppercase tracking-widest transition-all cursor-default select-none"
                    >
                      {badge}
                    </motion.div>
                  ))}
               </div>
            </motion.div>
          )}
        </div>

        {/* Product Grid */}
        <div className="min-h-[400px] flex flex-col">
          {isLoadingProducts ? (
            <div className="flex-1 flex flex-col items-center justify-center py-20 text-center">
              <div className="relative w-24 h-24 mb-6">
                <motion.img 
                  src="https://i.postimg.cc/qqWtk5qr/Gemini-Generated-Image-6z6qts6z6qts6z6q.png" 
                  alt="Noa"
                  animate={{ 
                    scale: [1, 1.1, 1],
                    rotate: [0, 5, -5, 0]
                  }}
                  transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
                  className="w-full h-full object-cover rounded-full border border-saban-gold/30 shadow-[0_0_20px_rgba(212,175,55,0.2)]"
                />
                <motion.div 
                  className="absolute -inset-2 rounded-full border border-saban-gold/20"
                  animate={{ scale: [1, 1.2, 1], opacity: [0.5, 0, 0.5] }}
                  transition={{ duration: 2, repeat: Infinity }}
                />
              </div>
              <h3 className="text-xl font-serif mb-2 text-current">נועה מושכת את המלאי...</h3>
              <p className="text-current/40 text-sm font-mono uppercase tracking-[0.2em] font-black">Synchronizing Inventory</p>
            </div>
          ) : filteredProducts.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              <AnimatePresence mode="popLayout">
                {filteredProducts.map((product, idx) => (
                  <motion.div
                    layout
                    key={`${product.id || product.sku || 'product'}-${idx}`}
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    transition={{ delay: idx * 0.1 }}
                    className="group cursor-pointer relative"
                    onClick={() => setSelectedProduct(product)}
                  >
                    <div className="relative aspect-[4/5] overflow-hidden rounded-3xl glass-card transition-all duration-500 group-hover:border-saban-gold/30">
                      <div className="absolute top-6 right-6 z-10 opacity-0 group-hover:opacity-100 transition-all translate-x-4 group-hover:translate-x-0">
                         <button 
                            onClick={(e) => handleQuickView(product, e)}
                            className="bg-black/60 backdrop-blur-xl border border-white/20 p-4 rounded-full text-white hover:bg-saban-gold hover:text-black hover:border-saban-gold transition-all shadow-xl"
                         >
                            <Box size={24} />
                         </button>
                      </div>

                      <ProductCardImage 
                        src={product.imageUrl} 
                        alt={product.name}
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent opacity-60 group-hover:opacity-80 transition-opacity" />
                      
                      {product.stock <= 0 && (
                        <div className="absolute top-6 left-6 bg-rose-600 text-white px-4 py-1 rounded-full text-xs font-black uppercase tracking-widest shadow-lg">
                          אזל מהמלאי
                        </div>
                      )}

                      <div className="absolute bottom-0 right-0 left-0 p-8 text-right">
                        <div className="flex justify-between items-end mb-2">
                          <span className="text-saban-gold text-xs font-black uppercase tracking-widest drop-shadow-md">
                            {product.category}
                          </span>
                          {product.price > 0 && (
                            <span className="text-white text-lg font-black drop-shadow-md">
                              ₪{product.price}
                            </span>
                          )}
                        </div>
                        <h3 className="text-3xl font-serif text-white group-hover:text-saban-gold transition-colors font-bold drop-shadow-lg">
                          {product.name}
                        </h3>
                        {product.stock > 0 && product.stock < 10 && (
                          <span className="text-rose-400 text-xs mt-2 block font-black drop-shadow-sm">
                            נותרו {product.stock} יחידות בלבד!
                          </span>
                        )}
                      </div>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          ) : (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-center py-20"
            >
              <div className="text-6xl mb-6">🔍</div>
              <h3 className="text-2xl font-serif text-current mb-2">לא נמצאו מוצרים</h3>
              <p className="text-current/40 font-bold">נסה לחפש משהו אחר או שנה את הקטגוריה.</p>
              <button 
                onClick={() => {
                  setSearchQuery('');
                  setActiveCategory(null);
                }}
                className="mt-6 text-saban-gold border-b-2 border-saban-gold/20 hover:border-saban-gold transition-all font-black uppercase tracking-widest text-xs"
              >
                נקה הכל
              </button>
            </motion.div>
          )}
        </div>
      </main>

      <QuickViewModal 
        product={quickViewProduct}
        isOpen={isQuickViewOpen}
        onClose={() => setIsQuickViewOpen(false)}
        onAddToCart={handleAddToCart}
        onViewFullDetail={(id) => {
          const p = products.find(prod => prod.id === id);
          if (p) setSelectedProduct(p);
        }}
      />

      <NoaAssistant 
        productContext={JSON.stringify(products)} 
        triggerExternalContext={noaTrigger}
        onTriggerProcessed={() => setNoaTrigger(null)}
        onNavigateToProduct={(sku) => {
          const p = products.find(prod => String(prod.sku) === sku || String(prod.id) === sku);
          if (p) {
            setSelectedProduct(p);
            window.scrollTo({ top: 0, behavior: 'smooth' });
          }
        }}
      />

      <footer className="relative z-10 border-t border-white/10 glass-morphism py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row justify-between items-center gap-8">
            <div className="text-right">
              <h2 className="text-2xl font-serif text-current">ח.סבן</h2>
              <p className="text-current/40 text-sm mt-2 font-bold uppercase tracking-tight">חומרי בניין איכותיים מאז 1970</p>
            </div>
            <div className="flex items-center gap-8 flex-wrap justify-center">
              {deferredPrompt && (
                <button 
                  onClick={handleInstall}
                  className="flex items-center gap-2 px-4 py-2 bg-saban-gold text-black rounded-lg font-black text-sm hover:scale-105 transition-all shadow-lg shadow-saban-gold/20 uppercase tracking-widest"
                >
                  <Download size={16} />
                  <span>התקן אפליקציה</span>
                </button>
              )}
              <button 
                onClick={() => setCurrentPage('admin')}
                className="text-current/40 hover:text-saban-gold transition-colors text-sm uppercase tracking-widest font-black flex items-center gap-2"
              >
                <Database size={16} />
                <span>מרכז ניהול</span>
              </button>
              <div className="text-current/20 text-xs font-bold uppercase tracking-wider">
                © 2026 כל הזכויות שמורות לח. סבן בע"מ
              </div>
            </div>
          </div>
        </div>
      </footer>
    </div>
    </RootErrorBoundary>
  );
}

