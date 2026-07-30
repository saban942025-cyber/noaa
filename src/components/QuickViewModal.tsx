import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, ShoppingBag, ArrowRight, Eye, Sparkles } from 'lucide-react';

interface Product {
  id: string;
  name: string;
  price: number;
  description: string;
  imageUrl?: string;
  imageUrl2?: string;
  imageUrl3?: string;
  category?: string;
  shortDescription?: string;
}

interface QuickViewModalProps {
  product: Product | null;
  isOpen: boolean;
  onClose: () => void;
  onAddToCart: (product: Product) => void;
  onViewFullDetail: (id: string) => void;
}

const ProductImage: React.FC<{ src: string; alt: string }> = ({ src, alt }) => {
  const [error, setError] = React.useState(false);
  if (error || !src) {
    return (
      <div className="w-full h-full bg-white/5 flex items-center justify-center">
        <Sparkles className="text-white/10" size={48} />
      </div>
    );
  }
  return (
    <img 
      src={src} 
      alt={alt} 
      onError={() => setError(true)}
      className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
    />
  );
};

export const QuickViewModal: React.FC<QuickViewModalProps> = ({ 
  product, 
  isOpen, 
  onClose, 
  onAddToCart,
  onViewFullDetail
}) => {
  if (!product) return null;

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[100]"
          />

          {/* Modal Container */}
          <div className="fixed inset-0 flex items-center justify-center z-[101] p-4 pointer-events-none" dir="rtl">
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              className="bg-saban-black w-full max-w-4xl max-h-[90vh] rounded-[2rem] overflow-hidden border border-white/10 shadow-2xl pointer-events-auto flex flex-col md:flex-row relative"
            >
              {/* Close Button */}
              <button 
                onClick={onClose}
                className="absolute top-6 right-6 z-20 w-10 h-10 bg-black/40 backdrop-blur-md rounded-full flex items-center justify-center border border-white/10 text-white/60 hover:text-white hover:border-saban-gold transition-all"
              >
                <X size={20} />
              </button>

              {/* Left: Image Section */}
              <div className="w-full md:w-1/2 aspect-square md:aspect-auto bg-white/5 relative group">
                 <ProductImage src={product.imageUrl || ''} alt={product.name} />
                 <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-8">
                    <span className="text-white/40 text-[10px] font-mono tracking-widest uppercase">P_ID: {product.id}</span>
                 </div>
              </div>

              {/* Right: Content Section */}
              <div className="w-full md:w-1/2 p-8 md:p-12 flex flex-col justify-between overflow-y-auto">
                <div className="space-y-6">
                  <div className="space-y-2">
                    <div className="flex items-center gap-3">
                      <span className="px-3 py-1 rounded-full bg-saban-gold/20 text-saban-gold text-[10px] font-black uppercase tracking-tighter border border-saban-gold/30">
                        {product.category || 'כללי'}
                      </span>
                    </div>
                    <h2 className="text-3xl font-serif font-bold text-white tracking-tight leading-tight">
                      {product.name}
                    </h2>
                    <div className="text-2xl font-mono text-saban-gold">
                      ₪{product.price.toLocaleString()}
                    </div>
                  </div>

                  <div className="space-y-4">
                    <p className="text-white/60 text-sm leading-relaxed line-clamp-4">
                      {product.shortDescription || product.description}
                    </p>
                    
                    <div className="pt-4 border-t border-white/5 flex flex-wrap gap-4">
                       <div className="flex items-center gap-2 text-white/40 text-[10px] uppercase font-bold tracking-widest">
                          <div className="w-1 h-1 rounded-full bg-saban-gold" />
                          אספקה מיידית
                       </div>
                       <div className="flex items-center gap-2 text-white/40 text-[10px] uppercase font-bold tracking-widest">
                          <div className="w-1 h-1 rounded-full bg-saban-gold" />
                          אחריות יבואן
                       </div>
                    </div>
                  </div>
                </div>

                <div className="mt-8 grid grid-cols-1 gap-3">
                   <button 
                    onClick={() => {
                      onAddToCart(product);
                      onClose();
                    }}
                    className="w-full py-4 bg-saban-gold text-black rounded-2xl font-black text-sm uppercase tracking-widest flex items-center justify-center gap-3 hover:scale-[1.02] active:scale-95 transition-all shadow-lg shadow-saban-gold/20"
                  >
                    <ShoppingBag size={18} />
                    <span>הוסף לסל הקניות</span>
                  </button>

                  <button 
                    onClick={() => {
                      onViewFullDetail(product.id);
                      onClose();
                    }}
                    className="w-full py-4 bg-white/5 border border-white/10 text-white rounded-2xl font-bold text-sm tracking-tight flex items-center justify-center gap-3 hover:bg-white/10 hover:border-white/20 transition-all group"
                  >
                    <Eye size={18} className="text-white/40 group-hover:text-saban-gold transition-colors" />
                    <span>צפה בפרטים המלאים</span>
                    <ArrowRight size={16} className="text-white/20" />
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  );
};
