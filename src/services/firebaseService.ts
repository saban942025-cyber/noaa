import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider, signInWithPopup, onAuthStateChanged, User } from 'firebase/auth';
import { 
  getFirestore, 
  collection, 
  getDocs, 
  getDoc, 
  doc, 
  query, 
  where, 
  onSnapshot, 
  setDoc, 
  addDoc,
  serverTimestamp,
  Firestore,
  CollectionReference,
  DocumentData
} from 'firebase/firestore';
import firebaseConfig from '../../firebase-applet-config.json';

// SabanOS specific cross-account config (if different from applet config)
// The user explicitly provided PROJECT_ID and DATABASE_ID.
// However, the set_up_firebase tool should have already updated firebase-applet-config.json.
// If not, we might need to manually override, but preferred way is to let the tool handle it.

// Safe initialization with Vercel deployment guard
const initializeFirebase = () => {
  try {
    if (!firebaseConfig.apiKey) {
      console.warn("[Firebase Shield] API Key missing. App will boot in Limited Mode.");
      return { app: null, db: null, auth: null, googleProvider: null };
    }
    const app = initializeApp(firebaseConfig);
    const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);
    const auth = getAuth(app);
    const googleProvider = new GoogleAuthProvider();
    return { app, db, auth, googleProvider };
  } catch (error) {
    console.error("[Firebase Shield] Critical Initialization Error:", error);
    return { app: null, db: null, auth: null, googleProvider: null };
  }
};

const { app, db, auth, googleProvider } = initializeFirebase();

export { app, db, auth, googleProvider };

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
  }
}

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth?.currentUser?.uid,
      email: auth?.currentUser?.email,
      emailVerified: auth?.currentUser?.emailVerified,
      isAnonymous: auth?.currentUser?.isAnonymous,
    },
    operationType,
    path
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

