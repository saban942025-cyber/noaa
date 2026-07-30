import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Search, BookOpen, Video, Presentation, MessageSquare, ArrowRight, Sparkles, X, ChevronLeft, ChevronDown, Maximize2, Plus } from 'lucide-react';
import { ProductService, EncyclopediaService } from '../services/firebaseService';

interface SabanPediaProps {
  inventory: any[];
  onConsultNoa: (productName: string) => void;
  onBack: () => void;
  onAddToCart?: (product: any) => void;
  originProductSku?: string;
  targetMediaId?: string;
}

export const SabanPedia: React.FC<SabanPediaProps> = ({ inventory, onConsultNoa, onBack, onAddToCart, originProductSku, targetMediaId }) => {
  const [searchTerm, setSearchTerm] = React.useState('');
  const [selectedTopic, setSelectedTopic] = React.useState<any>(null);
  const [linkedProducts, setLinkedProducts] = React.useState<any[]>([]);
  const [isFetchingProducts, setIsFetchingProducts] = React.useState(false);
  const [addingProduct, setAddingProduct] = React.useState<any>(null);
  const [quantity, setQuantity] = React.useState(1);

  // Fetch linked products when a topic is selected
  React.useEffect(() => {
    if (selectedTopic && (selectedTopic.linkedProductSKUs?.length > 0 || selectedTopic.associatedSku || selectedTopic.associatedSkus?.length > 0)) {
      setIsFetchingProducts(true);
      const skus = [
        ...(selectedTopic.linkedProductSKUs || []),
        selectedTopic.associatedSku,
        ...(selectedTopic.associatedSkus || [])
      ].filter(Boolean) as string[];
      
      EncyclopediaService.getProductsBySkus(skus).then(res => {
        setLinkedProducts(res);
        setIsFetchingProducts(false);
      });
    } else {
      setLinkedProducts([]);
    }
  }, [selectedTopic]);

  const [categories, setCategories] = React.useState<any[]>([]);
  const [items, setItems] = React.useState<any[]>([]);
  const [expandedCats, setExpandedCats] = React.useState<Set<string>>(new Set());

  // Handle Target Media Selection from Portal
  React.useEffect(() => {
    if (targetMediaId && items.length > 0) {
      const target = items.find(i => i.id === targetMediaId);
      if (target) {
        setSelectedTopic({
          ...target,
          name: target.title,
          category: categories.find(c => c.id === target.categoryId)?.name || 'כללי',
          type: target.type === 'slide' ? 'general' : 'video',
          sanitizedUrl: target.url ? ProductService.sanitizeImageUrl(target.url) : ''
        });
      }
    } else if (originProductSku && items.length > 0) {
      // If no specific mediaId but we have an originSku, try to find media linked to it
      const target = items.find(i => i.associatedSku === originProductSku || (Array.isArray(i.associatedSkus) && i.associatedSkus.includes(originProductSku)));
      if (target) {
        setSelectedTopic({
          ...target,
          name: target.title,
          category: categories.find(c => c.id === target.categoryId)?.name || 'כללי',
          type: target.type === 'slide' ? 'general' : 'video',
          sanitizedUrl: target.url ? ProductService.sanitizeImageUrl(target.url) : ''
        });
      }
    }
  }, [targetMediaId, originProductSku, items, categories]);

  React.useEffect(() => {
    const unsubCat = EncyclopediaService.listenCategories(setCategories);
    const unsubItems = EncyclopediaService.listenItems(setItems);
    return () => {
      unsubCat();
      unsubItems();
    };
  }, []);

  const filteredItems = React.useMemo(() => {
    const combined = [
      ...items.map(i => ({
        ...i,
        name: i.title,
        category: categories.find(c => c.id === i.categoryId)?.name || 'כללי',
        type: i.type === 'slide' ? 'general' : 'video',
        sanitizedUrl: i.url ? ProductService.sanitizeImageUrl(i.url) : ''
      })),
      ...inventory.filter(p => (p.presentationId || p.tutorialUrl) && !items.find(i => i.associatedSku === p.sku)).map(p => ({
        id: p.id,
        name: p.name || p.ProductName,
        category: p.category,
        description: p.description || `מדריך טכני ומפרט יישום עבור ${p.name || p.ProductName}`,
        presentationId: p.presentationId,
        tutorialUrl: p.tutorialUrl ? ProductService.sanitizeImageUrl(p.tutorialUrl) : '',
        type: 'product'
      }))
    ];

    if (!searchTerm) return combined;
    return combined.filter(item => 
      item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.category.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [inventory, items, categories, searchTerm]);

  const toggleCat = (id: string) => {
    const next = new Set(expandedCats);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setExpandedCats(next);
  };

  return (
    <div className="min-h-screen bg-saban-black text-white selection:bg-saban-gold/30">
      {/* Immersive Background */}
      <div className="fixed inset-0 pointer-events-none opacity-20">
        <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1516216628859-9bccecad13ca?auto=format&fit=crop&q=80')] bg-fixed bg-cover mix-blend-overlay" />
        <div className="absolute inset-0 bg-gradient-to-b from-saban-black via-transparent to-saban-black" />
      </div>

      {/* Back to Product FAB (Portal Users) */}
      <AnimatePresence>
        {originProductSku && !selectedTopic && (
          <motion.div
            initial={{ opacity: 0, x: -50 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -50 }}
            className="fixed bottom-10 left-10 z-[120]"
          >
            <button
              onClick={onBack}
              className="flex items-center gap-3 px-8 py-4 bg-white/10 backdrop-blur-xl border border-white/20 text-white rounded-full font-bold hover:bg-saban-gold hover:text-black transition-all shadow-2xl group"
            >
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              <span>חזרה למוצר</span>
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      <nav className="fixed top-0 left-0 right-0 z-50 bg-saban-black/80 backdrop-blur-xl border-b border-white/5 px-6 py-4">
        <div className="max-w-7xl mx-auto flex justify-between items-center rtl">
          <button onClick={onBack} className="flex items-center gap-2 text-white/60 hover:text-white transition-colors group">
            <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            <span>חזרה לקטלוג</span>
          </button>
          
          <div className="flex items-center gap-3">
            <BookOpen className="text-saban-gold w-6 h-6" />
            <span className="text-2xl font-serif tracking-tighter text-white">ח.סבן - <span className="text-saban-gold">אנציקלופדיה</span></span>
          </div>
        </div>
      </nav>

      <main className="relative pt-32 pb-20 px-6 max-w-7xl mx-auto rtl text-right">
        {/* Giant Library Header */}
        <div className="mb-16 text-center max-w-3xl mx-auto">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="inline-flex items-center gap-2 px-4 py-1 rounded-full bg-saban-gold/10 border border-saban-gold/20 text-saban-gold text-xs font-bold uppercase tracking-widest mb-6"
          >
            <Sparkles className="w-3 h-3" />
            מרכז הידע המקצועי
          </motion.div>
          <h1 className="text-5xl md:text-7xl font-serif mb-8 text-white">האנציקלופדיה של <span className="italic text-saban-gold">הבנייה</span></h1>
          
          {/* Search Bar */}
          <div className="relative max-w-xl mx-auto group">
            <div className="absolute inset-y-0 right-0 pr-4 flex items-center pointer-events-none">
              <Search className="h-5 w-5 text-white/40 group-focus-within:text-saban-gold transition-colors" />
            </div>
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="חפש מוצר, שיטת יישום או טכנולוגיה..."
              className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 pr-12 pl-6 focus:outline-none focus:border-saban-gold/50 text-white placeholder-white/20 transition-all backdrop-blur-md shadow-2xl"
            />
          </div>
        </div>

        {/* Masonry Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <AnimatePresence mode="popLayout">
            {filteredItems.map((item, idx) => (
              <motion.div
                layout
                key={`${item.id || item.sku || 'item'}-${idx}`}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.05 }}
                className="group relative overflow-hidden rounded-3xl bg-white/5 border border-white/10 p-1 hover:border-saban-gold/30 transition-all cursor-pointer shadow-xl backdrop-blur-sm"
                onClick={() => setSelectedTopic(item)}
              >
                <div className="p-8">
                  <div className="flex justify-between items-start mb-6">
                    <div className="p-3 rounded-2xl bg-saban-gold/10 text-saban-gold">
                      {item.type === 'general' ? <BookOpen className="w-5 h-5" /> : <Presentation className="w-5 h-5" />}
                    </div>
                    <span className="text-[10px] font-bold uppercase tracking-widest text-white/40">{item.category}</span>
                  </div>
                  <h3 className="text-2xl font-serif mb-3 group-hover:text-saban-gold transition-colors">{item.name}</h3>
                  <p className="text-white/40 text-sm leading-relaxed line-clamp-3 mb-6">{item.description}</p>
                  
                  <div className="flex items-center gap-4 text-xs font-bold uppercase tracking-tighter text-saban-gold">
                    {item.presentationId && <span className="flex items-center gap-1"><Presentation className="w-3 h-3" /> מצגת טכנית</span>}
                    {item.tutorialUrl && <span className="flex items-center gap-1"><Video className="w-3 h-3" /> סרטון הדרכה</span>}
                  </div>
                </div>
                
                {/* Visual Accent */}
                <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-saban-gold/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      </main>

      {/* Theater Mode Modal */}
      <AnimatePresence>
        {selectedTopic && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center p-0 md:p-10 backdrop-blur-2xl bg-black/95"
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.3, filter: 'blur(20px)' }}
              animate={{ opacity: 1, scale: 1, filter: 'blur(0px)' }}
              exit={{ opacity: 0, scale: 1.1, filter: 'blur(20px)' }}
              transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
              className="relative w-full h-full md:max-w-6xl md:h-[90vh] flex flex-col bg-black border-t md:border border-white/10 rounded-t-[40px] md:rounded-[40px] overflow-hidden shadow-[0_0_150px_rgba(197,160,89,0.3)]"
            >
              {/* Modal Header */}
              <div className="flex justify-between items-center px-6 md:px-10 py-6 md:py-8 border-b border-white/5 rtl bg-black/50 backdrop-blur-md sticky top-0 z-20">
                <div className="flex-1">
                  <h2 className="text-xl md:text-3xl font-serif text-white line-clamp-1">{selectedTopic.name}</h2>
                  <p className="text-saban-gold text-[10px] md:text-sm font-bold uppercase tracking-widest mt-1">{selectedTopic.category}</p>
                </div>
                <div className="flex items-center gap-2 md:gap-4">
                  {originProductSku && (
                    <button 
                      onClick={onBack}
                      className="hidden sm:flex items-center gap-2 px-6 py-3 bg-white/10 text-white font-bold rounded-2xl hover:bg-white/20 transition-all border border-white/10"
                    >
                      <ArrowRight className="w-4 h-4" />
                      <span>חזרה למוצר</span>
                    </button>
                  )}
                  <button 
                    onClick={() => onConsultNoa(selectedTopic.name)}
                    className="hidden sm:flex items-center gap-2 px-6 py-3 bg-saban-gold text-saban-black font-bold rounded-2xl hover:scale-105 transition-all shadow-lg shadow-saban-gold/20"
                  >
                    <MessageSquare className="w-4 h-4" />
                    <span>ייעוץ עם נועה</span>
                  </button>
                  <button onClick={() => setSelectedTopic(null)} className="touch-target p-3 text-white/40 hover:text-white transition-colors bg-white/5 rounded-full">
                    <X className="w-6 h-6" />
                  </button>
                </div>
              </div>

              {/* Immersive Viewer */}
              <div className="flex-1 overflow-y-auto p-6 md:p-10 scrollbar-none overscroll-behavior-contain">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 md:gap-10 h-full">
                  
                  {/* Google Slides - Theater Mode Primary */}
                  <div className="lg:col-span-2 flex flex-col gap-6">
                    <div className="flex items-center gap-2 text-white/40 mb-2">
                        <Presentation className="w-4 h-4" />
                        <span className="text-[10px] md:text-xs font-bold uppercase tracking-widest">מצגת מקצועית ומפרט טכני</span>
                    </div>
                    <div className="aspect-video w-full rounded-2xl md:rounded-3xl overflow-hidden bg-white/5 border border-white/10 relative group shadow-2xl">
                      {selectedTopic.presentationId || (selectedTopic.type === 'general' && selectedTopic.url) ? (
                        <>
                          <iframe
                            src={`https://docs.google.com/presentation/d/${selectedTopic.presentationId || selectedTopic.url}/embed?start=false&loop=false&delayms=3000`}
                            frameBorder="0"
                            width="100%"
                            height="100%"
                            allowFullScreen
                            className="absolute inset-0"
                          />
                          <button 
                            onClick={() => window.open(`https://docs.google.com/presentation/d/${selectedTopic.presentationId || selectedTopic.url}/present`, '_blank')}
                            className="absolute top-4 right-4 p-2 bg-black/60 rounded-lg text-white opacity-0 group-hover:opacity-100 transition-opacity hover:bg-saban-gold hover:text-black flex items-center gap-2 text-xs font-bold"
                          >
                            <Maximize2 size={14} />
                            מסך מלא
                          </button>
                        </>
                      ) : (
                        <div className="absolute inset-0 flex flex-col items-center justify-center text-white/20">
                          <Presentation className="w-20 h-20 mb-4 opacity-5" />
                          <p>המצגת בטעינה או שאינה זמינה כרגע</p>
                        </div>
                      )}
                    </div>
                    
                    <div className="mt-4 md:mt-6 p-6 md:p-8 rounded-3xl bg-white/[0.02] border border-white/5">
                      <h4 className="text-lg font-bold mb-4 flex items-center gap-2">
                        <Sparkles className="w-4 h-4 text-saban-gold" />
                        על המוצר והשיטה
                      </h4>
                      <p className="text-sm md:text-base text-white/60 leading-relaxed italic">{selectedTopic.description}</p>
                    </div>
                  </div>

                  {/* Video & Consultation Sidebar */}
                  <div className="flex flex-col gap-6 md:gap-8 pb-10 md:pb-0">
                    {/* Video Player */}
                    <div>
                      <div className="flex items-center gap-2 text-white/40 mb-4">
                        <Video className="w-4 h-4" />
                        <span className="text-[10px] md:text-xs font-bold uppercase tracking-widest">סרטון הדרכה ויישום</span>
                      </div>
                      <div className="aspect-video rounded-2xl overflow-hidden bg-white/5 border border-white/10 relative shadow-2xl">
                        {(selectedTopic.tutorialUrl || (selectedTopic.type === 'video' && selectedTopic.sanitizedUrl)) ? (
                          <iframe
                            src={selectedTopic.tutorialUrl || selectedTopic.sanitizedUrl}
                            frameBorder="0"
                            width="100%"
                            height="100%"
                            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                            allowFullScreen
                            className="absolute inset-0"
                          />
                        ) : (
                          <div className="absolute inset-0 flex flex-col items-center justify-center text-white/20">
                            <Video className="w-12 h-12 mb-2" />
                            <p className="text-xs">בקרוב: סרטון הדרכה</p>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Pro Tips / Stats Card */}
                    <div className="p-6 md:p-8 rounded-3xl bg-saban-gold/5 border border-saban-gold/20">
                      <h5 className="text-saban-gold font-bold mb-4 flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-saban-gold animate-ping" />
                        טיפ מקצועי של סבאן
                      </h5>
                      <ul className="space-y-4 text-xs md:text-sm text-white/70">
                        <li className="flex items-start gap-2">
                          <div className="w-1.5 h-1.5 rounded-full bg-saban-gold mt-1.5 flex-shrink-0" />
                          <span>תכנון נכון מראש חוסך עד 15% בבלאי של חומרי בידוד ואיטום.</span>
                        </li>
                        <li className="flex items-start gap-2">
                          <div className="w-1.5 h-1.5 rounded-full bg-saban-gold mt-1.5 flex-shrink-0" />
                          <span>מומלץ להתייעץ עם נועה לגבי כמויות מדויקות לפי שטח הפרויקט.</span>
                        </li>
                      </ul>
                    </div>

                    {/* Sticky Consult Button (Mobile/Small scroll) */}
                    <button 
                      onClick={() => {
                        if (window.navigator?.vibrate) window.navigator.vibrate([20, 10, 20]);
                        onConsultNoa(selectedTopic.name);
                      }}
                      className="mt-auto group flex items-center justify-between p-5 md:p-6 rounded-3xl bg-white/5 border border-white/10 hover:border-saban-gold/50 transition-all active:scale-[0.98]"
                    >
                      <div className="flex items-center gap-4 rtl text-right">
                        <div className="w-10 h-10 md:w-12 md:h-12 rounded-full bg-saban-gold flex items-center justify-center text-saban-black shadow-lg shadow-saban-gold/30">
                          <MessageSquare className="w-5 h-5 md:w-6 md:h-6" />
                        </div>
                        <div className="text-right">
                          <p className="font-bold text-sm md:text-base">יש שאלות טכניות?</p>
                          <p className="text-[10px] md:text-xs text-white/40">דבר עם נועה עכשיו</p>
                        </div>
                      </div>
                      <ArrowRight className="w-5 h-5 text-saban-gold group-hover:translate-x-[-5px] transition-transform" />
                    </button>
                  </div>

                </div>

                {/* LINKED PRODUCTS SECTION (Mini-cards for Sales) */}
                <AnimatePresence>
                  {linkedProducts.length > 0 && (
                    <motion.div 
                      initial={{ opacity: 0, y: 30 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="mt-12 pt-12 border-t border-white/10"
                    >
                      <div className="flex items-center justify-between mb-8">
                        <div className="flex items-center gap-3">
                          <div className="p-2 bg-saban-gold rounded-lg text-black">
                            <Sparkles size={18} />
                          </div>
                          <div>
                            <h3 className="text-xl font-serif text-white">מוצרים מומלצים להדרכה זו</h3>
                            <p className="text-[10px] text-white/40 uppercase tracking-widest font-bold">החומרים שנועה ממליצה עליהם ליישום מושלם</p>
                          </div>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4">
                        {linkedProducts.map((product, idx) => (
                          <motion.div
                            key={`${product.sku || product.id || 'linked'}-${idx}`}
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ delay: idx * 0.05 }}
                            className="bg-white/5 border border-white/5 rounded-2xl p-3 hover:bg-white/10 hover:border-saban-gold/50 transition-all group relative overflow-hidden"
                          >
                            <div 
                              className="aspect-square rounded-xl overflow-hidden mb-3 cursor-pointer"
                              onClick={() => {
                                // Navigate to catalog and show product detail
                                setSelectedTopic(null);
                                window.dispatchEvent(new CustomEvent('nav-to-product', { detail: product }));
                              }}
                            >
                               <img 
                                 src={product.imageUrl} 
                                 alt={product.name}
                                 className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                               />
                            </div>
                            <div className="text-[10px] font-bold text-saban-gold mb-1 truncate">{product.brand}</div>
                            <div className="text-xs font-bold text-white mb-2 line-clamp-1">{product.name}</div>
                            
                            <div className="flex items-center justify-between gap-2">
                              <span className="text-sm font-black text-white">₪{product.price}</span>
                              <button 
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setAddingProduct(product);
                                  setQuantity(1);
                                }}
                                className="w-8 h-8 rounded-full bg-saban-gold flex items-center justify-center text-black hover:scale-110 transition-transform shadow-lg shadow-saban-gold/20"
                              >
                                <Plus size={16} />
                              </button>
                            </div>
                          </motion.div>
                        ))}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Quantity Selector Pop-up */}
              <AnimatePresence>
                {addingProduct && (
                  <motion.div 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="fixed inset-0 z-[200] flex items-center justify-center bg-black/80 backdrop-blur-md p-6"
                  >
                    <motion.div 
                      initial={{ scale: 0.9, y: 20 }}
                      animate={{ scale: 1, y: 0 }}
                      exit={{ scale: 0.9, y: 20 }}
                      className="bg-saban-black border border-saban-gold/30 rounded-3xl p-8 max-w-sm w-full shadow-2xl relative"
                    >
                      <button onClick={() => setAddingProduct(null)} className="absolute top-4 left-4 p-2 text-white/40 hover:text-white">
                        <X size={20} />
                      </button>
                      <div className="text-center mb-8">
                        <div className="w-24 h-24 mx-auto rounded-2xl overflow-hidden mb-4 border-2 border-saban-gold/20">
                          <img src={addingProduct.imageUrl} className="w-full h-full object-cover" />
                        </div>
                        <h3 className="text-xl font-bold text-white mb-1">{addingProduct.name}</h3>
                        <p className="text-saban-gold font-bold">מחיר: ₪{addingProduct.price}</p>
                      </div>

                      <div className="flex items-center justify-center gap-6 mb-8">
                        <button 
                          onClick={() => setQuantity(prev => Math.max(1, prev - 1))}
                          className="w-12 h-12 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-white text-2xl hover:bg-white/10"
                        >
                          -
                        </button>
                        <span className="text-4xl font-black text-white w-20 text-center">{quantity}</span>
                        <button 
                          onClick={() => setQuantity(prev => prev + 1)}
                          className="w-12 h-12 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-white text-2xl hover:bg-white/10"
                        >
                          +
                        </button>
                      </div>

                      <button 
                        onClick={() => {
                          if (onAddToCart) {
                            for(let i=0; i<quantity; i++) onAddToCart(addingProduct);
                          }
                          setAddingProduct(null);
                          if (window.navigator?.vibrate) window.navigator.vibrate([30, 20, 30]);
                        }}
                        className="w-full py-4 bg-saban-gold text-saban-black font-black rounded-2xl shadow-xl shadow-saban-gold/30 hover:scale-105 active:scale-95 transition-all"
                      >
                        הוסף להזמנה כעת
                      </button>
                    </motion.div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
      <AnimatePresence>
        {selectedTopic && (
          <motion.div
            initial={{ y: 100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 100, opacity: 0 }}
            className="fixed bottom-8 left-8 z-[110]"
          >
            <button 
              onClick={() => onConsultNoa(selectedTopic.name)}
              className="flex items-center gap-3 px-6 py-4 bg-saban-gold text-saban-black rounded-full font-bold shadow-[0_0_30px_rgba(197,160,89,0.5)] hover:scale-105 transition-all border-4 border-black group"
            >
              <div className="w-8 h-8 rounded-full bg-black text-saban-gold flex items-center justify-center group-hover:rotate-12 transition-transform">
                <Sparkles size={18} />
              </div>
              <span className="whitespace-nowrap">שאל את נועה על ההדרכה הזו</span>
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
