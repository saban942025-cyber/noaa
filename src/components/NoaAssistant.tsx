import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Send, Sparkles, X, ChevronDown, User, Bot, ShoppingCart, Plus, Minus, Calculator, Truck, CheckCircle2, Package } from 'lucide-react';
import { aiAssistant } from '../services/geminiService';
import { ProductService, EncyclopediaService, CategoryService } from '../services/firebaseService';
import ReactMarkdown from 'react-markdown';
import confetti from 'canvas-confetti';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  type?: 'text' | 'quantity_picker' | 'order_summary' | 'success';
  data?: any;
}

interface CartItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
  sku: string;
  unit: string;
}

type FlowStep = 'chat' | 'quantity' | 'checkout_name' | 'checkout_address' | 'checkout_delivery' | 'checkout_crane_height' | 'checkout_phone';

export const NoaAssistant: React.FC<{ 
  productContext?: string;
  triggerProduct?: any;
  triggerExternalContext?: { content: string };
  onTriggerProcessed?: () => void;
  onNavigateToProduct?: (sku: string) => void;
}> = ({ productContext, triggerProduct, triggerExternalContext, onTriggerProcessed, onNavigateToProduct }) => {
  const [isMinimized, setIsMinimized] = React.useState(true);
  const [messages, setMessages] = React.useState<Message[]>([
    {
      id: '1',
      role: 'assistant',
      content: 'שלום שותף למקצוע! אני נועה, היועצת החכמה של ח.סבן חומרי בנין. איך אוכל לסייע לך בפרויקט היום?'
    }
  ]);

  React.useEffect(() => {
    // Lead inventory context
    const unsubscribe = ProductService.listenProducts((products) => {
      setInventory(products || []);
    });
    CategoryService.getAllCategories().then(_data => setInventory((prev: any[]) => [...prev])); // Dummy to ensure categories exist if needed

    // Encyclopedia Listeners
    const unsubEncCat = EncyclopediaService.listenCategories((cats) => {
      setEncData((prev: any) => ({ ...prev, categories: cats }));
    });
    const unsubEncItem = EncyclopediaService.listenItems((items) => {
      setEncData((prev: any) => ({ ...prev, items }));
    });

    console.log("Log Sync Active: Noa_AI_Logs");

    return () => {
      unsubscribe();
      unsubEncCat();
      unsubEncItem();
    };
  }, []);

  React.useEffect(() => {
    if (triggerExternalContext) {
      setIsMinimized(false);
      addMessage('assistant', triggerExternalContext.content);
      if (onTriggerProcessed) onTriggerProcessed();
    }
  }, [triggerExternalContext]);

  React.useEffect(() => {
    if (triggerProduct) {
      setIsMinimized(false);
      setPendingProduct(triggerProduct);
      setCurrentStep('quantity');
      addMessage('assistant', `בחרת להוסיף את ${triggerProduct.name || triggerProduct.ProductName} לסל. באיזו כמות תרצה להזמין?`, 'quantity_picker', triggerProduct);
      if (onTriggerProcessed) onTriggerProcessed();
    }
  }, [triggerProduct]);
  const [input, setInput] = React.useState('');
  const [isLoading, setIsLoading] = React.useState(false);
  const [inventory, setInventory] = React.useState<any[]>([]);
  const [encData, setEncData] = React.useState<{categories: any[], items: any[]}>({ categories: [], items: [] });
  
  // Persistence Initialization
  const [cart, setCart] = React.useState<CartItem[]>([]);

  const [orderData, setOrderData] = React.useState({
    name: '',
    address: '',
    deliveryMethod: '',
    phone: ''
  });

  // Initial Hydration
  React.useEffect(() => {
    if (typeof window !== 'undefined') {
      const savedCart = localStorage.getItem('saban_cart');
      if (savedCart) {
        try {
          setCart(JSON.parse(savedCart));
        } catch (e) {
          console.error("Failed to parse saved cart:", e);
        }
      }

      const savedUser = localStorage.getItem('saban_user');
      if (savedUser) {
        try {
          setOrderData(JSON.parse(savedUser));
        } catch (e) {
          console.error("Failed to parse saved user:", e);
        }
      }
    }
  }, []);

  // Persist Changes
  React.useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('saban_cart', JSON.stringify(cart));
    }
  }, [cart]);

  React.useEffect(() => {
    if (typeof window !== 'undefined' && orderData.name) {
      localStorage.setItem('saban_user', JSON.stringify(orderData));
    }
  }, [orderData]);

  const [currentStep, setCurrentStep] = React.useState<FlowStep>('chat');
  const [pendingProduct, setPendingProduct] = React.useState<any>(null);
  const [pendingConfirmation, setPendingConfirmation] = React.useState<{product: any, qty: number} | null>(null);
  
  const scrollRef = React.useRef<HTMLDivElement>(null);

  const noaAvatar = "https://i.postimg.cc/qqWtk5qr/Gemini-Generated-Image-6z6qts6z6qts6z6q.png";
  const noaVideo = "https://player.vimeo.com/external/494252666.sd.mp4?s=72973b62847c576d8ad3783b2853b0a3fd76964a&profile_id=165&oauth2_token_id=57447761"; // Professional placeholder video

  const isNoaSpeaking = isLoading;

  React.useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isLoading]);

  const addMessage = (role: 'user' | 'assistant', content: string, type: Message['type'] = 'text', data?: any) => {
    const msg: Message = { id: Date.now().toString(), role, content, type, data };
    setMessages((prev: Message[]) => [...prev, msg]);
    return msg;
  };

  const showSummaryAndAskPhone = (deliveryMethod: string) => {
    setOrderData((prev: any) => ({ ...prev, deliveryMethod }));
    const summary = cart.map(item => `- ${item.name}: ${item.quantity} ${item.unit}`).join('\n');
    addMessage('assistant', `מצוין. בחרת ב-${deliveryMethod}.\nהנה סיכום ההזמנה שלך:\n${summary}\n\nסה"כ: ₪${cart.reduce((sum, item) => sum + (item.price * item.quantity), 0)}\n\nמה מספר הטלפון ליצירת קשר?`);
    setCurrentStep('checkout_phone');
  };

  const findProduct = (text: string, isAreaSearch: boolean = false) => {
    if (!inventory.length) return null;
    const search = text.toLowerCase().trim();
    
    // 1. Exact match by SKU or Name
    const exact = inventory.find(p => 
      String(p.sku).toLowerCase() === search || 
      (p.ProductName && p.ProductName.toLowerCase() === search) ||
      (p.name && p.name.toLowerCase() === search)
    );
    if (exact) {
      if (exact.imageUrl && (exact.imageUrl.includes('"') || exact.imageUrl.includes('%22'))) {
        console.log(`Cleaning URL for [${exact.name || exact.ProductName}]...`);
      }
      return exact;
    }

    const searchWords = search.split(/\s+/).filter(w => w.length > 1);

    // 2. Smart Default for "בטון" + Area
    if (isAreaSearch && searchWords.includes('בטון')) {
      const concreteBags = inventory.find(p => p.ProductName?.includes('בטון מוכן') || p.sku === 'CEMENT-001');
      if (concreteBags) return concreteBags;
    }

    // 3. Fuzzy/Partial match with word splitting
    let fuzzyMatches = inventory.filter(p => {
      const pName = (p.ProductName || p.name || '').toLowerCase();
      const pCat = (p.category || '').toLowerCase();
      const pSku = String(p.sku || '').toLowerCase();
      
      return searchWords.every(word => 
        pName.includes(word) || pCat.includes(word) || pSku.includes(word)
      );
    });

    // 4. Priority Filtering for Area Search
    if (isAreaSearch && fuzzyMatches.length > 1) {
      // Prioritize bags/buckets/kg/sqm over blocks or rigid units
      const priorityMatches = fuzzyMatches.filter(p => {
        const unit = (p.unit || '').toLowerCase();
        const cat = (p.category || '').toLowerCase();
        return ['bag', 'bucket', 'kg', 'sqm', 'שק', 'דלי', 'ק"ג'].some(u => unit.includes(u)) ||
               ['cement', 'aggregates', 'sealing', 'בטון', 'דבק', 'איטום'].some(c => cat.includes(c));
      });
      if (priorityMatches.length > 0) fuzzyMatches = priorityMatches;
    }
    
    if (fuzzyMatches.length === 1) return fuzzyMatches[0];
    if (fuzzyMatches.length > 1) return fuzzyMatches;

    // 5. Last resort: any word match
    const looseMatches = inventory.filter(p => {
      const pName = (p.ProductName || p.name || '').toLowerCase();
      return searchWords.some(word => pName.includes(word));
    });

    return looseMatches.length === 1 ? looseMatches[0] : (looseMatches.length > 1 ? looseMatches : null);
  };

  const handleSend = async (overrideInput?: string) => {
    const text = overrideInput || input;
    if (!text.trim() || isLoading) return;

    if (!overrideInput) {
      addMessage('user', text);
      ProductService.sendLogToGas("Customer", text);
      setInput('');
    }
    
    setIsLoading(true);

    // 0. Handle Confirmation logic (Yes/Add)
    if (pendingConfirmation && (text.includes('כן') || text.includes('תוסיפי') || text.includes('אללה') || text.includes('סבבה') || text.includes('תזמין'))) {
      addToCart(pendingConfirmation.product, pendingConfirmation.qty);
      setPendingConfirmation(null);
      setIsLoading(false);
      return;
    }

    // 1. Process explicit "Add X" or product search before AI for speed
    const hasArea = text.match(/(\d+)\s*(מ"ר|מר|sqm|square meters)/i);
    const mentionsAdd = text.toLowerCase().match(/הוסף|להוסיף|אני רוצה|בבקשה|של|את|צריך|מחפש/g);

    if (mentionsAdd || hasArea) {
      const cleanerText = text.replace(/הוסף|להוסיף|אני רוצה|בבקשה|של|את|צריך|מחפש|ל|[\d]+|מ"ר|מר|sqm|square meters/g, '').trim();
      const matchStatus = findProduct(cleanerText, !!hasArea);
      
      if (matchStatus && !Array.isArray(matchStatus)) {
        if (hasArea) {
          const area = parseFloat(hasArea[1]);
          const coverage = parseFloat(matchStatus.coverage) || parseFloat(matchStatus.CoverageRate) || 12;
          const autoQty = Math.ceil(area / coverage);
          
          let responseText = `זיהיתי שאתה צריך **${matchStatus.ProductName}** ל-${area} מ"ר.`;
          if (cleanerText === 'בטון') {
            responseText = `נראה לי שאתה צריך בטון מוכן לכיסוי השטח. עבור ${area} מ"ר, לפי כושר הכיסוי המקצועי, זה יוצא בדיוק **${autoQty}** יחידות. זה הכיוון שותף?`;
          } else {
            responseText += ` לפי כושר הכיסוי, זה יוצא בדיוק **${autoQty}** ${matchStatus.unit || 'יחידות'}. להוסיף אותם לסל שלך?`;
          }
          
          addMessage('assistant', responseText);
          setPendingConfirmation({ product: matchStatus, qty: autoQty });
          setIsLoading(false);
          return;
        } else {
          addMessage('assistant', `מעולה, הוספתי את **${matchStatus.ProductName}** לסל. כמה יחידות תצטרך? (אפשר להקליד כמות או לבקש ממני לחשב לפי מ"ר)`, 'quantity_picker', matchStatus);
          setPendingProduct(matchStatus);
          setCurrentStep('quantity');
          setIsLoading(false);
          return;
        }
      } else if (Array.isArray(matchStatus) && matchStatus.length > 1) {
        // Contextual Reasoning for Concrete
        if (cleanerText.includes('בטון')) {
          addMessage('assistant', 'האם הכוונה לבטון מוכן לריצוף/יציקה או לבלוקים לבנייה? (יש לי את שניהם במלאי)');
        } else {
          const names = matchStatus.slice(0, 3).map(p => p.ProductName).join(', ');
          addMessage('assistant', `מצאתי כמה מוצרים שמתאימים לתיאור שלך: ${names}. על איזה מהם מדובר שותף?`);
        }
        setIsLoading(false);
        return;
      }
    }

    // Handle steps
    if (currentStep === 'quantity' && !overrideInput) {
      const q = parseInt(text);
      if (isNaN(q) || q <= 0) {
        addMessage('assistant', 'נא להזין כמות תקינה במספרים.');
        setIsLoading(false);
        return;
      }
      addToCart(pendingProduct, q);
      setIsLoading(false);
      return;
    }

    if (currentStep === 'checkout_name') {
      setOrderData((prev: any) => ({ ...prev, name: text }));
      addMessage('assistant', 'תודה, מה כתובת האספקה המדויקת?');
      setCurrentStep('checkout_address');
      setIsLoading(false);
      return;
    }

    if (currentStep === 'checkout_address') {
      setOrderData((prev: any) => ({ ...prev, address: text }));
      addMessage('assistant', 'כיצד תרצה שההובלה תתבצע?', 'text');
      // Inline options for delivery
      setTimeout(() => {
        addMessage('assistant', 'בחר שיטת אספקה:', 'text');
      }, 100);
      setCurrentStep('checkout_delivery');
      setIsLoading(false);
      return;
    }

    if (currentStep === 'checkout_delivery') {
      if (text.includes('מנוף') || text.includes('הנפה')) {
        setOrderData((prev: any) => ({ ...prev, deliveryMethod: 'הנפה (מנוף)' }));
        addMessage('assistant', 'הבנתי, מנוף. איזה גובה הנפה נדרש לפרויקט? (עד 10 מטר / מעל 10 מטר)');
        setCurrentStep('checkout_crane_height');
      } else if (text.includes('ידנית')) {
        setOrderData((prev: any) => ({ ...prev, deliveryMethod: 'פריקה ידנית' }));
        showSummaryAndAskPhone('פריקה ידנית');
      } else {
        showSummaryAndAskPhone(text);
      }
      setIsLoading(false);
      return;
    }

    if (currentStep === 'checkout_crane_height') {
      setOrderData((prev: any) => ({ ...prev, deliveryMethod: `${prev.deliveryMethod} - גובה: ${text}` }));
      showSummaryAndAskPhone(`${orderData.deliveryMethod} - גובה: ${text}`);
      setIsLoading(false);
      return;
    }

    if (currentStep === 'checkout_phone') {
      const phoneClean = text.replace(/\D/g, '');
      if (phoneClean.length < 9) {
        addMessage('assistant', 'נא להזין מספר טלפון תקין.');
        setIsLoading(false);
        return;
      }
      const finalOrder = { ...orderData, phone: text };
      setOrderData(finalOrder);
      submitOrder(finalOrder);
      return;
    }

    // Standard AI logic
    if (text.includes('אספקה') || text.includes('להתקדם') || text.includes('קופה') || text.includes('סיימתי')) {
      if (cart.length > 0) {
        startCheckout();
        setIsLoading(false);
        return;
      }
    }

    if (text.toLowerCase().includes('לא') && messages[messages.length-1]?.content.includes('שיטת היישום')) {
      addMessage('assistant', 'אשמח לנווט אותך לכרטיס המוצר. שם תמצא סרטון הדרכה ומצגת טכנית להעמקת הידע, כדי שתרכיב את הסל המקצועי ביותר עם מינימום בלאי. אתה יכול גם לשאול אותי כל שאלה כאן!');
      setIsLoading(false);
      return;
    }

    if (text.includes('כרטיס מוצר') || text.includes('מידע נוסף')) {
      if (onNavigateToProduct && pendingProduct?.sku) {
        onNavigateToProduct(pendingProduct.sku);
      }
    }

    // Media Search Context Injection
    const mediaQuery = text.includes('איך') || text.includes('מדריך') || text.includes('סרטון') || text.includes('מצגת');
    const mediaResults = mediaQuery ? inventory.filter(p => p.presentationId || p.tutorialUrl) : [];
    const mediaContext = mediaResults.length > 0
      ? `להלן מוצרים עם מדריכים טכניים זמינים: ${mediaResults.map(p => `${p.ProductName} (מצגת: ${p.presentationId ? 'כן' : 'לא'}, סרטון: ${p.tutorialUrl ? 'כן' : 'לא'})`).join(', ')}`
      : '';

    const inventoryContext = inventory.length > 0 
      ? `המלאי הזמין כרגע: ${inventory.map(p => `${p.ProductName} (קטגוריה: ${p.category}, מק"ט: ${p.sku})`).join(', ')}`
      : 'המלאי כרגע מתעדכן.';
      
    // Saban-Pedia Context
    const encContext = encData.categories.length > 0
      ? `ידע מקצועי (Saban-Pedia): ${encData.categories.map(c => {
          const items = encData.items.filter(i => i.categoryId === c.id);
          return `קטגוריה: ${c.name} (${c.description || ''}). פריטים: ${items.map(i => `${i.title} (סוג: ${i.type}, SKU קשור: ${i.associatedSku || 'אין'})`).join(', ')}`;
        }).join(' | ')}`
      : '';

    const fullContext = `${productContext || ''}\n\n${inventoryContext}\n\n${mediaContext}\n\n${encContext}\n\nאם המשתמש שואל שאלה כללית או טכנית על חומרים (כמו "איך לאטום?"), השתמש במידע מהאנציקלופדיה והצע לו את המצגת או הסרטון הרלוונטיים מהרשימה.`;
    const response = await aiAssistant.getResponse(text, fullContext);
    
    // Check if AI suggested adding to cart or starting order
    if (response?.includes('START_ORDER')) {
      if (cart.length === 0) {
        addMessage('assistant', 'הסל שלך ריק. בוא נוסיף כמה מוצרים קודם!');
        ProductService.sendLogToGas("Noa", 'הסל שלך ריק. בוא נוסיף כמה מוצרים קודם!');
      } else {
        startCheckout();
      }
    } else {
      addMessage('assistant', response || '');
      ProductService.sendLogToGas("Noa", response || '');
    }
    
    setIsLoading(false);
  };

  const startCheckout = () => {
    addMessage('assistant', 'מעולה, בוא נשלים את ההזמנה. מה שמך המלא?');
    setCurrentStep('checkout_name');
  };

  const addToCart = (product: any, quantity: number) => {
    const newItem: CartItem = {
      id: product.sku || product.id,
      name: product.name || product.ProductName,
      price: product.price || 0,
      quantity,
      sku: product.sku,
      unit: product.unit || 'יחידות'
    };

    setCart((prev: CartItem[]) => {
      const existing = prev.find(i => i.sku === newItem.sku);
      if (existing) {
        return prev.map(i => i.sku === newItem.sku ? { ...i, quantity: i.quantity + quantity } : i);
      }
      return [...prev, newItem];
    });

    addMessage('assistant', `מעולה שותף! הוספתי ${quantity} ${newItem.unit} של ${newItem.name} לסל המקצועי שלך.
    
האם אתה מכיר את שיטת היישום וזמן היבוש של המוצר? חשוב לעבוד לפי ההוראות כדי למזער בלאי ולהבטיח תוצאה מושלמת.`);
    
    setTimeout(() => {
      addMessage('assistant', 'האם תרצה להוסיף מוצרים נוספים לסל המקצועי שלך, או שנתקדם לפרטי האספקה?');
    }, 1000);

    setPendingProduct(null);
    setCurrentStep('chat');
  };

  const getOfficialPrice = (sku: string) => {
    const p = inventory.find(i => String(i.sku) === String(sku));
    return p ? (parseFloat(p.price) || 0) : 0;
  };

  const submitOrder = async (finalOrderData: any) => {
    setIsLoading(true);
    addMessage('assistant', 'שולח את ההזמנה למערכת SabanOS... נא להמתין.');
    
    // Ensure we have the latest prices from inventory
    const enrichedItems = cart.map(item => {
      const realProduct = inventory.find(i => String(i.sku) === String(item.sku));
      const realPrice = realProduct ? parseFloat(realProduct.price) : item.price;
      return {
        ...item,
        price: realPrice,
        total: realPrice * item.quantity
      };
    });

    const totalPrice = enrichedItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    // Explicit format request: "3x בטון מוכן (25 ק"ג)"
    const itemsSummary = enrichedItems.map(item => `${item.quantity}x ${item.name} (${item.unit})`).join(' | ');

    // Extract lifting height from deliveryMethod if present
    let liftingHeight = "לא נדרש";
    if (finalOrderData.deliveryMethod.includes('גובה:')) {
      liftingHeight = finalOrderData.deliveryMethod.split('גובה:')[1].trim();
    }

    // Flattened payload for easy GSHEET consumption as requested by Senior Architect
    const gasPayload = {
      customerName: finalOrderData.name,
      phone: finalOrderData.phone,
      address: finalOrderData.address,
      deliveryMethod: finalOrderData.deliveryMethod,
      itemsSummary,
      totalPrice,
      liftingHeight,
      type: "order",
      timestamp: new Date().toLocaleString('he-IL'),
      status: 'pending'
    };

    console.log("Submitting sanitized order to GAS:", gasPayload);

    const result = await ProductService.sendOrderToGas(gasPayload);

    // UI Feedback: Success Celebration
    confetti({
      particleCount: 150,
      spread: 70,
      origin: { y: 0.6 },
      colors: ['#C5A059', '#FFFFFF', '#000000']
    });

    // Audio Feedback
    const audio = new Audio('https://assets.mixkit.co/active_storage/sfx/1435/1435-preview.mp3');
    audio.play().catch(() => {});

    if (result && (result.success || result.status === 'success')) {
      addMessage('assistant', 'ההזמנה התקבלה במערכת בהצלחה! שותף, אנחנו נחזור אליך בקרוב לתיאום סופי.', 'success', gasPayload);
      setCart([]);
      localStorage.removeItem('saban_cart');
      setCurrentStep('chat');
    } else {
      const errorMsg = result?.message || "Unknown GAS error";
      console.error("GAS Submission Failed:", errorMsg);
      addMessage('assistant', `חלה שגיאה בשליחת ההזמנה (GAS). אל דאגה, הצוות שלנו קיבל התראה: ${errorMsg}`);
    }
    setIsLoading(false);
  };

  const QuantityPicker = ({ product }: { product: any }) => {
    const [q, setQ] = React.useState(1);
    const [sqm, setSqm] = React.useState('');

    const calculateFromSqm = () => {
      const area = parseFloat(sqm);
      if (isNaN(area)) return;
      const coverage = parseFloat(product.coverage) || parseFloat(product.CoverageRate) || 12; 
      const needed = Math.ceil(area / coverage);
      setQ(needed);
    };

    return (
      <div className="bg-white/5 border border-white/10 rounded-xl p-4 mt-2 space-y-4">
        <div className="flex items-center justify-between">
          <span className="text-xs text-white/40 font-bold uppercase tracking-widest">בחירת כמות</span>
          <div className="flex items-center gap-4 bg-white/10 rounded-lg px-2 py-1">
            <button onClick={() => setQ(Math.max(1, q - 1))} className="p-1 hover:text-saban-gold"><Minus size={16}/></button>
            <span className="font-bold w-8 text-center">{q}</span>
            <button onClick={() => setQ(q + 1)} className="p-1 hover:text-saban-gold"><Plus size={16}/></button>
          </div>
        </div>

        <div className="pt-4 border-t border-white/5">
          <div className="flex items-center gap-2 mb-2">
            <Calculator size={14} className="text-saban-gold" />
            <span className="text-xs font-medium">חשב לפי שטח (מ"ר)</span>
          </div>
          <div className="flex gap-2">
            <input 
              type="number" 
              placeholder='מ"ר'
              value={sqm}
              onChange={(e) => setSqm(e.target.value)}
              className="bg-white/5 border border-white/10 rounded-lg px-3 py-1 flex-1 text-sm outline-none focus:border-saban-gold"
            />
            <button 
              onClick={calculateFromSqm}
              className="px-3 py-1 bg-saban-gold text-saban-black rounded-lg text-xs font-bold"
            >
              חשב
            </button>
          </div>
        </div>

        <button 
          onClick={() => addToCart(product, q)}
          className="w-full py-2 bg-saban-gold text-saban-black rounded-lg font-bold text-sm hover:scale-105 transition-all mt-2"
        >
          הוסף לסל ({q})
        </button>
      </div>
    );
  };

  return (
    <>
      {/* Backdrop Blur when Open */}
      <AnimatePresence>
        {!isMinimized && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsMinimized(true)}
            className="fixed inset-0 z-[49] bg-black/40 backdrop-blur-md"
          />
        )}
      </AnimatePresence>

      {/* Shopping Cart Indicator */}
      <AnimatePresence>
        {cart.length > 0 && isMinimized && (
          <motion.button
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            exit={{ scale: 0 }}
            onClick={() => setIsMinimized(false)}
            className="fixed bottom-32 right-6 z-50 bg-saban-gold text-saban-black w-10 h-10 rounded-full shadow-2xl flex items-center justify-center border-2 border-saban-black"
          >
            <ShoppingCart className="w-4 h-4" />
            <span className="absolute -top-2 -right-2 bg-white text-saban-black text-[9px] font-bold px-1.5 py-0.5 rounded-full border border-saban-black">
              {cart.length}
            </span>
          </motion.button>
        )}
      </AnimatePresence>

      {/* Trigger Bubble (Floating Head) */}
      <motion.button
        layoutId="noa-chat"
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
        onClick={() => setIsMinimized(!isMinimized)}
        className="fixed bottom-8 right-6 z-50 w-16 h-16 rounded-full shadow-[0_0_30px_rgba(214,175,55,0.4)] border-2 border-saban-gold overflow-hidden bg-black group"
      >
        {isNoaSpeaking ? (
          <video 
            src={noaVideo} 
            autoPlay 
            loop 
            muted 
            playsInline 
            className="w-full h-full object-cover scale-150"
          />
        ) : (
          <img 
            src={noaAvatar} 
            alt="Noa" 
            className="w-full h-full object-cover transition-transform group-hover:scale-110" 
          />
        )}
        <motion.div 
          className="absolute inset-0 border-2 border-saban-gold rounded-full"
          animate={{ scale: [1, 1.2, 1], opacity: [1, 0, 1] }}
          transition={{ duration: 2, repeat: Infinity }}
        />
      </motion.button>

      {/* Chat Window */}
      <AnimatePresence>
        {!isMinimized && (
          <motion.div
            layoutId="noa-chat"
            initial={{ opacity: 0, scale: 0.5, x: 100, y: 100 }}
            animate={{ opacity: 1, scale: 1, x: 0, y: 0 }}
            exit={{ opacity: 0, scale: 0.5, x: 100, y: 100 }}
            className="fixed bottom-8 right-6 z-[60] w-[92vw] md:w-[400px] h-[600px] bg-black/80 backdrop-blur-2xl border border-white/10 rounded-[2.5rem] shadow-[0_40px_100px_rgba(0,0,0,1)] flex flex-col overflow-hidden rtl"
          >
            {/* Header */}
            <div className="p-6 border-b border-white/10 bg-gradient-to-b from-saban-gold/10 to-transparent flex justify-between items-center">
              <div className="flex items-center gap-4">
                <div className="relative">
                  <div className="w-12 h-12 rounded-2xl border border-saban-gold/30 overflow-hidden shadow-inner bg-black">
                    {isNoaSpeaking ? (
                      <video 
                        src={noaVideo} 
                        autoPlay 
                        loop 
                        muted 
                        playsInline 
                        className="w-full h-full object-cover scale-150"
                      />
                    ) : (
                      <img src={noaAvatar} alt="Noa" className="w-full h-full object-cover" />
                    )}
                  </div>
                  <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-emerald-500 rounded-full border-4 border-black" />
                </div>
                <div>
                  <h3 className="font-serif text-xl leading-none text-white tracking-tight">יועצת ח.סבן</h3>
                  <div className="flex items-center gap-2 mt-1.5">
                    <span className="text-[10px] uppercase font-bold text-saban-gold tracking-[.2em]">זמינה כעת</span>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button 
                  onClick={() => setIsMinimized(true)}
                  className="p-2.5 text-white/40 hover:text-white hover:bg-white/5 rounded-full transition-all"
                >
                  <ChevronDown className="w-6 h-6" />
                </button>
              </div>
            </div>

            {/* Messages */}
            <div 
              ref={scrollRef}
              className="flex-1 overflow-y-auto p-5 space-y-6 scrollbar-hide"
            >
              {messages.map((msg) => (
                <div 
                  key={msg.id}
                  className={`flex ${msg.role === 'user' ? 'justify-start' : 'justify-end'} animate-in fade-in slide-in-from-bottom-4 duration-300`}
                >
                  <div className={`max-w-[88%] ${msg.role === 'user' ? 'order-1' : 'order-2'}`}>
                    <div className={`p-4 rounded-2xl shadow-lg ${
                      msg.role === 'user' 
                        ? 'bg-white/10 text-white rounded-tr-none border border-white/5' 
                        : msg.type === 'success' 
                          ? 'bg-emerald-600/20 text-emerald-400 rounded-tl-none border border-emerald-500/30'
                          : 'bg-saban-gold text-saban-black rounded-tl-none font-medium text-right'
                    }`}>
                      {msg.type === 'success' && (
                        <div className="flex flex-col items-center gap-3 mb-4 pt-2">
                          <motion.div 
                            initial={{ scale: 0, rotate: -45 }}
                            animate={{ scale: 1, rotate: 0 }}
                            transition={{ type: "spring", stiffness: 200, damping: 10 }}
                            className="w-16 h-16 rounded-full bg-saban-gold flex items-center justify-center shadow-[0_0_30px_rgba(197,160,89,0.4)]"
                          >
                            <CheckCircle2 size={32} className="text-saban-black" />
                          </motion.div>
                          <div className="text-emerald-400 font-bold text-center">ההזמנה הוזרקה בהצלחה!</div>
                        </div>
                      )}
                      
                      {msg.content.includes('פריקה ידנית') && msg.content.includes('סיכום') && (
                        <div className="mt-2 p-2 bg-amber-500/10 border border-amber-500/30 rounded text-[10px] text-amber-500 font-bold">
                          *חשוב להבהיר: פריקה ידנית תבוצע באחריות ובאמצעות הלקוח.*
                        </div>
                      )}

                      <div className="prose prose-invert prose-sm">
                        <ReactMarkdown>{msg.content}</ReactMarkdown>
                      </div>

                      {msg.type === 'success' && (
              <motion.div 
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="mt-4 p-8 bg-gradient-to-br from-saban-gold/20 to-black/40 border border-saban-gold rounded-3xl text-center shadow-[0_0_50px_rgba(197,160,89,0.3)] relative overflow-hidden group"
              >
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-from)_0%,_transparent_70%)] opacity-20 animate-pulse" />
                <CheckCircle2 size={64} className="text-saban-gold mx-auto mb-6 drop-shadow-[0_0_15px_rgba(197,160,89,0.5)]" />
                <h3 className="text-3xl font-serif text-white mb-2">הזמנה נקלטה!</h3>
                <p className="text-saban-gold text-lg font-medium leading-relaxed">
                  {msg.content}
                </p>
                <div className="mt-8 pt-6 border-t border-saban-gold/20 text-right">
                  <div className="text-white/40 text-xs uppercase tracking-widest mb-4">סיכום הזמנה:</div>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-white/60">לקוח:</span>
                      <span className="text-white font-medium">{msg.data?.customerName}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-white/60">סכום סופי:</span>
                      <span className="text-saban-gold font-bold">₪{msg.data?.totalPrice}</span>
                    </div>
                  </div>
                </div>
                <div className="mt-8 flex justify-center">
                  <button 
                    onClick={() => setIsMinimized(true)}
                    className="px-8 py-3 bg-saban-gold text-black rounded-full font-bold shadow-lg hover:scale-105 transition-all"
                  >
                    סגור וחזרה לקטלוג
                  </button>
                </div>
              </motion.div>
            )}

            {msg.type === 'quantity_picker' && (
                        <QuantityPicker product={msg.data} />
                      )}
                    </div>
                    
                    {/* Delivery Method Options */}
                    {currentStep === 'checkout_delivery' && msg.id === messages[messages.length-1].id && msg.role === 'assistant' && (
                      <div className="grid grid-cols-2 gap-2 mt-3">
                        <button 
                          onClick={() => {
                            setOrderData((prev: any) => ({ ...prev, deliveryMethod: 'הנפה (מנוף)' }));
                            addMessage('assistant', 'הבנתי, מנוף. איזה גובה הנפה נדרש לפרויקט?');
                            setTimeout(() => {
                              addMessage('assistant', '(לחץ על אחת האפשרויות: "עד 10 מטר" / "מעל 10 מטר")');
                            }, 100);
                            setCurrentStep('checkout_crane_height');
                          }}
                          className="flex flex-col items-center gap-2 p-3 bg-white/5 border border-white/10 rounded-xl hover:border-saban-gold transition-all group"
                        >
                          <Truck className="w-6 h-6 text-saban-gold group-hover:scale-110 transition-transform" />
                          <span className="text-[10px] font-bold">הנפה (מנוף)</span>
                        </button>
                        <button 
                          onClick={() => showSummaryAndAskPhone('פריקה ידנית')}
                          className="flex flex-col items-center gap-2 p-3 bg-white/5 border border-white/10 rounded-xl hover:border-saban-gold transition-all group"
                        >
                          <Package className="w-6 h-6 text-saban-gold group-hover:scale-110 transition-transform" />
                          <span className="text-[10px] font-bold">פריקה ידנית</span>
                        </button>
                      </div>
                    )}

                    {/* Crane Height Options */}
                    {currentStep === 'checkout_crane_height' && msg.id === messages[messages.length-1].id && msg.role === 'assistant' && (
                      <div className="grid grid-cols-2 gap-2 mt-3">
                        <button 
                          onClick={() => showSummaryAndAskPhone('הנפה (מנוף) - עד 10 מטר')}
                          className="p-3 bg-white/5 border border-white/10 rounded-xl hover:border-saban-gold text-[10px] font-bold"
                        >
                          עד 10 מטר
                        </button>
                        <button 
                          onClick={() => showSummaryAndAskPhone('הנפה (מנוף) - מעל 10 מטר')}
                          className="p-3 bg-white/5 border border-white/10 rounded-xl hover:border-saban-gold text-[10px] font-bold"
                        >
                          מעל 10 מטר
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              ))}
              {isLoading && (
                <div className="flex justify-end">
                  <div className="bg-saban-gold/20 p-3 rounded-2xl rounded-tl-none flex gap-1.5 px-4 shadow-lg shadow-saban-gold/10">
                    <span className="w-2 h-2 bg-saban-gold rounded-full animate-bounce" />
                    <span className="w-2 h-2 bg-saban-gold rounded-full animate-bounce [animation-delay:0.2s]" />
                    <span className="w-2 h-2 bg-saban-gold rounded-full animate-bounce [animation-delay:0.4s]" />
                  </div>
                </div>
              )}
            </div>

            {/* Cart Summary Header */}
            {cart.length > 0 && currentStep === 'chat' && (
              <div className="px-5 py-3 bg-white/5 border-t border-white/10 flex justify-between items-center text-xs">
                <div className="flex items-center gap-2">
                  <ShoppingCart size={14} className="text-saban-gold" />
                  <span className="text-white/60">יש לך {cart.length} מוצרים בסל</span>
                </div>
                <button 
                  onClick={startCheckout}
                  className="text-saban-gold font-bold uppercase tracking-widest hover:underline"
                >
                  לקופה
                </button>
              </div>
            )}

            {/* Input Overlay for specific steps */}
            <div className="p-5 border-t border-white/10 bg-white/5 backdrop-blur-md">
              <div className="relative">
                <input
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleSend()}
                  placeholder={
                    currentStep === 'checkout_name' ? 'הזן שם מלא...' :
                    currentStep === 'checkout_address' ? 'הזן כתובת אספקה...' :
                    currentStep === 'checkout_phone' ? 'הזן מספר טלפון...' :
                    'שאל משהו או בקש להזמין מוצר...'
                  }
                  className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 px-5 pl-14 focus:outline-none focus:border-saban-gold/50 transition-all shadow-inner focus:ring-1 focus:ring-saban-gold/20"
                />
                <button
                  onClick={() => handleSend()}
                  className="absolute left-2.5 top-1/2 -translate-y-1/2 w-10 h-10 flex items-center justify-center bg-saban-gold text-saban-black rounded-xl hover:scale-105 active:scale-95 transition-all shadow-lg shadow-saban-gold/20"
                >
                  <Send className="w-5 h-5" />
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};