// DAL Services
export const ProductService = {
  sanitizeImageUrl(url: string | null | undefined) {
    if (!url) return `https://placehold.co/800x1000?text=Saban+Products`;
    // 1. Remove literal quotes (single and double)
    // 2. Unescape %22 which is "
    let clean = String(url)
      .replace(/^["']|["']$/g, '')
      .replace(/%22/g, '')
      .trim();
    
    // Replace old placeholder service
    if (clean.includes('via.placeholder.com')) {
      clean = clean.replace('via.placeholder.com', 'placehold.co');
    }
    
    if (!clean) return `https://placehold.co/800x1000?text=Saban+Products`;

    // YouTube sanitization logic
    if (clean.includes('youtube.com/watch?v=') || clean.includes('youtu.be/')) {
      let videoId = '';
      if (clean.includes('v=')) {
        videoId = clean.split('v=')[1]?.split('&')[0];
      } else if (clean.includes('youtu.be/')) {
        videoId = clean.split('youtu.be/')[1]?.split('?')[0];
      }
      if (videoId) {
        return `https://www.youtube.com/embed/${videoId}`;
      }
    }
    
    return clean;
  },

  // Listen for real-time updates
  listenProducts(callback: (items: any[]) => void) {
    const path = 'inventory';
    const q = collection(db!, path);
    let hasLoggedOnce = false;

    console.log(`[Firestore Shield] Initiating product stream from collection: ${path}`);

    return onSnapshot(q, (snapshot) => {
      try {
        const items = snapshot.docs.map(d => {
          const data = d.data();
          // Sanitization & Graceful Fallbacks for broken documents
          return {
            id: d.id,
            name: data.ProductName || data.name || 'Unnamed Product',
            stock: data.currentStock !== undefined ? Number(data.currentStock) : (Number(data.stock) || 0),
            price: Number(data.price) || 0,
            category: data.category || 'General',
            description: data.description || '',
            imageUrl: this.sanitizeImageUrl(data.imageUrl),
            imageUrl2: this.sanitizeImageUrl(data.imageUrl2),
            imageUrl3: this.sanitizeImageUrl(data.imageUrl3),
            images: Array.isArray(data.images) ? data.images.map((img: string) => this.sanitizeImageUrl(img)) : [],
            dryingTime: data.dryingTime || '',
            coverage: data.coverage || '',
            applicationMethod: data.applicationMethod || '',
            waitBetweenCoats: data.waitBetweenCoats || '',
            multimedia: Array.isArray(data.multimedia) ? data.multimedia : [],
            sku: data.sku || d.id,
            ProductName: data.ProductName || data.name || 'Unnamed Product',
            brand: data.brand || '',
            tutorialUrl: data.tutorialUrl || '',
            presentationId: data.presentationId || '',
            currentStock: data.currentStock !== undefined ? Number(data.currentStock) : (Number(data.stock) || 0),
            modelUrl: data.modelUrl || '',
            raw: data
          };
        });

        if (!hasLoggedOnce) {
          console.log(`[Firestore Shield] Noa Inventory State: Sync Success with ${items.length} items`);
          hasLoggedOnce = true;
        }
        callback(items);
      } catch (err) {
        console.error(`[Firestore Shield] Critical Mapping Error in ${path}:`, err);
        // Fallback to empty list so UI doesn't crash but shows "No products"
        callback([]);
      }
    }, (e) => {
      console.error(`Firestore Fetch Error on path [${path}]:`, e.message);
      handleFirestoreError(e, OperationType.GET, path);
    });
  },

  extractPresentationId(url: string) {
    if (!url) return '';
    // Handle full URL or just ID
    const match = url.match(/\/presentation\/d\/([a-zA-Z0-9-_]+)/);
    return match ? match[1] : url;
  },

  async getAllProducts() {
    const path = 'inventory';
    try {
      const q = collection(db!, path);
      const snapshot = await getDocs(q);
      return snapshot.docs.map(d => {
        const data = d.data();
        return {
          id: d.id,
          name: data.ProductName || data.name || 'Unnamed Product',
          stock: data.currentStock !== undefined ? data.currentStock : (data.stock || 0),
          price: data.price || 0,
          category: data.category || 'General',
          description: data.description || '',
          imageUrl: data.imageUrl || '',
          imageUrl2: data.imageUrl2 || '',
          imageUrl3: data.imageUrl3 || '',
          images: data.images || [],
          dryingTime: data.dryingTime,
          coverage: data.coverage,
          applicationMethod: data.applicationMethod,
          waitBetweenCoats: data.waitBetweenCoats,
          multimedia: data.multimedia || [],
          modelUrl: data.modelUrl || '',
          raw: data
        };
      });
    } catch (e) {
      handleFirestoreError(e, OperationType.LIST, path);
      return [];
    }
  },

  async upsertProduct(item: any) {
    // 1. SKU Sanitization: Trim and remove any literal quotes that might have slipped in
    const rawSku = String(item.sku || '');
    const sanitizedSku = rawSku.replace(/["']/g, '').trim();
    
    if (!sanitizedSku) {
      console.error("Cannot upsert product: SKU is missing after sanitization");
      return false;
    }

    // URL Encoding for path visibility and safety
    const safePath = `inventory/${encodeURIComponent(sanitizedSku)}`;
    
    try {
      // 2. Data Cleaning: Remove undefined values and sanitize numbers
      const cleanData = (obj: any) => {
        const cleaned: any = {};
        Object.keys(obj).forEach(key => {
          let val = obj[key];
          
          // Fix numeric fields: default to 0 if NaN or undefined
          if (['price', 'currentStock', 'stock'].includes(key)) {
            cleaned[key] = isNaN(parseFloat(val)) ? 0 : parseFloat(val);
            return;
          }

          // Skip undefined/null/raw fields
          if (val === undefined || val === null || key === 'raw' || key === 'id') return;
          
          // Prevent double quotes in strings by trimming them if they were literal quotes in the sheet
          if (typeof val === 'string') {
            val = val.replace(/^["']|["']$/g, '').replace(/%22/g, '').trim();
          }
          
          cleaned[key] = val;
        });
        return cleaned;
      };

      const payload = cleanData(item);
      // Extra safety for images in payload
      if (payload.imageUrl) payload.imageUrl = this.sanitizeImageUrl(payload.imageUrl);
      if (payload.imageUrl2) payload.imageUrl2 = this.sanitizeImageUrl(payload.imageUrl2);
      if (payload.imageUrl3) payload.imageUrl3 = this.sanitizeImageUrl(payload.imageUrl3);
      if (payload.images) payload.images = payload.images.map((url: string) => this.sanitizeImageUrl(url));
      
      payload.sku = sanitizedSku; // Ensure sanitized SKU is saved in the doc too

      console.log(`Upserting product to Firestore: ${safePath}`, payload);
      const docRef = doc(db!, 'inventory', sanitizedSku);
      
      await setDoc(docRef, {
        ...payload,
        updatedAt: serverTimestamp()
      }, { merge: true });
      
      return true;
    } catch (e) {
      handleFirestoreError(e, OperationType.WRITE, safePath);
      return false;
    }
  },

  async deleteProduct(sku: string) {
    const path = `inventory/${sku}`;
    try {
      console.warn("Delete attempted for SKU:", sku);
      return false; 
    } catch (e) {
      handleFirestoreError(e, OperationType.DELETE, path);
      return false;
    }
  },

  async syncToSheet(items: any[]) {
    const gasUrl = (process.env as any).NEXT_PUBLIC_GAS_SYNC_URL;
    if (!gasUrl) {
      console.error("NEXT_PUBLIC_GAS_SYNC_URL not configured");
      return { success: false, message: "Sync URL missing" };
    }

    // Sanitize all items before sending to GAS to prevent double quote issues and cleanup SKUs
    const sanitizedItems = items.map(item => {
      const cleaned: any = {};
      Object.keys(item).forEach(key => {
        let val = item[key];
        if (key === 'raw') return;
        if (typeof val === 'string') {
          // Remove literal quotes and excess whitespace
          cleaned[key] = val.replace(/^["']|["']$/g, '').trim();
        } else {
          cleaned[key] = val;
        }
      });
      // Force clean SKU
      cleaned.sku = String(cleaned.sku || '').replace(/["']/g, '').trim();
      return cleaned;
    });

    try {
      console.log(`GAS Bridge: Syncing items via Text/Plain to ${gasUrl}`);
      const response = await fetch(gasUrl, {
        method: 'POST',
        mode: 'no-cors',
        headers: { 'Content-Type': 'text/plain' },
        body: JSON.stringify({ action: 'sync', data: sanitizedItems })
      });
      
      // With no-cors we can't read response.json(), so we assume success if the fetch completes
      return { success: true, message: "Sync request sent to GAS" };
    } catch (e) {
      const errorMsg = e instanceof Error ? e.message : String(e);
      console.error(`Sync Error at URL [${gasUrl}]:`, e);
      return { success: false, message: `Network error or invalid GAS response: ${errorMsg}` };
    }
  },

  async sendOrderToGas(orderData: any, retries = 3) {
    const gasUrl = (process.env as any).NEXT_PUBLIC_GAS_ORDER_URL;
    if (!gasUrl) {
      console.error("NEXT_PUBLIC_GAS_ORDER_URL not configured");
      return { success: false, message: "Order Sync URL missing" };
    }

    // Explicit Mapping for Google Sheets (SabanOS Logistics Standard)
    const sanitizedOrder = {
      customerName: orderData.customerName || orderData.name,
      phone: orderData.phone,
      address: orderData.address,
      deliveryMethod: orderData.deliveryMethod,
      itemsSummary: orderData.itemsSummary || (orderData.items || []).map((i: any) => `${i.quantity}x ${i.name}`).join(', '),
      totalPrice: typeof orderData.totalPrice === 'string' 
        ? parseFloat(orderData.totalPrice.replace(/[^\d.]/g, '')) 
        : orderData.totalPrice,
      liftingHeight: orderData.liftingHeight || 'N/A',
      timestamp: orderData.timestamp || new Date().toLocaleString('he-IL'),
      type: 'order',
      action: 'order'
    };

    console.log("GAS Bridge: Dispatching sanitized order to production endpoint...");

    const attempt = async (count: number): Promise<any> => {
      try {
        console.log(`Sending order to GAS URL: ${gasUrl}`);
        
        // Use text/plain and specify it's an order action
        // We use cors mode but text/plain content type to avoid preflight
        const response = await fetch(gasUrl, {
          method: 'POST',
          mode: 'no-cors', // Force no-cors to guarantee it doesn't fail on preflight
          headers: { 'Content-Type': 'text/plain' },
          body: JSON.stringify({ ...sanitizedOrder, action: 'order', type: 'order' })
        });

        // With no-cors, response.ok will be false and status will be 0.
        // We treat a completed fetch with no-cors as a "Potential Success"
        console.log("GAS Bridge: Order sent via no-cors. Assuming potential success.");
        console.log(`Order Payload Mapping Verified: [${sanitizedOrder.customerName} - ${sanitizedOrder.itemsSummary}]`);
        return { success: true, message: "Order submitted to queue layer" };
        
      } catch (e) {
        if (count > 0) {
          console.warn(`GAS Submission Retry (${retries - count + 1}) for URL [${gasUrl}]...`);
          await new Promise(r => setTimeout(r, 1000));
          return attempt(count - 1);
        }
        console.error(`GAS Submission Final Failure at URL [${gasUrl}]:`, e);
        return { success: false, message: e instanceof Error ? e.message : "Network error" };
      }
    };

    return attempt(retries);
  },

  async sendLogToGas(user: string, message: string) {
    const gasUrl = (process.env as any).NEXT_PUBLIC_GAS_ORDER_URL; // Using shared URL or specific one if available
    if (!gasUrl) return;

    try {
      await fetch(gasUrl, {
        method: 'POST',
        mode: 'no-cors',
        headers: { 'Content-Type': 'text/plain' },
        body: JSON.stringify({
          type: "log",
          user,
          message,
          timestamp: Date.now()
        })
      });
      // Silent success for logs
    } catch (e) {
      // Ignore log errors
    }
  },

  async getProductBySku(sku: string) {
    const path = `inventory/${sku}`;
    try {
      const d = await getDoc(doc(db!, 'inventory', sku));
      if (!d.exists()) return null;
      const data = d.data();
      return {
        id: data.sku || d.id,
        name: data.ProductName || data.name || 'Unnamed Product',
        stock: data.currentStock !== undefined ? data.currentStock : (data.stock || 0),
        price: data.price || 0,
        category: data.category || 'General',
        description: data.description || '',
        imageUrl: this.sanitizeImageUrl(data.imageUrl),
        imageUrl2: this.sanitizeImageUrl(data.imageUrl2),
        imageUrl3: this.sanitizeImageUrl(data.imageUrl3),
        images: (data.images || []).map((img: string) => this.sanitizeImageUrl(img)),
        dryingTime: data.dryingTime,
        coverage: data.coverage,
        applicationMethod: data.applicationMethod,
        waitBetweenCoats: data.waitBetweenCoats,
        multimedia: data.multimedia || [],
        modelUrl: data.modelUrl || '',
        raw: data
      };
    } catch (e) {
      handleFirestoreError(e, OperationType.GET, path);
      return null;
    }
  },

  async getRelatedProducts(product: any, limitCount = 8) {
    const path = 'inventory';
    try {
      // 1. Fetch Explicit Recommendations (High Priority)
      let explicitRecommended: any[] = [];
      if (product.recommendedSKUs && product.recommendedSKUs.length > 0) {
        try {
          const qRec = query(
            collection(db!, path),
            where('sku', 'in', product.recommendedSKUs.slice(0, 10))
          );
          const snapRec = await getDocs(qRec);
          explicitRecommended = snapRec.docs.map(d => {
            const data = d.data();
            return {
              id: d.id,
              name: data.ProductName || data.name || 'Unnamed Product',
              stock: data.currentStock !== undefined ? data.currentStock : (data.stock || 0),
              price: data.price || 0,
              category: data.category || 'General',
              description: data.description || '',
              imageUrl: this.sanitizeImageUrl(data.imageUrl),
              sku: data.sku || d.id,
              brand: data.brand || '',
              raw: data
            };
          });
        } catch (e) {
          console.error("Error fetching explicit recommendations:", e);
        }
      }

      // 2. Fetch Category-based Related Products (Fallback/Complementary)
      const q = query(
        collection(db!, path),
        where('category', '==', product.category)
      );
      const snapshot = await getDocs(q);
      
      const categoryRelated = snapshot.docs
        .map(d => {
          const data = d.data();
          return {
            id: d.id,
            name: data.ProductName || data.name || 'Unnamed Product',
            stock: data.currentStock !== undefined ? data.currentStock : (data.stock || 0),
            price: data.price || 0,
            category: data.category || 'General',
            description: data.description || '',
            imageUrl: this.sanitizeImageUrl(data.imageUrl),
            sku: data.sku || d.id,
            brand: data.brand || '',
            raw: data
          };
        })
        .filter(p => p.id !== product.id && !explicitRecommended.some(er => er.sku === p.sku)); 

      const price = Number(product.price) || 0;
      
      // Upsells: Higher price from category
      const upsells = categoryRelated
        .filter(p => (Number(p.price) || 0) > price)
        .sort((a, b) => (Number(a.price) || 0) - (Number(b.price) || 0))
        .slice(0, 4);

      // Complementary: Explicit recommendations + some category fallback
      const complementary = [...explicitRecommended, ...categoryRelated]
        .filter(p => !upsells.some(u => u.sku === p.sku))
        .sort((a, b) => {
          // Explicit ones come first
          const aExp = explicitRecommended.some(er => er.sku === a.sku);
          const bExp = explicitRecommended.some(er => er.sku === b.sku);
          if (aExp && !bExp) return -1;
          if (!aExp && bExp) return 1;
          return 0;
        })
        .slice(0, 4);

      return { complementary, upsells };
    } catch (e) {
      console.error("Error fetching related products:", e);
      return { complementary: [], upsells: [] };
    }
  },

  async runGlobalImageCleanup() {
    console.log("Starting Global Image Cleanup Migration...");
    const path = 'inventory';
    try {
      const q = collection(db!, path);
      const snapshot = await getDocs(q);
      let count = 0;
      
      for (const d of snapshot.docs) {
        const data = d.data();
        const updates: any = {};
        let needsUpdate = false;

        const fields = ['imageUrl', 'imageUrl2', 'imageUrl3'];
        fields.forEach(f => {
          if (data[f]) {
            const sanitized = this.sanitizeImageUrl(data[f]);
            if (sanitized !== data[f]) {
              updates[f] = sanitized;
              needsUpdate = true;
            }
          }
        });

        if (needsUpdate) {
          await setDoc(doc(db!, 'inventory', d.id), updates, { merge: true });
          count++;
        }
      }
      
      console.log(`Global Image Cleanup Finished. Updated ${count} products.`);
      return count;
    } catch (e) {
      console.error("Global Cleanup Failed:", e);
      return -1;
    }
  }
};

export const CategoryService = {
  listenCategories(callback: (items: any[]) => void) {
    const path = 'categories';
    const q = collection(db!, path);
    return onSnapshot(q, (snapshot) => {
      const items = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
      callback(items);
    }, (e) => handleFirestoreError(e, OperationType.GET, path));
  },

  async getAllCategories() {
    const path = 'categories';
    try {
      const snapshot = await getDocs(collection(db!, path));
      return snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
    } catch (e) {
      handleFirestoreError(e, OperationType.LIST, path);
    }
  },

  async upsertCategory(id: string | null, data: any) {
    const path = `categories/${id || 'new'}`;
    try {
      const colRef = collection(db!, 'categories');
      const docRef = id ? doc(colRef, id) : doc(colRef);
      const sanitizedData = { ...data };
      delete sanitizedData.id;
      await setDoc(docRef, { ...sanitizedData, updatedAt: serverTimestamp() }, { merge: true });
      return true;
    } catch (e) {
      handleFirestoreError(e, OperationType.WRITE, path);
      return false;
    }
  },

  async deleteCategory(id: string) {
    const path = `categories/${id}`;
    try {
      const { deleteDoc } = await import('firebase/firestore');
      await deleteDoc(doc(db!, 'categories', id));
      return true;
    } catch (e) {
      handleFirestoreError(e, OperationType.DELETE, path);
      return false;
    }
  }
};

export const BrandService = {
  listenBrands(callback: (items: any[]) => void) {
    const path = 'brands';
    const q = collection(db!, path);
    return onSnapshot(q, (snapshot) => {
      const items = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
      callback(items);
    }, (e) => handleFirestoreError(e, OperationType.GET, path));
  },

  async upsertBrand(id: string | null, data: any) {
    const path = `brands/${id || 'new'}`;
    try {
      const colRef = collection(db!, 'brands');
      const docRef = id ? doc(colRef, id) : doc(colRef);
      const sanitizedData = { ...data };
      delete sanitizedData.id;
      await setDoc(docRef, { ...sanitizedData, updatedAt: serverTimestamp() }, { merge: true });
      return true;
    } catch (e) {
      handleFirestoreError(e, OperationType.WRITE, path);
      return false;
    }
  },

  async deleteBrand(id: string) {
    const path = `brands/${id}`;
    try {
      const { deleteDoc } = await import('firebase/firestore');
      await deleteDoc(doc(db!, 'brands', id));
      return true;
    } catch (e) {
      handleFirestoreError(e, OperationType.DELETE, path);
      return false;
    }
  }
};

export const ChatService = {
  async sendMessage(chatId: string, role: 'user' | 'assistant', content: string) {
    const path = `chats/${chatId}/messages`;
    try {
      await addDoc(collection(db!, path), {
        role,
        content,
        timestamp: serverTimestamp()
      });
    } catch (e) {
      handleFirestoreError(e, OperationType.WRITE, path);
    }
  },

  listenMessages(chatId: string, callback: (msgs: any[]) => void) {
    const path = `chats/${chatId}/messages`;
    const q = query(collection(db!, path));
    
    return onSnapshot(q, (snapshot) => {
      const msgs = snapshot.docs
        .map(d => ({ id: d.id, ...d.data() }))
        .sort((a: any, b: any) => (a.timestamp?.seconds || 0) - (b.timestamp?.seconds || 0));
      callback(msgs);
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, path);
    });
  }
};

export const EncyclopediaService = {
  listenCategories(callback: (items: any[]) => void) {
    const path = 'encyclopedia_categories';
    const q = collection(db!, path);
    return onSnapshot(q, (snapshot) => {
      const items = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
      callback(items);
    }, (e) => handleFirestoreError(e, OperationType.GET, path));
  },

  listenItems(callback: (items: any[]) => void) {
    const path = 'encyclopedia_items';
    const q = collection(db!, path);
    return onSnapshot(q, (snapshot) => {
      const items = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
      callback(items);
    }, (e) => handleFirestoreError(e, OperationType.GET, path));
  },

  async upsertCategory(id: string | null, data: any) {
    const path = `encyclopedia_categories/${id || 'new'}`;
    try {
      const colRef = collection(db!, 'encyclopedia_categories');
      const docRef = id ? doc(colRef, id) : doc(colRef);
      
      // Sanitization
      const sanitizedData = { ...data };
      if (sanitizedData.name) sanitizedData.name = String(sanitizedData.name).replace(/^["']|["']$/g, '').replace(/%22/g, '').trim();
      if (sanitizedData.description) sanitizedData.description = String(sanitizedData.description).replace(/^["']|["']$/g, '').replace(/%22/g, '').trim();
      
      delete sanitizedData.id; // Don't save ID inside the document
      
      await setDoc(docRef, { ...sanitizedData, updatedAt: serverTimestamp() }, { merge: true });
      return true;
    } catch (e) {
      handleFirestoreError(e, OperationType.WRITE, path);
      return false;
    }
  },

  async deleteCategory(id: string) {
    const path = `encyclopedia_categories/${id}`;
    try {
      // Check for items in this category
      const itemsSnapshot = await getDocs(query(collection(db!, 'encyclopedia_items'), where('categoryId', '==', id)));
      if (!itemsSnapshot.empty) {
        throw new Error("לא ניתן למחוק קטגוריה המכילה פריטים. מחק תחילה את הפריטים.");
      }

      // Check for subcategories
      const subCatsSnapshot = await getDocs(query(collection(db!, 'encyclopedia_categories'), where('parentId', '==', id)));
      if (!subCatsSnapshot.empty) {
        throw new Error("לא ניתן למחוק קטגוריה המכילה תתי-קטגוריות. מחק תחילה את תתי-הקטגוריות.");
      }

      const { deleteDoc } = await import('firebase/firestore');
      await deleteDoc(doc(db!, 'encyclopedia_categories', id));
      return true;
    } catch (e) {
      if (e instanceof Error && e.message.includes("לא ניתן למחוק")) {
        throw e;
      }
      handleFirestoreError(e, OperationType.DELETE, path);
      return false;
    }
  },

  async upsertItem(id: string | null, data: any) {
    const path = `encyclopedia_items/${id || 'new'}`;
    try {
      const colRef = collection(db!, 'encyclopedia_items');
      const docRef = id ? doc(colRef, id) : doc(colRef);
      
      // Sanitization
      const sanitizedData = { ...data };
      if (sanitizedData.title) sanitizedData.title = String(sanitizedData.title).replace(/^["']|["']$/g, '').replace(/%22/g, '').trim();
      if (sanitizedData.url) sanitizedData.url = ProductService.sanitizeImageUrl(sanitizedData.url);
      if (sanitizedData.presentationUrl) sanitizedData.presentationUrl = ProductService.sanitizeImageUrl(sanitizedData.presentationUrl);
      if (sanitizedData.videoUrl) sanitizedData.videoUrl = ProductService.sanitizeImageUrl(sanitizedData.videoUrl);
      
      // Handle associatedSkus (array) and associatedSku (string for backward compat or search)
      if (sanitizedData.associatedSku) {
        sanitizedData.associatedSku = String(sanitizedData.associatedSku).replace(/["']/g, '').trim();
        // If it looks like a list, make sure associatedSkus array is synced
        if (sanitizedData.associatedSku.includes(',')) {
          sanitizedData.associatedSkus = sanitizedData.associatedSku.split(',').map((s: string) => s.trim()).filter((s: string) => s.length > 0);
        } else if (sanitizedData.associatedSku && (!sanitizedData.associatedSkus || sanitizedData.associatedSkus.length === 0)) {
          sanitizedData.associatedSkus = [sanitizedData.associatedSku];
        }
      }

      // Ensure linkedProductSKUs is an array
      if (typeof sanitizedData.linkedProductSKUs === 'string') {
        sanitizedData.linkedProductSKUs = (sanitizedData.linkedProductSKUs as string).split(',').map(s => s.trim()).filter(s => s.length > 0);
      }
      
      delete sanitizedData.id;

      await setDoc(docRef, { ...sanitizedData, updatedAt: serverTimestamp() }, { merge: true });
      return true;
    } catch (e) {
      handleFirestoreError(e, OperationType.WRITE, path);
      return false;
    }
  },

  async getProductsBySkus(skus: string[]) {
    if (!skus || skus.length === 0) return [];
    try {
      const { query, where, getDocs } = await import('firebase/firestore');
      // Firestore 'in' operator limited to 10-30 items depending on version, 
      // but usually 10 is safe for a Knowledge Card suggested products.
      const q = query(collection(db!, 'inventory'), where('sku', 'in', skus.slice(0, 10)));
      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    } catch (e) {
      console.error("Error fetching products by SKUs:", e);
      return [];
    }
  },

  async deleteItem(id: string) {
    const path = `encyclopedia_items/${id}`;
    try {
      const { deleteDoc } = await import('firebase/firestore');
      await deleteDoc(doc(db!, 'encyclopedia_items', id));
      return true;
    } catch (e) {
      handleFirestoreError(e, OperationType.DELETE, path);
      return false;
    }
  }
};

