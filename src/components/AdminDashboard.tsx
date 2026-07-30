import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Package, 
  Plus, 
  Save, 
  Trash2, 
  RefreshCw, 
  ChevronLeft, 
  ArrowRight,
  Database,
  Terminal,
  Layers,
  Search,
  AlertCircle,
  CheckCircle2,
  Image as ImageIcon,
  Tag,
  Presentation,
  Youtube,
  Link as LinkIcon,
  Camera,
  X,
  BookOpen,
  ChevronDown,
  ChevronRight,
  Download,
  Home,
  Box,
  Info,
  User,
  Video,
  Sparkles
} from 'lucide-react';
import { ProductService, CategoryService, EncyclopediaService, BrandService, auth, googleProvider } from '../services/firebaseService';
import { AdminService } from '../services/AdminService';
import { signInWithPopup, signOut } from 'firebase/auth';

import { VideoPlayer } from './VideoPlayer';

interface AdminDashboardProps {
  onBack: () => void;
}

type AdminTab = 'inventory' | 'encyclopedia' | 'brands' | 'categories';

export const AdminDashboard: React.FC<AdminDashboardProps> = ({ onBack }) => {
  const [user, setUser] = React.useState(auth?.currentUser || null);
  const [activeTab, setActiveTab] = React.useState<AdminTab>('inventory');
  const [items, setItems] = React.useState<any[]>([]);
  const [categories, setCategories] = React.useState<any[]>([]);
  const [brands, setBrands] = React.useState<any[]>([]);
  
  // Encyclopedia State
  const [encCategories, setEncCategories] = React.useState<any[]>([]);
  const [encItems, setEncItems] = React.useState<any[]>([]);
  const [expandedCats, setExpandedCats] = React.useState<Set<string>>(new Set());
  const [selectedEncItem, setSelectedEncItem] = React.useState<any>(null);
  const [isEditingEnc, setIsEditingEnc] = React.useState(false);
  const [isEditingCat, setIsEditingCat] = React.useState(false);
  const [selectedCat, setSelectedCat] = React.useState<any>(null);

  // New Management State
  const [selectedBrand, setSelectedBrand] = React.useState<any>(null);
  const [isEditingBrand, setIsEditingBrand] = React.useState(false);
  const [selectedCatalogCat, setSelectedCatalogCat] = React.useState<any>(null);
  const [isEditingCatalogCat, setIsEditingCatalogCat] = React.useState(false);

  const [selectedItem, setSelectedItem] = React.useState<any>(null);
  const [isEditing, setIsEditing] = React.useState(false);
  const [searchQuery, setSearchQuery] = React.useState('');
  const [logs, setLogs] = React.useState<{msg: string, type: 'info' | 'success' | 'error', time: string}[]>([]);
  const [isSyncing, setIsSyncing] = React.useState(false);
  const [isSaving, setIsSaving] = React.useState(false);
  const [productSearchQuery, setProductSearchQuery] = React.useState('');
  const [productSearchResults, setProductSearchResults] = React.useState<any[]>([]);

  // Search products for linking
  React.useEffect(() => {
    if (productSearchQuery.length < 2) {
      setProductSearchResults([]);
      return;
    }
    const filtered = items.filter(p => 
      p.name?.toLowerCase().includes(productSearchQuery.toLowerCase()) || 
      p.sku?.toLowerCase().includes(productSearchQuery.toLowerCase())
    ).slice(0, 5);
    setProductSearchResults(filtered);
  }, [productSearchQuery, items]);

  // Auto-focus refs
  const categoryInputRef = React.useRef<HTMLInputElement>(null);
  const mediaInputRef = React.useRef<HTMLInputElement>(null);

  // Permission bypass for Admin identified session
  const canEditEncyclopedia = React.useMemo(() => {
    return AdminService.canEditEncyclopedia();
  }, [user]);

  React.useEffect(() => {
    if (isEditingCat && categoryInputRef.current) {
      setTimeout(() => categoryInputRef.current?.focus(), 100);
    }
  }, [isEditingCat]);

  React.useEffect(() => {
    if (isEditingEnc && mediaInputRef.current) {
      setTimeout(() => mediaInputRef.current?.focus(), 100);
    }
  }, [isEditingEnc]);

  React.useEffect(() => {
    if (selectedItem?.tutorialUrl) {
      const isYoutube = selectedItem.tutorialUrl.includes('youtube.com') || selectedItem.tutorialUrl.includes('youtu.be');
      const isDirect = selectedItem.tutorialUrl.match(/\.(mp4|webm|ogg)$/) !== null || selectedItem.tutorialUrl.includes('firebase');
      
      if (isYoutube) addLog('זוהה מקור וידאו: YouTube', 'info');
      else if (isDirect) addLog('זוהה מקור וידאו: Direct MP4/WebM', 'info');
    }
  }, [selectedItem?.tutorialUrl]);

  React.useEffect(() => {
    const unsubAuth = auth?.onAuthStateChanged((u) => {
      setUser(u);
      if (u) {
        addLog(`מחובר כ: ${u.email}`, 'success');
        console.log("%cEncyclopedia Controls Unlocked", "color: #d4af37; font-weight: bold; font-size: 14px;", "Pointer-events forced, Z-index stabilized.");
      }
    }) || (() => {});

    // Development bypass log
    if (process.env.NODE_ENV === 'development') {
      console.log("%cEncyclopedia Controls Unlocked", "color: #d4af37; font-weight: bold; font-size: 14px;", "Pointer-events forced, Z-index stabilized.");
    }

    // Real-time listener
    const unsubscribe = ProductService.listenProducts((data) => {
      setItems(data || []);
      addLog('המלאי סונכרן מול הנתונים בזמן אמת', 'info');
    });

    const unsubCat = CategoryService.listenCategories((data) => {
      setCategories(data || []);
    });

    const unsubBrands = BrandService.listenBrands((data) => {
      setBrands(data || []);
    });

    // Encyclopedia Listeners
    const unsubEncCat = EncyclopediaService.listenCategories(setEncCategories);
    const unsubEncItem = EncyclopediaService.listenItems(setEncItems);

    return () => {
      unsubscribe();
      unsubCat();
      unsubBrands();
      unsubEncCat();
      unsubEncItem();
      unsubAuth();
    };
  }, []);

  const handleLogin = async () => {
    if (!auth || !googleProvider) {
      addLog('מערכת ה-Auth לא אותחלה כראוי', 'error');
      return;
    }
    try {
      await signInWithPopup(auth, googleProvider);
    } catch (e) {
      addLog('שגיאה בהתחברות', 'error');
    }
  };

  const handleLogout = async () => {
    if (auth) await signOut(auth);
    setUser(null);
  };

  const addLog = (msg: string, type: 'info' | 'success' | 'error' = 'info') => {
    setLogs(prev => [{
      msg,
      type,
      time: new Date().toLocaleTimeString('he-IL')
    }, ...prev.slice(0, 50)]);
  };

  const handleSyncItems = async () => {
    setIsSyncing(true);
    addLog('סורק את Google Drive עבור נכסים מקושרים...', 'info');
    addLog('מתחיל סנכרון חיצוני מול Google Sheets...', 'info');
    const result = await ProductService.syncToSheet(items);
    if (result.success) {
      addLog('סנכרון מול Google Sheets הושלם בהצלחה', 'success');
    } else {
      addLog(`שגיאה בסנכרון: ${result.message}`, 'error');
    }
    setIsSyncing(false);
  };

  const handleGlobalCleanup = async () => {
    if (!window.confirm('האם להריץ ניקוי גלובלי של כל קישורי התמונות במאגר? פעולה זו תנקה גרשיים וסוגי קישורים לא תקינים.')) return;
    setIsSyncing(true);
    addLog('מריץ ניקוי גלובלי של תמונות (Global Image Cleanup)...', 'info');
    const count = await ProductService.runGlobalImageCleanup();
    if (count >= 0) {
      addLog(`ניקוי גלובלי הושלם. עודכנו ${count} מוצרים.`, 'success');
    } else {
      addLog('שגיאה במהלך ניקוי גלובלי', 'error');
    }
    setIsSyncing(false);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedItem.sku) {
      addLog('שגיאה: חסר מק״ט (SKU) למוצר', 'error');
      return;
    }
    
    setIsSaving(true);
    const sanitizedSku = String(selectedItem.sku).replace(/["']/g, '').trim();
    addLog(`מנקה נתונים עבור מק״ט: ${sanitizedSku}...`, 'info');
    addLog(`מתחיל שמירה עבור מוצר: ${sanitizedSku}...`, 'info');
    
    try {
      // Auto-extract Presentation ID if it's a URL
      if (selectedItem.presentationId && selectedItem.presentationId.includes('http')) {
        const extractedId = ProductService.extractPresentationId(selectedItem.presentationId);
        if (extractedId !== selectedItem.presentationId) {
          addLog(`מחלץ מזהה מצגת [${extractedId}] לסינכרון מול Firestore...`, 'info');
          selectedItem.presentationId = extractedId;
        }
      }

      // Log the object being sent
      const payload = { ...selectedItem };
      delete payload.raw; // Don't save the raw Firestore data back
      addLog(`שולח נתונים ל-Firestore...`, 'info');
      console.log("SAVE PAYLOAD:", payload);

      const success = await ProductService.upsertProduct(payload);
      
      if (success) {
        addLog('המוצר עודכן בהצלחה במאגר הענן ✅', 'success');
        
        // Success Toast simulation in logs
        setTimeout(() => {
          if (window.confirm('האם ברצונך לסנכרן את השינויים גם ל-Google Sheets כעת?')) {
            handleSyncItems();
          }
        }, 500);

        setIsEditing(false);
      } else {
        addLog('שגיאה בעדכון המוצר. בדוק את הטרמינל לפרטים.', 'error');
      }
    } catch (error) {
      console.error("Save Error:", error);
      addLog(`שגיאת מערכת בשמירה: ${error instanceof Error ? error.message : 'Unknown error'}`, 'error');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (e: React.MouseEvent, sku: string) => {
    e.stopPropagation();
    if (!window.confirm(`האם אתה בטוח שברצונך למחוק את המוצר ${sku}?`)) return;
    
    addLog(`מוחק מוצר: ${sku}...`, 'info');
    const success = await ProductService.deleteProduct(sku);
    if (success) {
      addLog('המוצר נמחק בהצלחה', 'success');
      if (selectedItem?.sku === sku) {
        setSelectedItem(null);
        setIsEditing(false);
      }
    } else {
      addLog('מחיקה בוטלה (מצב הדגמה)', 'error');
    }
  };

  const handleDeleteEncItem = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    if (!window.confirm(`האם אתה בטוח שברצונך למחוק את פריט המדיה?`)) return;
    
    addLog(`מוחק פריט מדיה...`, 'info');
    const success = await EncyclopediaService.deleteItem(id);
    if (success) {
      addLog('הפריט נמחק בהצלחה', 'success');
      if (selectedEncItem?.id === id) {
        setSelectedEncItem(null);
        setIsEditingEnc(false);
      }
    } else {
      addLog('שגיאה במחיקת הפריט', 'error');
    }
  };

  const handleDeleteEncCat = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    if (!window.confirm(`האם אתה בטוח שברצונך למחוק את הקטגוריה?`)) return;
    
    try {
      addLog(`מוחק קטגוריה...`, 'info');
      const success = await EncyclopediaService.deleteCategory(id);
      if (success) {
        addLog('הקטגוריה נמחקה בהצלחה', 'success');
        if (selectedCat?.id === id) {
          setSelectedCat(null);
          setIsEditingCat(false);
        }
      }
    } catch (error) {
      addLog(error instanceof Error ? error.message : 'שגיאה במחיקת הקטגוריה', 'error');
    }
  };

  const handleSaveBrand = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    addLog(`שומר מותג: ${selectedBrand.name}...`, 'info');
    const success = await BrandService.upsertBrand(selectedBrand.id || null, selectedBrand);
    if (success) {
      addLog('מותג נשמר בהצלחה', 'success');
      setIsEditingBrand(false);
      setSelectedBrand(null);
    } else {
      addLog('שגיאה בשמירת המותג', 'error');
    }
    setIsSaving(false);
  };

  const handleSaveCatalogCat = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    addLog(`שומר קטגוריה: ${selectedCatalogCat.name}...`, 'info');
    const success = await CategoryService.upsertCategory(selectedCatalogCat.id || null, selectedCatalogCat);
    if (success) {
      addLog('קטגוריה נשמרה בהצלחה', 'success');
      setIsEditingCatalogCat(false);
      setSelectedCatalogCat(null);
    } else {
      addLog('שגיאה בשמירת הקטגוריה', 'error');
    }
    setIsSaving(false);
  };

  const handleSaveEncItem = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    addLog(`שומר פריט מדיה: ${selectedEncItem.title}...`, 'info');
    
    // Auto-extract Presentation ID if it's a URL
    if (selectedEncItem.type === 'slide' && selectedEncItem.url.includes('http')) {
      const extractedId = ProductService.extractPresentationId(selectedEncItem.url);
      if (extractedId !== selectedEncItem.url) {
        selectedEncItem.url = extractedId;
      }
    }

    const itemId = selectedEncItem.id || null;
    const success = await EncyclopediaService.upsertItem(itemId, selectedEncItem);
    
    if (success) {
      addLog('פריט אנציקלופדיה נשמר בהצלחה', 'success');
      setIsEditingEnc(false);
      setSelectedEncItem(null);
    } else {
      addLog('שגיאה בשמירת פריט המדיה', 'error');
    }
    setIsSaving(false);
  };

  const handleSaveEncCat = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    addLog(`שומר קטגוריה: ${selectedCat.name}...`, 'info');
    
    // Ensure we use the ID if we are editing
    const catId = selectedCat.id || null;
    const success = await EncyclopediaService.upsertCategory(catId, selectedCat);
    
    if (success) {
      addLog('קטגוריית אנציקלופדיה נשמרה בהצלחה', 'success');
      setIsEditingCat(false);
      setSelectedCat(null);
    } else {
      addLog('שגיאה בשמירת הקטגוריה', 'error');
    }
    setIsSaving(false);
  };

  const toggleCat = (id: string) => {
    const next = new Set(expandedCats);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setExpandedCats(next);
  };

  const filteredItems = items.filter(item => 
    (item.name || '').toLowerCase().includes(searchQuery.toLowerCase()) || 
    (item.sku || '').toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-black text-white p-4 md:p-8 rtl">
      {/* Header */}
      <div className="max-w-7xl mx-auto flex flex-col lg:flex-row lg:justify-between lg:items-center gap-6 mb-12">
        <div className="flex items-center gap-4">
          <button 
            onClick={onBack}
            className="touch-target p-2 hover:bg-white/10 rounded-full transition-colors"
          >
            <ChevronLeft size={24} />
          </button>
          <div>
            <h1 className="text-3xl md:text-4xl font-serif font-bold text-saban-gold">ח.סבן - מרכז ניהול</h1>
            <p className="text-white/40 text-xs md:text-sm">ניהול קטלוג מוצרים וסנכרון מלאי מרכזי</p>
          </div>
        </div>

        {/* Mobile Tab Switcher */}
        <div className="flex bg-white/5 p-1 rounded-2xl border border-white/10 self-center lg:self-auto w-full max-w-2xl overflow-x-auto">
          <button 
            onClick={() => setActiveTab('inventory')}
            className={`flex-1 min-w-[100px] px-4 py-3 rounded-xl text-xs md:text-sm font-bold transition-all ${activeTab === 'inventory' ? 'bg-saban-gold text-saban-black shadow-lg shadow-saban-gold/20' : 'text-white/40 hover:text-white'}`}
          >
            <div className="flex items-center justify-center gap-2">
              <Package size={16} />
              <span>מוצרים</span>
            </div>
          </button>
          <button 
            onClick={() => setActiveTab('categories')}
            className={`flex-1 min-w-[100px] px-4 py-3 rounded-xl text-xs md:text-sm font-bold transition-all ${activeTab === 'categories' ? 'bg-saban-gold text-saban-black shadow-lg shadow-saban-gold/20' : 'text-white/40 hover:text-white'}`}
          >
            <div className="flex items-center justify-center gap-2">
              <Layers size={16} />
              <span>קטגוריות</span>
            </div>
          </button>
          <button 
            onClick={() => setActiveTab('brands')}
            className={`flex-1 min-w-[100px] px-4 py-3 rounded-xl text-xs md:text-sm font-bold transition-all ${activeTab === 'brands' ? 'bg-saban-gold text-saban-black shadow-lg shadow-saban-gold/20' : 'text-white/40 hover:text-white'}`}
          >
            <div className="flex items-center justify-center gap-2">
              <Tag size={16} />
              <span>מותגים</span>
            </div>
          </button>
          <button 
            onClick={() => setActiveTab('encyclopedia')}
            className={`flex-1 min-w-[100px] px-4 py-3 rounded-xl text-xs md:text-sm font-bold transition-all ${activeTab === 'encyclopedia' ? 'bg-saban-gold text-saban-black shadow-lg shadow-saban-gold/20' : 'text-white/40 hover:text-white'}`}
          >
            <div className="flex items-center justify-center gap-2">
              <BookOpen size={16} />
              <span>אנציקלופדיה</span>
            </div>
          </button>
        </div>
        
        <div className="flex flex-wrap items-center gap-3 justify-center lg:justify-end">
          {user ? (
            <div className="flex items-center gap-3 bg-white/5 p-2 pr-4 rounded-2xl border border-white/10">
              <div className="flex flex-col items-end">
                <span className="text-[10px] md:text-xs font-bold text-white leading-none mb-1">{user.displayName || 'Admin'}</span>
                <span className="text-[8px] md:text-[10px] text-white/40 leading-none">{user.email}</span>
              </div>
              <button 
                onClick={handleLogout}
                className="p-2 hover:text-rose-400 transition-colors"
                title="התנתק"
              >
                <X size={16} />
              </button>
            </div>
          ) : (
            <button 
              onClick={handleLogin}
              className="flex items-center gap-2 px-5 py-3 bg-saban-gold text-saban-black font-bold rounded-xl hover:bg-white transition-all text-xs"
            >
              <User size={18} />
              <span>התחבר למערכת</span>
            </button>
          )}

          {activeTab === 'inventory' ? (
            <div className="flex gap-2">
              <button 
                onClick={handleGlobalCleanup}
                disabled={isSyncing}
                className="p-3 bg-white/5 border border-white/10 rounded-xl hover:text-emerald-400"
              >
                <RefreshCw size={18} className={isSyncing ? 'animate-spin' : ''} />
              </button>
              <button 
                onClick={handleSyncItems}
                disabled={isSyncing}
                className="p-3 bg-white/5 border border-white/10 rounded-xl hover:text-saban-gold"
              >
                <Database size={18} className={isSyncing ? 'animate-spin' : ''} />
              </button>
              <button 
                onClick={() => {
                  setSelectedItem({ 
                    sku: '', 
                    ProductName: '', 
                    currentStock: 0, 
                    price: 0, 
                    category: categories[0]?.id || 'General', 
                    description: '',
                    imageUrl: '',
                    imageUrl2: '',
                    imageUrl3: '',
                    brand: brands[0]?.name || ''
                  });
                  setIsEditing(true);
                  setIsEditingBrand(false);
                  setIsEditingCatalogCat(false);
                  setIsEditingEnc(false);
                }}
                className="flex items-center gap-2 px-5 py-3 bg-saban-gold text-saban-black font-bold rounded-xl shadow-lg shadow-saban-gold/20 text-xs"
              >
                <Plus size={18} />
                <span>מוצר</span>
              </button>
            </div>
          ) : activeTab === 'categories' ? (
            <button 
              onClick={() => {
                setSelectedCatalogCat({ name: '', id: '', image: '', icon: '' });
                setIsEditingCatalogCat(true);
                setIsEditing(false);
                setIsEditingBrand(false);
                setIsEditingEnc(false);
              }}
              className="flex items-center gap-2 px-5 py-3 bg-saban-gold text-saban-black font-bold rounded-xl shadow-lg shadow-saban-gold/20 text-xs"
            >
              <Plus size={18} />
              <span>קטגוריה</span>
            </button>
          ) : activeTab === 'brands' ? (
            <button 
              onClick={() => {
                setSelectedBrand({ name: '', logo: '', description: '' });
                setIsEditingBrand(true);
                setIsEditing(false);
                setIsEditingCatalogCat(false);
                setIsEditingEnc(false);
              }}
              className="flex items-center gap-2 px-5 py-3 bg-saban-gold text-saban-black font-bold rounded-xl shadow-lg shadow-saban-gold/20 text-xs"
            >
              <Plus size={18} />
              <span>מותג</span>
            </button>
          ) : (
            <div className="flex gap-2 relative z-[999] pointer-events-auto">
              <motion.button 
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onTouchStart={() => {
                  setSelectedCat({ name: '', description: '', icon: '', order: encCategories.length });
                  setIsEditingCat(true);
                }}
                onClick={() => {
                  setSelectedCat({ name: '', description: '', icon: '', order: encCategories.length });
                  setIsEditingCat(true);
                }}
                className="p-3 bg-white/10 border border-saban-gold/30 rounded-xl text-saban-gold hover:bg-saban-gold/20 transition-all pointer-events-auto"
              >
                <Layers size={18} />
              </motion.button>
              <motion.button 
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onTouchStart={() => {
                  setSelectedEncItem({ title: '', type: 'slide', url: '', categoryId: encCategories[0]?.id || '', description: '' });
                  setIsEditingEnc(true);
                }}
                onClick={() => {
                  setSelectedEncItem({ title: '', type: 'slide', url: '', categoryId: encCategories[0]?.id || '', description: '' });
                  setIsEditingEnc(true);
                }}
                className="flex items-center gap-2 px-6 py-3 bg-saban-gold text-saban-black font-bold rounded-xl shadow-[0_0_20px_rgba(214,175,55,0.4)] text-xs pointer-events-auto"
              >
                <Plus size={18} />
                <span>מדיה</span>
              </motion.button>
            </div>
          )}
        </div>
      </div>

      <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Side: Inventory or Encyclopedia List */}
        <div className="lg:col-span-8 flex flex-col gap-6">
          {activeTab === 'inventory' ? (
            <div className="bg-white/5 rounded-3xl border border-white/10 overflow-hidden backdrop-blur-md">
              <div className="p-4 md:p-6 border-b border-white/10 flex flex-col md:flex-row justify-between items-center gap-4">
                <div className="flex items-center gap-2 text-saban-gold">
                  <Package size={20} />
                  <h2 className="font-bold uppercase tracking-widest text-sm text-shadow-gold">מוצרים ({items.length})</h2>
                </div>
                <div className="relative w-full md:w-64">
                  <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/30" />
                  <input 
                    type="text" 
                    placeholder="חיפוש..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full bg-white/5 border border-white/10 rounded-xl pl-3 pr-10 py-2.5 text-sm focus:border-saban-gold outline-none transition-all"
                  />
                </div>
              </div>
              
              <div className="max-h-[600px] overflow-auto touch-pan-x">
                <table className="w-full text-right min-w-[600px]">
                  <thead className="bg-white/5 text-xs uppercase text-white/40 sticky top-0">
                    <tr>
                      <th className="px-6 py-4 font-medium">מוצר</th>
                      <th className="px-6 py-4 font-medium">מק״ט</th>
                      <th className="px-6 py-4 font-medium">קטגוריה</th>
                      <th className="px-6 py-4 font-medium">מלאי</th>
                      <th className="px-6 py-4 font-medium text-left">פעולות</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {filteredItems.map((item, idx) => (
                      <motion.tr 
                        key={`${item.id || item.sku || 'inv'}-${idx}`}
                        layoutId={item.sku || item.id}
                        className="group hover:bg-white/5 transition-colors cursor-pointer"
                        onClick={() => {
                          setSelectedItem(item);
                          setIsEditing(true);
                          setIsEditingBrand(false);
                          setIsEditingCatalogCat(false);
                          setIsEditingEnc(false);
                          setIsEditingCat(false);
                        }}
                      >
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <img 
                              src={ProductService.sanitizeImageUrl(item.imageUrl)} 
                              alt={item.name} 
                              className="w-10 h-10 rounded-lg object-cover border border-white/10"
                              onError={(e) => {
                                (e.target as HTMLImageElement).src = 'https://placehold.co/40?text=Error';
                              }}
                            />
                            <div className="flex flex-col">
                              <div className="font-medium flex items-center gap-2">
                                {item.name}
                                {item.presentationId && (
                                  <Presentation size={14} className="text-saban-gold" />
                                )}
                              </div>
                              <div className="text-[10px] text-white/30 uppercase font-bold">{item.brand}</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-white/40 text-sm font-mono">{item.sku}</td>
                        <td className="px-6 py-4">
                          <span className="text-xs px-2 py-1 bg-white/5 rounded-md border border-white/10">
                            {item.category}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <span className={item.stock > 0 ? "text-emerald-400" : "text-rose-400"}>
                            {item.stock} יח׳
                          </span>
                        </td>
                        <td className="px-6 py-4 text-left">
                          <button 
                            onClick={(e) => handleDelete(e, item.sku)}
                            className="p-2 opacity-0 group-hover:opacity-100 hover:text-rose-400 transition-all"
                          >
                            <Trash2 size={16} />
                          </button>
                        </td>
                      </motion.tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ) : activeTab === 'categories' ? (
            <div className="bg-white/5 rounded-3xl border border-white/10 overflow-hidden backdrop-blur-md">
              <div className="p-6 border-b border-white/10 flex items-center gap-2 text-saban-gold">
                <Layers size={20} />
                <h2 className="font-bold uppercase tracking-widest text-sm text-shadow-gold">ניהול קטגוריות ({categories.length})</h2>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 p-6 overflow-auto max-h-[600px]">
                {categories.map((cat) => (
                  <motion.div
                    key={cat.id}
                    layoutId={cat.id}
                    onClick={() => {
                        setSelectedCatalogCat(cat);
                        setIsEditingCatalogCat(true);
                        setIsEditing(false);
                        setIsEditingBrand(false);
                        setIsEditingEnc(false);
                    }}
                    className="p-4 bg-white/5 border border-white/10 rounded-2xl cursor-pointer hover:border-saban-gold transition-all group"
                  >
                    <div className="flex items-center gap-4">
                      {cat.icon || cat.image ? (
                        <img 
                          src={ProductService.sanitizeImageUrl(cat.icon || cat.image)} 
                          className="w-12 h-12 rounded-xl object-cover border border-white/10" 
                        />
                      ) : (
                        <div className="w-12 h-12 rounded-xl bg-white/5 border border-dashed border-white/20 flex items-center justify-center text-white/20">
                          <Layers size={20} />
                        </div>
                      )}
                      <div className="flex-1">
                        <div className="font-bold text-white group-hover:text-saban-gold transition-colors">{cat.name}</div>
                        <div className="text-[10px] text-white/40 uppercase font-mono tracking-tighter">{cat.id}</div>
                      </div>
                      <button 
                        onClick={async (e) => {
                          e.stopPropagation();
                          if (window.confirm('למחוק קטגוריה זו?')) await CategoryService.deleteCategory(cat.id);
                        }}
                        className="p-2 opacity-0 group-hover:opacity-100 hover:text-rose-400"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          ) : activeTab === 'brands' ? (
            <div className="bg-white/5 rounded-3xl border border-white/10 overflow-hidden backdrop-blur-md">
              <div className="p-6 border-b border-white/10 flex items-center gap-2 text-saban-gold">
                <Tag size={20} />
                <h2 className="font-bold uppercase tracking-widest text-sm text-shadow-gold">ניהול מותגים ({brands.length})</h2>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 p-6 overflow-auto max-h-[600px]">
                {brands.map((brand) => (
                  <motion.div
                    key={brand.id}
                    layoutId={brand.id}
                    onClick={() => {
                        setSelectedBrand(brand);
                        setIsEditingBrand(true);
                        setIsEditing(false);
                        setIsEditingCatalogCat(false);
                        setIsEditingEnc(false);
                    }}
                    className="p-4 bg-white/5 border border-white/10 rounded-2xl cursor-pointer hover:border-saban-gold transition-all group"
                  >
                    <div className="flex items-center gap-4">
                      {brand.logo ? (
                        <img 
                          src={ProductService.sanitizeImageUrl(brand.logo)} 
                          className="w-12 h-12 rounded-xl object-cover border border-white/10" 
                        />
                      ) : (
                        <div className="w-12 h-12 rounded-xl bg-white/5 border border-dashed border-white/20 flex items-center justify-center text-white/20">
                          <Tag size={20} />
                        </div>
                      )}
                      <div className="flex-1">
                        <div className="font-bold text-white group-hover:text-saban-gold transition-colors">{brand.name}</div>
                        {brand.description && <div className="text-[10px] text-white/40 truncate">{brand.description}</div>}
                      </div>
                      <button 
                        onClick={async (e) => {
                          e.stopPropagation();
                          if (window.confirm('למחוק מותג זה?')) await BrandService.deleteBrand(brand.id);
                        }}
                        className="p-2 opacity-0 group-hover:opacity-100 hover:text-rose-400"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          ) : (
            <div className="bg-white/10 rounded-3xl border border-white/20 overflow-hidden backdrop-blur-md p-8 shadow-2xl relative">
              {/* Decorative light effect */}
              <div className="absolute top-0 right-0 w-64 h-64 bg-saban-gold/5 blur-[100px] rounded-full -translate-y-1/2 translate-x-1/2" />
              
              <div className="flex items-center gap-3 text-saban-gold mb-10 relative z-10">
                <div className="p-2 bg-saban-gold/10 rounded-lg">
                  <BookOpen size={24} />
                </div>
                <div>
                  <h2 className="font-serif text-2xl font-bold tracking-tight">אנציקלופדיית חומרי בניין</h2>
                  <p className="text-white/40 text-xs uppercase tracking-widest font-bold">מרכז מידע ומדיה טכנית</p>
                </div>
              </div>

              <div className="space-y-4 relative z-10">
                {encCategories.sort((a, b) => (a.order || 0) - (b.order || 0)).map((cat) => (
                  <div key={cat.id} className="bg-white/5 border border-white/10 rounded-2xl overflow-hidden hover:border-saban-gold/30 transition-all duration-300">
                    <div 
                      className={`p-5 flex items-center justify-between cursor-pointer transition-all ${expandedCats.has(cat.id) ? 'bg-saban-gold/10' : 'hover:bg-white/5'}`}
                      onClick={() => toggleCat(cat.id)}
                    >
                      <div className="flex items-center gap-4">
                        <div className="p-1.5 bg-white/5 rounded-md text-saban-gold">
                          {expandedCats.has(cat.id) ? <ChevronDown size={18} /> : <ChevronRight size={18} />}
                        </div>
                        <span className="font-serif text-xl text-white group-hover:text-saban-gold transition-colors">{cat.name}</span>
                        <div className="flex items-center gap-2">
                           <span className="text-[10px] text-saban-gold/60 border border-saban-gold/20 px-2 py-0.5 rounded-full uppercase font-bold tracking-tighter">
                            {encItems.filter(i => i.categoryId === cat.id).length} פריטים
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <button 
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedCat(cat);
                            setIsEditingCat(true);
                            setIsEditingEnc(false);
                            setIsEditing(false);
                          }}
                          className="p-2.5 bg-white/5 rounded-xl text-white/40 hover:text-saban-gold hover:bg-saban-gold/10 transition-all"
                        >
                          <Plus size={16} />
                        </button>
                        <button 
                          onClick={(e) => handleDeleteEncCat(e, cat.id)}
                          className="p-2.5 bg-white/5 rounded-xl text-white/40 hover:text-rose-400 hover:bg-rose-400/10 transition-all"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </div>

                    <AnimatePresence>
                      {expandedCats.has(cat.id) && (
                        <motion.div 
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: 'auto', opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          className="overflow-hidden border-t border-white/5 bg-black/40"
                        >
                          <div className="p-3 space-y-1">
                            {encItems.filter(i => i.categoryId === cat.id).map((item, idx) => (
                              <div 
                                key={`${item.id || 'enc-item'}-${idx}`}
                                onClick={() => {
                                  setSelectedEncItem(item);
                                  setIsEditingEnc(true);
                                  setIsEditingCat(false);
                                  setIsEditing(false);
                                }}
                                className="flex items-center justify-between p-4 rounded-xl hover:bg-saban-gold/5 cursor-pointer transition-all group border border-transparent hover:border-saban-gold/20"
                              >
                                <div className="flex items-center gap-4">
                                  <div className={`p-2 rounded-lg ${item.type === 'video' ? 'bg-rose-500/10 text-rose-400' : 'bg-saban-gold/10 text-saban-gold'}`}>
                                    {item.type === 'video' ? <Video size={16} /> : <Presentation size={16} />}
                                  </div>
                                  <div className="flex flex-col">
                                    <span className="text-sm font-medium group-hover:text-saban-gold transition-colors">{item.title}</span>
                                    <span className="text-[10px] text-white/20 uppercase tracking-widest">{item.type}</span>
                                  </div>
                                </div>
                                  <div className="flex items-center gap-3">
                                    {item.associatedSku && (
                                      <span className="text-[9px] bg-white/5 text-white/40 px-2 py-0.5 rounded border border-white/10 font-mono">
                                        {item.associatedSku}
                                      </span>
                                    )}
                                    <button 
                                      onClick={(e) => handleDeleteEncItem(e, item.id)}
                                      className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center opacity-0 group-hover:opacity-100 hover:text-rose-400 transition-all"
                                    >
                                      <Trash2 size={14} />
                                    </button>
                                    <div className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all group-hover:translate-x-[-4px]">
                                      <ArrowRight size={14} className="text-saban-gold" />
                                    </div>
                                  </div>
                              </div>
                            ))}
                            {encItems.filter(i => i.categoryId === cat.id).length === 0 && (
                              <div className="p-8 text-center text-white/20 text-xs italic flex flex-col items-center gap-2">
                                <Plus size={24} className="opacity-20" />
                                <span>עדיין אין פריטי מדיה בקטגוריה זו</span>
                              </div>
                            )}
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Sync Log Terminal */}
          <div className="bg-saban-black rounded-3xl border border-white/10 overflow-hidden">
            <div className="p-4 bg-white/5 flex items-center gap-2 text-white/40 border-b border-white/5">
              <Terminal size={16} />
              <span className="text-xs font-mono uppercase tracking-widest">SabanOS Sync Terminal v1.0.4</span>
            </div>
            <div className="p-6 h-48 overflow-y-auto font-mono text-sm space-y-2">
              {logs.length === 0 && <div className="text-white/20 italic">ממתין לפעולות...</div>}
              {logs.map((log, i) => (
                <div key={i} className="flex gap-4">
                  <span className="text-white/20">[{log.time}]</span>
                  <span className={
                    log.type === 'success' ? 'text-emerald-400' :
                    log.type === 'error' ? 'text-rose-400' :
                    'text-saban-gold'
                  }>
                    {log.type === 'info' ? '→' : log.type === 'success' ? '✓' : '✖'} {log.msg}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Side: Edit Panel */}
        <div className="lg:col-span-4">
          <AnimatePresence mode="wait">
            {isEditing && selectedItem ? (
              <motion.div 
                key="inventory-edit"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                className="bg-white/5 rounded-3xl border border-saban-gold/30 p-8 sticky top-8 backdrop-blur-xl"
              >
                <div className="flex justify-between items-center mb-8">
                  <h3 className="text-xl font-serif font-bold text-saban-gold">עריכת מוצר</h3>
                  <button onClick={() => setIsEditing(false)} className="text-white/40 hover:text-white">ביטול</button>
                </div>

                  <form onSubmit={handleSave} className="space-y-6">
                  <div>
                    <label className="block text-xs uppercase text-white/60 mb-2 font-bold tracking-widest">מק״ט (SKU) </label>
                    <input 
                      required
                      type="text" 
                      value={selectedItem.sku}
                      onChange={(e) => setSelectedItem({...selectedItem, sku: e.target.value})}
                      className="w-full bg-white border border-white/10 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-saban-gold transition-all text-black font-medium"
                    />
                  </div>

                  <div>
                    <label className="block text-xs uppercase text-white/60 mb-2 font-bold tracking-widest">שם המוצר</label>
                    <input 
                      required
                      type="text" 
                      value={selectedItem.ProductName}
                      onChange={(e) => setSelectedItem({...selectedItem, ProductName: e.target.value, name: e.target.value})}
                      className="w-full bg-white border border-white/10 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-saban-gold transition-all text-black font-medium"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs uppercase text-white/60 mb-2 font-bold tracking-widest">מלאי נוכחי</label>
                      <input 
                        type="number" 
                        value={selectedItem.currentStock}
                        onChange={(e) => setSelectedItem({...selectedItem, currentStock: parseInt(e.target.value), stock: parseInt(e.target.value)})}
                        className="w-full bg-white border border-white/10 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-saban-gold transition-all text-black font-medium"
                      />
                    </div>
                    <div>
                      <label className="block text-xs uppercase text-white/60 mb-2 font-bold tracking-widest">מחיר (₪)</label>
                      <input 
                        type="number" 
                        value={selectedItem.price}
                        onChange={(e) => setSelectedItem({...selectedItem, price: parseFloat(e.target.value)})}
                        className="w-full bg-white border border-white/10 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-saban-gold transition-all text-black font-medium"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs uppercase text-white/60 mb-2 font-bold tracking-widest">קטגוריה</label>
                      <select 
                        value={selectedItem.category}
                        onChange={(e) => setSelectedItem({...selectedItem, category: e.target.value})}
                        className="w-full bg-white border border-white/10 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-saban-gold transition-all text-black appearance-none font-medium text-sm"
                      >
                        {categories.map(c => (
                          <option key={c.id} value={c.id}>{c.name}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs uppercase text-white/60 mb-2 font-bold tracking-widest">מותג</label>
                      <select 
                        value={selectedItem.brand}
                        onChange={(e) => setSelectedItem({...selectedItem, brand: e.target.value})}
                        className="w-full bg-white border border-white/10 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-saban-gold transition-all text-black appearance-none font-medium text-sm"
                      >
                        {brands.map(b => (
                          <option key={b.id} value={b.name}>{b.name}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs uppercase text-white/40 mb-4 font-bold tracking-widest flex items-center gap-2">
                       גלריית תמונות (3 סלוטים)
                      <Layers size={12} />
                    </label>
                    <div className="space-y-4">
                      {/* Image 1 */}
                      <div className="flex items-center gap-3">
                        <div className="relative w-16 h-16 flex-shrink-0 group">
                          {selectedItem.imageUrl ? (
                            <img 
                              src={ProductService.sanitizeImageUrl(selectedItem.imageUrl)} 
                              className="w-full h-full object-cover rounded-lg border border-saban-gold/50 shadow-lg shadow-saban-gold/10" 
                              onError={(e) => {
                                (e.target as HTMLImageElement).src = 'https://placehold.co/100?text=Error';
                              }}
                            />
                          ) : (
                            <div className="w-full h-full bg-white/5 rounded-lg border border-dashed border-white/20 flex items-center justify-center text-white/20">
                              <Camera size={16} />
                            </div>
                          )}
                        </div>
                        <div className="flex-1 relative">
                          <input 
                            type="text" 
                            placeholder="תמונה ראשית (URL)"
                            value={selectedItem.imageUrl || ''}
                            onChange={(e) => setSelectedItem({...selectedItem, imageUrl: e.target.value})}
                            className="w-full bg-white border border-white/10 rounded-xl pl-10 pr-4 py-3 outline-none focus:ring-2 focus:ring-saban-gold transition-all text-black font-medium text-sm"
                          />
                          <ImageIcon size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-black/20" />
                          {selectedItem.imageUrl && (
                            <button onClick={() => setSelectedItem({...selectedItem, imageUrl: ''})} className="absolute right-3 top-1/2 -translate-y-1/2 text-black/20 hover:text-rose-400">
                              <X size={14} />
                            </button>
                          )}
                        </div>
                      </div>

                      {/* Image 2 */}
                      <div className="flex items-center gap-3">
                        <div className="relative w-16 h-16 flex-shrink-0 group">
                          {selectedItem.imageUrl2 ? (
                            <img 
                              src={ProductService.sanitizeImageUrl(selectedItem.imageUrl2)} 
                              className="w-full h-full object-cover rounded-lg border border-saban-gold/50 shadow-lg shadow-saban-gold/10" 
                              onError={(e) => {
                                (e.target as HTMLImageElement).src = 'https://placehold.co/100?text=Error';
                              }}
                            />
                          ) : (
                            <div className="w-full h-full bg-white/5 rounded-lg border border-dashed border-white/20 flex items-center justify-center text-white/20">
                              <ImageIcon size={16} />
                            </div>
                          )}
                        </div>
                        <div className="flex-1 relative">
                          <input 
                            type="text" 
                            placeholder="תמונה 2 (URL)"
                            value={selectedItem.imageUrl2 || ''}
                            onChange={(e) => setSelectedItem({...selectedItem, imageUrl2: e.target.value})}
                            className="w-full bg-white border border-white/10 rounded-xl pl-10 pr-4 py-3 outline-none focus:ring-2 focus:ring-saban-gold transition-all text-black font-medium text-sm"
                          />
                          <Layers size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-black/20" />
                          {selectedItem.imageUrl2 && (
                            <button onClick={() => setSelectedItem({...selectedItem, imageUrl2: ''})} className="absolute right-3 top-1/2 -translate-y-1/2 text-black/20 hover:text-rose-400">
                              <X size={14} />
                            </button>
                          )}
                        </div>
                      </div>

                      {/* Image 3 */}
                      <div className="flex items-center gap-3">
                        <div className="relative w-16 h-16 flex-shrink-0 group">
                          {selectedItem.imageUrl3 ? (
                            <img 
                              src={ProductService.sanitizeImageUrl(selectedItem.imageUrl3)} 
                              className="w-full h-full object-cover rounded-lg border border-saban-gold/50 shadow-lg shadow-saban-gold/10" 
                              onError={(e) => {
                                (e.target as HTMLImageElement).src = 'https://placehold.co/100?text=Error';
                              }}
                            />
                          ) : (
                            <div className="w-full h-full bg-white/5 rounded-lg border border-dashed border-white/20 flex items-center justify-center text-white/20">
                              <ImageIcon size={16} />
                            </div>
                          )}
                        </div>
                        <div className="flex-1 relative">
                          <input 
                            type="text" 
                            placeholder="תמונה 3 (URL)"
                            value={selectedItem.imageUrl3 || ''}
                            onChange={(e) => setSelectedItem({...selectedItem, imageUrl3: e.target.value})}
                            className="w-full bg-white border border-white/10 rounded-xl pl-10 pr-4 py-3 outline-none focus:ring-2 focus:ring-saban-gold transition-all text-black font-medium text-sm"
                          />
                          <Layers size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-black/20" />
                          {selectedItem.imageUrl3 && (
                            <button onClick={() => setSelectedItem({...selectedItem, imageUrl3: ''})} className="absolute right-3 top-1/2 -translate-y-1/2 text-black/20 hover:text-rose-400">
                              <X size={14} />
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs uppercase text-white/40 mb-2 font-bold tracking-widest flex items-center gap-2">
                       קישור למודל תלת-מימדי (GLB/GLTF)
                      <Box size={12} />
                    </label>
                    <div className="relative">
                      <input 
                        type="text" 
                        placeholder="הכנס URL של קובץ .glb או .gltf"
                        value={selectedItem.modelUrl || ''}
                        onChange={(e) => setSelectedItem({...selectedItem, modelUrl: e.target.value})}
                        className="w-full bg-white/5 border border-white/10 rounded-xl pl-10 pr-4 py-3 outline-none focus:border-saban-gold transition-all text-sm"
                      />
                      <Box size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/20" />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs uppercase text-white/40 mb-2 font-bold tracking-widest">קטגוריה</label>
                    <select 
                      value={selectedItem.category}
                      onChange={(e) => setSelectedItem({...selectedItem, category: e.target.value})}
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 outline-none focus:border-saban-gold transition-all appearance-none"
                    >
                      {categories.map(c => (
                        <option key={c.id} value={c.id}>{c.name || c.id}</option>
                      ))}
                      <option value="paint">צבעים</option>
                      <option value="adhesives">דבקים</option>
                      <option value="sealing">איטום</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs uppercase text-white/40 mb-2 font-bold tracking-widest">מותג</label>
                    <select 
                      value={selectedItem.brand}
                      onChange={(e) => setSelectedItem({...selectedItem, brand: e.target.value})}
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 outline-none focus:border-saban-gold transition-all appearance-none"
                    >
                      <option value="">בחר מותג</option>
                      <option value="Sika">Sika</option>
                      <option value="Thermokir">Thermokir</option>
                      <option value="Tambour">Tambour</option>
                      <option value="Nirlat">Nirlat</option>
                      <option value="H. Saban">H. Saban Premium</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs uppercase text-white/60 mb-2 font-bold tracking-widest flex items-center gap-2">
                       מזהה מצגת Google Slides / URL
                      <Presentation size={12} />
                    </label>
                    <input 
                      type="text" 
                      value={selectedItem.presentationId || ''}
                      onChange={(e) => setSelectedItem({...selectedItem, presentationId: e.target.value})}
                      placeholder="הדבק לינק למצגת או מזהה..."
                      className="w-full bg-white border border-white/10 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-saban-gold transition-all text-black font-medium"
                    />
                  </div>

                  <div>
                    <label className="block text-xs uppercase text-white/60 mb-2 font-bold tracking-widest flex items-center gap-2">
                      קישור לסרטון הדרכה (YouTube)
                      <Youtube size={12} />
                    </label>
                    <input 
                      type="text" 
                      value={selectedItem.tutorialUrl || ''}
                      onChange={(e) => setSelectedItem({...selectedItem, tutorialUrl: e.target.value})}
                      placeholder="https://youtu.be/..."
                      className="w-full bg-white border border-white/10 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-saban-gold transition-all text-black font-medium"
                    />
                  </div>

                  <div>
                    <label className="block text-xs uppercase text-white/60 mb-2 font-bold tracking-widest flex items-center justify-between">
                      <span>מוצרים משלימים ומערכת המלצות</span>
                      <Sparkles size={14} className="text-saban-gold" />
                    </label>
                    <div className="flex flex-wrap gap-2 mb-3">
                      {(selectedItem.recommendedSKUs || []).map((sku: string) => (
                        <div key={sku} className="flex items-center gap-1.5 px-3 py-1.5 bg-saban-gold/20 text-saban-gold border border-saban-gold/30 rounded-full text-[10px] font-bold">
                          {sku}
                          <button 
                            type="button" 
                            onClick={() => {
                              setSelectedItem({
                                ...selectedItem,
                                recommendedSKUs: selectedItem.recommendedSKUs.filter((s: string) => s !== sku)
                              });
                            }}
                            className="hover:text-white transition-colors"
                          >
                            <X size={12} />
                          </button>
                        </div>
                      ))}
                    </div>
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-black/40" size={16} />
                      <input 
                        type="text"
                        placeholder="חפש מוצר להמלצה (trowel, grout, etc)..."
                        value={productSearchQuery}
                        onChange={(e) => setProductSearchQuery(e.target.value)}
                        className="w-full bg-white border border-white/10 rounded-xl pl-4 pr-10 py-3 outline-none focus:ring-2 focus:ring-saban-gold transition-all text-black font-medium text-sm"
                      />
                      <AnimatePresence>
                        {productSearchResults.length > 0 && (
                          <motion.div 
                            initial={{ opacity: 0, y: -10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            className="absolute z-[100] bottom-full mb-2 left-0 right-0 bg-white rounded-2xl shadow-2xl border border-black/10 overflow-hidden"
                          >
                            {productSearchResults.map(product => (
                              <button
                                key={product.sku}
                                type="button"
                                onClick={() => {
                                  const current = selectedItem.recommendedSKUs || [];
                                  if (!current.includes(product.sku)) {
                                    setSelectedItem({
                                      ...selectedItem,
                                      recommendedSKUs: [...current, product.sku]
                                    });
                                  }
                                  setProductSearchQuery('');
                                }}
                                className="w-full flex items-center gap-3 p-3 hover:bg-black/5 transition-colors text-right"
                              >
                                <img src={product.imageUrl} className="w-8 h-8 rounded-lg object-cover" />
                                <div className="flex-1">
                                  <div className="text-xs font-bold text-black">{product.name}</div>
                                  <div className="text-[10px] text-black/40 font-mono uppercase">{product.sku}</div>
                                </div>
                                <Plus size={14} className="text-saban-gold" />
                              </button>
                            ))}
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs uppercase text-white/60 mb-2 font-bold tracking-widest">תיאור</label>
                    <textarea 
                      rows={3}
                      value={selectedItem.description}
                      onChange={(e) => setSelectedItem({...selectedItem, description: e.target.value})}
                      className="w-full bg-white border border-white/10 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-saban-gold transition-all resize-none text-black font-medium"
                    />
                  </div>

                  <button 
                    type="submit"
                    disabled={isSaving}
                    className="w-full py-4 bg-saban-gold text-saban-black font-bold rounded-xl flex items-center justify-center gap-2 shadow-lg shadow-saban-gold/20 hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50 disabled:scale-100"
                  >
                    {isSaving ? (
                      <RefreshCw size={18} className="animate-spin" />
                    ) : (
                      <Save size={18} />
                    )}
                    <span>{isSaving ? 'שומר שינויים...' : 'שמור שינויים ב-SabanOS'}</span>
                  </button>
                </form>

                {/* Mini Preview */}
                <div className="mt-8 pt-8 border-t border-white/10">
                  <span className="text-[10px] uppercase text-white/20 mb-4 block font-bold tracking-[0.2em]">Live Catalog Preview</span>
                  <div className="bg-saban-black rounded-2xl border border-white/10 overflow-hidden p-4 shadow-2xl">
                    {selectedItem.tutorialUrl ? (
                      <div className="mb-4">
                        <VideoPlayer url={selectedItem.tutorialUrl} poster={ProductService.sanitizeImageUrl(selectedItem.imageUrl)} />
                      </div>
                    ) : (
                      <div className="grid grid-cols-3 gap-2 mb-4">
                        <div className="col-span-2 aspect-video rounded-lg overflow-hidden border border-white/10 relative">
                          <img 
                            src={ProductService.sanitizeImageUrl(selectedItem.imageUrl)} 
                            className="w-full h-full object-cover" 
                            onError={(e) => {
                              (e.target as HTMLImageElement).src = 'https://placehold.co/400x225?text=Error';
                            }}
                          />
                          <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                        </div>
                        <div className="flex flex-col gap-2">
                          <div className="flex-1 aspect-square rounded-md overflow-hidden border border-white/10">
                            <img 
                              src={ProductService.sanitizeImageUrl(selectedItem.imageUrl2)} 
                              className="w-full h-full object-cover opacity-60 hover:opacity-100 transition-opacity" 
                              onError={(e) => {
                                (e.target as HTMLImageElement).src = 'https://placehold.co/100x100?text=2';
                              }}
                            />
                          </div>
                          <div className="flex-1 aspect-square rounded-md overflow-hidden border border-white/10">
                            <img 
                              src={ProductService.sanitizeImageUrl(selectedItem.imageUrl3)} 
                              className="w-full h-full object-cover opacity-60 hover:opacity-100 transition-opacity" 
                              onError={(e) => {
                                (e.target as HTMLImageElement).src = 'https://placehold.co/100x100?text=3';
                              }}
                            />
                          </div>
                        </div>
                      </div>
                    )}
                    <div className="text-right">
                      <div className="text-saban-gold text-[10px] uppercase font-bold">{selectedItem.category}</div>
                      <div className="text-xl font-serif">{selectedItem.ProductName || 'Product Name'}</div>
                      <div className="text-white/40 text-xs mt-1 truncate">{selectedItem.description || 'Product description will appear here...'}</div>
                    </div>
                  </div>
                </div>
              </motion.div>
            ) : isEditingBrand && selectedBrand ? (
                <motion.div 
                  key="brand-edit"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  className="bg-white/5 rounded-3xl border border-saban-gold/30 p-8 sticky top-8 backdrop-blur-xl"
                >
                  <div className="flex justify-between items-center mb-8">
                    <h3 className="text-xl font-serif font-bold text-saban-gold">עריכת מותג</h3>
                    <button onClick={() => setIsEditingBrand(false)} className="text-white/40 hover:text-white">ביטול</button>
                  </div>
  
                  <form onSubmit={handleSaveBrand} className="space-y-6">
                    <div>
                      <label className="block text-xs uppercase text-white/60 mb-2 font-bold tracking-widest">שם המותג</label>
                      <input 
                        required
                        type="text" 
                        value={selectedBrand.name}
                        onChange={(e) => setSelectedBrand({...selectedBrand, name: e.target.value})}
                        className="w-full bg-white border border-white/10 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-saban-gold transition-all text-black font-medium"
                      />
                    </div>
  
                    <div>
                      <label className="block text-xs uppercase text-white/60 mb-2 font-bold tracking-widest">לוגו (URL)</label>
                      <input 
                        type="text" 
                        value={selectedBrand.logo || ''}
                        onChange={(e) => setSelectedBrand({...selectedBrand, logo: e.target.value})}
                        className="w-full bg-white border border-white/10 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-saban-gold transition-all text-black font-medium"
                      />
                    </div>
  
                    <div>
                      <label className="block text-xs uppercase text-white/60 mb-2 font-bold tracking-widest">תיאור</label>
                      <textarea 
                        rows={3}
                        value={selectedBrand.description || ''}
                        onChange={(e) => setSelectedBrand({...selectedBrand, description: e.target.value})}
                        className="w-full bg-white border border-white/10 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-saban-gold transition-all resize-none text-black font-medium"
                      />
                    </div>
  
                    <button 
                      type="submit"
                      disabled={isSaving}
                      className="w-full py-4 bg-saban-gold text-saban-black font-bold rounded-xl flex items-center justify-center gap-2 shadow-lg shadow-saban-gold/20 transition-all disabled:opacity-50"
                    >
                      {isSaving ? <RefreshCw size={18} className="animate-spin" /> : <Save size={18} />}
                      <span>שמור מותג</span>
                    </button>
                  </form>
                </motion.div>
              ) : isEditingCatalogCat && selectedCatalogCat ? (
                <motion.div 
                  key="catalog-cat-edit"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  className="bg-white/5 rounded-3xl border border-saban-gold/30 p-8 sticky top-8 backdrop-blur-xl"
                >
                  <div className="flex justify-between items-center mb-8">
                    <h3 className="text-xl font-serif font-bold text-saban-gold">עריכת קטגוריה</h3>
                    <button onClick={() => setIsEditingCatalogCat(false)} className="text-white/40 hover:text-white">ביטול</button>
                  </div>
  
                  <form onSubmit={handleSaveCatalogCat} className="space-y-6">
                    <div>
                      <label className="block text-xs uppercase text-white/60 mb-2 font-bold tracking-widest">מזהה (ID - אנגלית בלבד)</label>
                      <input 
                        required
                        type="text" 
                        value={selectedCatalogCat.id}
                        onChange={(e) => setSelectedCatalogCat({...selectedCatalogCat, id: e.target.value.toLowerCase().replace(/\s+/g, '-')})}
                        disabled={!!selectedCatalogCat.id && categories.some(c => c.id === selectedCatalogCat.id)}
                        className="w-full bg-white border border-white/10 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-saban-gold transition-all disabled:opacity-50 text-black font-medium"
                      />
                    </div>
  
                    <div>
                      <label className="block text-xs uppercase text-white/60 mb-2 font-bold tracking-widest">שם הקטגוריה</label>
                      <input 
                        required
                        type="text" 
                        value={selectedCatalogCat.name}
                        onChange={(e) => setSelectedCatalogCat({...selectedCatalogCat, name: e.target.value})}
                        className="w-full bg-white border border-white/10 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-saban-gold transition-all text-black font-medium"
                      />
                    </div>
  
                    <div>
                      <label className="block text-xs uppercase text-white/60 mb-2 font-bold tracking-widest">אייקון / תמונה (URL)</label>
                      <input 
                        type="text" 
                        value={selectedCatalogCat.icon || selectedCatalogCat.image || ''}
                        onChange={(e) => setSelectedCatalogCat({...selectedCatalogCat, icon: e.target.value, image: e.target.value})}
                        className="w-full bg-white border border-white/10 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-saban-gold transition-all text-black font-medium"
                      />
                    </div>
  
                    <button 
                      type="submit"
                      disabled={isSaving}
                      className="w-full py-4 bg-saban-gold text-saban-black font-bold rounded-xl flex items-center justify-center gap-2 shadow-lg shadow-saban-gold/20 transition-all disabled:opacity-50"
                    >
                      {isSaving ? <RefreshCw size={18} className="animate-spin" /> : <Save size={18} />}
                      <span>שמור קטגוריה</span>
                    </button>
                  </form>
                </motion.div>
              ) : isEditingEnc && selectedEncItem ? (
              <motion.div 
                key="encyclopedia-item-edit"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                className="bg-white/5 rounded-3xl border border-saban-gold/30 p-8 sticky top-8 backdrop-blur-xl"
              >
                <div className="flex justify-between items-center mb-8">
                  <h3 className="text-xl font-serif font-bold text-saban-gold">עריכת פריט מדיה</h3>
                  <button onClick={() => setIsEditingEnc(false)} className="text-white/40 hover:text-white">ביטול</button>
                </div>

                <form onSubmit={handleSaveEncItem} className="space-y-6">
                  <div>
                    <label className="block text-xs uppercase text-white/60 mb-2 font-bold tracking-widest">כותרת הפריט</label>
                    <input 
                      required
                      ref={mediaInputRef}
                      type="text" 
                      value={selectedEncItem.title}
                      onChange={(e) => setSelectedEncItem({...selectedEncItem, title: e.target.value})}
                      className="w-full bg-white border border-white/10 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-saban-gold transition-all text-black font-medium"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs uppercase text-white/60 mb-2 font-bold tracking-widest">קטגוריה</label>
                      <select 
                        value={selectedEncItem.categoryId}
                        onChange={(e) => setSelectedEncItem({...selectedEncItem, categoryId: e.target.value})}
                        className="w-full bg-white border border-white/10 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-saban-gold transition-all text-black appearance-none font-medium"
                      >
                        <option value="">בחר קטגוריה</option>
                        {encCategories.map(c => (
                          <option key={c.id} value={c.id}>{c.name}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs uppercase text-white/60 mb-2 font-bold tracking-widest">מותג משויך</label>
                      <select 
                        value={selectedEncItem.brandId || ''}
                        onChange={(e) => setSelectedEncItem({...selectedEncItem, brandId: e.target.value})}
                        className="w-full bg-white border border-white/10 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-saban-gold transition-all text-black appearance-none font-medium"
                      >
                        <option value="">ללא מותג ספציפי</option>
                        {brands.map(b => (
                          <option key={b.id} value={b.id}>{b.name}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs uppercase text-white/60 mb-2 font-bold tracking-widest flex items-center gap-2">
                        <Presentation size={14} className="text-saban-gold" />
                        קישור למצגת (Google Slides)
                      </label>
                      <input 
                        type="text" 
                        value={selectedEncItem.presentationUrl || selectedEncItem.url || ''}
                        onChange={(e) => setSelectedEncItem({...selectedEncItem, presentationUrl: e.target.value, url: e.target.value, type: 'slide'})}
                        placeholder="Google Slides ID or URL"
                        className="w-full bg-white border border-white/10 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-saban-gold transition-all text-black font-medium"
                      />
                    </div>
                    <div>
                      <label className="block text-xs uppercase text-white/60 mb-2 font-bold tracking-widest flex items-center gap-2">
                        <Video size={14} className="text-saban-gold" />
                        קישור לסרטון (YouTube)
                      </label>
                      <input 
                        type="text" 
                        value={selectedEncItem.videoUrl || (selectedEncItem.type === 'video' ? selectedEncItem.url : '') || ''}
                        onChange={(e) => setSelectedEncItem({...selectedEncItem, videoUrl: e.target.value, url: e.target.value, type: 'video'})}
                        placeholder="YouTube URL..."
                        className="w-full bg-white border border-white/10 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-saban-gold transition-all text-black font-medium"
                      />
                    </div>
                  </div>

                  {/* SMART AUTOCOMPLETE LINKER */}
                  <div className="relative">
                    <label className="block text-xs uppercase text-white/60 mb-2 font-bold tracking-widest flex items-center justify-between">
                      <span>מוצרים מקושרים (Multi-tagging)</span>
                      <Box size={14} className="text-saban-gold" />
                    </label>
                    <div className="flex flex-wrap gap-2 mb-3">
                      {(selectedEncItem.linkedProductSKUs || []).map((sku: string) => (
                        <div key={sku} className="flex items-center gap-1.5 px-3 py-1.5 bg-saban-gold/20 text-saban-gold border border-saban-gold/30 rounded-full text-[10px] font-bold">
                          {sku}
                          <button 
                            type="button" 
                            onClick={() => {
                              setSelectedEncItem({
                                ...selectedEncItem,
                                linkedProductSKUs: selectedEncItem.linkedProductSKUs.filter((s: string) => s !== sku)
                              });
                            }}
                            className="hover:text-white transition-colors"
                          >
                            <X size={12} />
                          </button>
                        </div>
                      ))}
                    </div>
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-black/40" size={16} />
                      <input 
                        type="text"
                        placeholder="חפש מוצר להוספה (לפי שם או מק״ט)..."
                        value={productSearchQuery}
                        onChange={(e) => setProductSearchQuery(e.target.value)}
                        className="w-full bg-white border border-white/10 rounded-xl pl-4 pr-10 py-3 outline-none focus:ring-2 focus:ring-saban-gold transition-all text-black font-medium text-sm"
                      />
                      <AnimatePresence>
                        {productSearchResults.length > 0 && (
                          <motion.div 
                            initial={{ opacity: 0, y: -10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            className="absolute z-[100] top-full mt-2 left-0 right-0 bg-white rounded-2xl shadow-2xl border border-black/10 overflow-hidden"
                          >
                            {productSearchResults.map(product => (
                              <button
                                key={product.sku}
                                type="button"
                                onClick={() => {
                                  const current = selectedEncItem.linkedProductSKUs || [];
                                  if (!current.includes(product.sku)) {
                                    setSelectedEncItem({
                                      ...selectedEncItem,
                                      linkedProductSKUs: [...current, product.sku]
                                    });
                                  }
                                  setProductSearchQuery('');
                                }}
                                className="w-full flex items-center gap-3 p-3 hover:bg-black/5 transition-colors text-right"
                              >
                                <img src={product.imageUrl} className="w-8 h-8 rounded-lg object-cover" />
                                <div className="flex-1">
                                  <div className="text-xs font-bold text-black">{product.name}</div>
                                  <div className="text-[10px] text-black/40 font-mono uppercase">{product.sku}</div>
                                </div>
                                <Plus size={14} className="text-saban-gold" />
                              </button>
                            ))}
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs uppercase text-white/60 mb-2 font-bold tracking-widest">תיאור מקצועי</label>
                    <textarea 
                      rows={4}
                      value={selectedEncItem.description || ''}
                      onChange={(e) => setSelectedEncItem({...selectedEncItem, description: e.target.value})}
                      className="w-full bg-white border border-white/10 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-saban-gold transition-all resize-none text-black font-medium"
                    />
                  </div>

                  <button 
                    type="submit"
                    disabled={isSaving}
                    className="w-full py-4 bg-saban-gold text-saban-black font-bold rounded-xl flex items-center justify-center gap-2 shadow-lg shadow-saban-gold/20 transition-all disabled:opacity-50"
                  >
                    {isSaving ? <RefreshCw size={18} className="animate-spin" /> : <Save size={18} />}
                    <span>שמור פריט</span>
                  </button>
                </form>
              </motion.div>
            ) : isEditingCat && selectedCat ? (
              <motion.div 
                key="encyclopedia-cat-edit"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                className="bg-white/5 rounded-3xl border border-saban-gold/30 p-8 sticky top-8 backdrop-blur-xl"
              >
                <div className="flex justify-between items-center mb-8">
                  <h3 className="text-xl font-serif font-bold text-saban-gold">עריכת קטגוריה</h3>
                  <button onClick={() => setIsEditingCat(false)} className="text-white/40 hover:text-white">ביטול</button>
                </div>

                  <form onSubmit={handleSaveEncCat} className="space-y-6">
                  <div>
                    <label className="block text-xs uppercase text-white/60 mb-2 font-bold tracking-widest">שם הקטגוריה</label>
                    <input 
                      required
                      ref={categoryInputRef}
                      type="text" 
                      value={selectedCat.name}
                      onChange={(e) => setSelectedCat({...selectedCat, name: e.target.value})}
                      className="w-full bg-white border border-white/10 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-saban-gold transition-all text-black font-medium"
                    />
                  </div>

                  <div>
                    <label className="block text-xs uppercase text-white/60 mb-2 font-bold tracking-widest">תיאור</label>
                    <textarea 
                      rows={3}
                      value={selectedCat.description || ''}
                      onChange={(e) => setSelectedCat({...selectedCat, description: e.target.value})}
                      className="w-full bg-white border border-white/10 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-saban-gold transition-all resize-none text-black font-medium"
                    />
                  </div>

                  <div>
                    <label className="block text-xs uppercase text-white/60 mb-2 font-bold tracking-widest">סדר תצוגה</label>
                    <input 
                      type="number" 
                      value={selectedCat.order || 0}
                      onChange={(e) => setSelectedCat({...selectedCat, order: parseInt(e.target.value)})}
                      className="w-full bg-white border border-white/10 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-saban-gold transition-all text-black font-medium"
                    />
                  </div>

                  <button 
                    type="submit"
                    disabled={isSaving}
                    className="w-full py-4 bg-saban-gold text-saban-black font-bold rounded-xl flex items-center justify-center gap-2 shadow-lg shadow-saban-gold/20 transition-all disabled:opacity-50"
                  >
                    {isSaving ? <RefreshCw size={18} className="animate-spin" /> : <Save size={18} />}
                    <span>שמור קטגוריה</span>
                  </button>
                </form>
              </motion.div>
            ) : (
              <div key="nothing-selected" className="h-full flex items-center justify-center border-2 border-dashed border-white/5 rounded-3xl p-8 text-center text-white/20">
                <div>
                  <AlertCircle size={48} className="mx-auto mb-4 opacity-50" />
                  <p>בחר פריט או קטגוריה<br />כדי להתחיל בניהול המידע</p>
                </div>
              </div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
};
