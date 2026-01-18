import React, { useState, useEffect } from 'react';
import { initializeApp } from 'firebase/app';
import { 
  getAuth, 
  signInAnonymously, 
  onAuthStateChanged,
  signInWithCustomToken
} from 'firebase/auth';
import { 
  getFirestore, 
  collection, 
  addDoc, 
  onSnapshot, 
  query, 
  where, 
  updateDoc, 
  doc, 
  deleteDoc, 
  serverTimestamp,
  setDoc,
  writeBatch
} from 'firebase/firestore';
import { 
  ShoppingBasket, 
  Check, 
  Circle, 
  Trash2, 
  Plus, 
  LogOut, 
  Heart,
  RotateCcw,
  Sparkles,
  Wallet,
  ArrowRight,
  ShoppingBag,
  Calculator,
  Scale,
  X,
  ChevronDown
} from 'lucide-react';

// --- Firebase Config ---
const firebaseConfig = {
  apiKey: "AIzaSyA4n4dWiOM5wqDg9hD9-AyrbDbtan236U0",
  authDomain: "jomshopping-7c496.firebaseapp.com",
  projectId: "jomshopping-7c496",
  storageBucket: "jomshopping-7c496.firebasestorage.app",
  messagingSenderId: "447943485336",
  appId: "1:447943485336:web:8b23610983ac74126caded",
  measurementId: "G-RS3EDXT61L"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

// --- Styling Constants ---
const CATEGORIES = [
  { id: 'basah', name: '🐟 Basah', color: 'bg-blue-50 text-blue-600 border-blue-100 ring-blue-500' },
  { id: 'kering', name: '🥫 Kering', color: 'bg-orange-50 text-orange-600 border-orange-100 ring-orange-500' },
  { id: 'sayur', name: '🥬 Sayur & Buah', color: 'bg-emerald-50 text-emerald-600 border-emerald-100 ring-emerald-500' },
  { id: 'rumah', name: '🧻 Rumah', color: 'bg-purple-50 text-purple-600 border-purple-100 ring-purple-500' },
  { id: 'lain', name: '⚡ Lain', color: 'bg-gray-50 text-gray-600 border-gray-100 ring-gray-500' },
];

// --- Smart Tools Component (UPDATED with Unit Logic) ---
const SmartToolsModal = ({ isOpen, onClose }: { isOpen: boolean, onClose: () => void }) => {
  const [activeTab, setActiveTab] = useState<'calc' | 'compare'>('compare');
  
  // State for Compare
  const [priceA, setPriceA] = useState('');
  const [weightA, setWeightA] = useState('');
  const [unitA, setUnitA] = useState('g'); // Default grams

  const [priceB, setPriceB] = useState('');
  const [weightB, setWeightB] = useState('');
  const [unitB, setUnitB] = useState('g'); // Default grams

  // State for Calculator
  const [calcDisplay, setCalcDisplay] = useState('');

  if (!isOpen) return null;

  // Logic convert semua ke 'base unit' (gram / ml / pcs)
  const getMultiplier = (unit: string) => {
    if (unit === 'kg' || unit === 'L') return 1000;
    return 1; // g, ml, pcs
  };

  const calculateScore = (price: string, weight: string, unit: string) => {
    const p = parseFloat(price);
    const w = parseFloat(weight);
    if (!p || !w) return 0;
    
    const baseWeight = w * getMultiplier(unit);
    // Score = Price per 1 base unit (lower is better)
    return p / baseWeight;
  };

  const scoreA = calculateScore(priceA, weightA, unitA);
  const scoreB = calculateScore(priceB, weightB, unitB);
  
  let winner = null;
  let savings = 0;

  if (scoreA > 0 && scoreB > 0) {
    if (scoreA < scoreB) {
      winner = 'A';
      // Kira percentage jimat
      savings = ((scoreB - scoreA) / scoreB) * 100;
    } else if (scoreB < scoreA) {
      winner = 'B';
      savings = ((scoreA - scoreB) / scoreA) * 100;
    } else {
      winner = 'Draw';
    }
  }

  // Calculator Logic
  const handleCalcPress = (val: string) => {
    if (val === 'C') setCalcDisplay('');
    else if (val === '=') {
      try {
        // eslint-disable-next-line no-new-func
        const result = new Function('return ' + calcDisplay)();
        setCalcDisplay(result.toString());
      } catch {
        setCalcDisplay('Error');
      }
    } else {
      setCalcDisplay(prev => prev + val);
    }
  };

  const UnitSelector = ({ value, onChange }: { value: string, onChange: (v: string) => void }) => (
    <div className="absolute right-1 top-1 bottom-1">
      <select 
        value={value} 
        onChange={(e) => onChange(e.target.value)}
        className="h-full bg-slate-100 text-slate-600 text-xs font-bold rounded-lg px-2 border-l border-slate-200 outline-none cursor-pointer hover:bg-slate-200 transition"
      >
        <optgroup label="Berat">
          <option value="kg">kg</option>
          <option value="g">g</option>
        </optgroup>
        <optgroup label="Isipadu">
          <option value="L">Liter</option>
          <option value="ml">ml</option>
        </optgroup>
        <optgroup label="Kuantiti">
          <option value="pcs">pcs</option>
        </optgroup>
      </select>
    </div>
  );

  return (
    <div className="fixed inset-0 bg-slate-900/70 z-50 flex items-center justify-center p-4 backdrop-blur-sm animate-in zoom-in-95 duration-200">
      <div className="bg-white rounded-[2rem] w-full max-w-sm shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="bg-slate-800 p-4 flex justify-between items-center text-white">
          <h3 className="font-bold flex items-center gap-2">
            {activeTab === 'compare' ? <Scale className="w-5 h-5 text-emerald-400" /> : <Calculator className="w-5 h-5 text-blue-400" />}
            {activeTab === 'compare' ? 'Banding Harga' : 'Kalkulator'}
          </h3>
          <button onClick={onClose} className="p-1 hover:bg-white/20 rounded-full"><X className="w-5 h-5" /></button>
        </div>

        {/* Tabs */}
        <div className="flex p-2 bg-slate-100 gap-2">
          <button onClick={() => setActiveTab('compare')} className={`flex-1 py-2 rounded-xl text-sm font-bold transition ${activeTab === 'compare' ? 'bg-white shadow text-slate-800' : 'text-slate-400'}`}>Banding Murah</button>
          <button onClick={() => setActiveTab('calc')} className={`flex-1 py-2 rounded-xl text-sm font-bold transition ${activeTab === 'calc' ? 'bg-white shadow text-slate-800' : 'text-slate-400'}`}>Kalkulator</button>
        </div>

        {/* Content */}
        <div className="p-5 overflow-y-auto">
          {activeTab === 'compare' ? (
            <div className="space-y-4">
              <p className="text-xs text-center text-slate-400 mb-2">Boleh campur unit (contoh: 1kg vs 850g).</p>
              
              {/* Item A */}
              <div className={`p-4 rounded-2xl border-2 transition relative ${winner === 'A' ? 'bg-emerald-50 border-emerald-500 shadow-lg scale-[1.02]' : 'bg-white border-slate-100'}`}>
                {winner === 'A' && <div className="absolute -top-3 right-4 bg-emerald-500 text-white text-[10px] font-bold px-2 py-1 rounded-full shadow">MENANG!</div>}
                <div className="text-xs font-bold text-slate-400 uppercase mb-2">Barang A</div>
                <div className="flex gap-2">
                  <div className="w-1/2 relative">
                    <span className="absolute left-3 top-2.5 text-slate-300 text-xs font-bold">RM</span>
                    <input type="number" placeholder="Harga" value={priceA} onChange={e => setPriceA(e.target.value)} className="w-full pl-8 pr-2 py-2 bg-slate-50 rounded-xl text-sm font-bold outline-none focus:ring-2 focus:ring-emerald-500" />
                  </div>
                  <div className="w-1/2 relative">
                    <input type="number" placeholder="Berat" value={weightA} onChange={e => setWeightA(e.target.value)} className="w-full pl-3 pr-14 py-2 bg-slate-50 rounded-xl text-sm font-bold outline-none focus:ring-2 focus:ring-emerald-500" />
                    <UnitSelector value={unitA} onChange={setUnitA} />
                  </div>
                </div>
              </div>

              <div className="flex justify-center -my-2 relative z-10">
                <div className="bg-slate-200 text-slate-500 text-xs font-bold px-2 py-1 rounded-full border-2 border-white">VS</div>
              </div>

              {/* Item B */}
              <div className={`p-4 rounded-2xl border-2 transition relative ${winner === 'B' ? 'bg-emerald-50 border-emerald-500 shadow-lg scale-[1.02]' : 'bg-white border-slate-100'}`}>
                {winner === 'B' && <div className="absolute -top-3 right-4 bg-emerald-500 text-white text-[10px] font-bold px-2 py-1 rounded-full shadow">MENANG!</div>}
                <div className="text-xs font-bold text-slate-400 uppercase mb-2">Barang B</div>
                <div className="flex gap-2">
                  <div className="w-1/2 relative">
                    <span className="absolute left-3 top-2.5 text-slate-300 text-xs font-bold">RM</span>
                    <input type="number" placeholder="Harga" value={priceB} onChange={e => setPriceB(e.target.value)} className="w-full pl-8 pr-2 py-2 bg-slate-50 rounded-xl text-sm font-bold outline-none focus:ring-2 focus:ring-emerald-500" />
                  </div>
                  <div className="w-1/2 relative">
                    <input type="number" placeholder="Berat" value={weightB} onChange={e => setWeightB(e.target.value)} className="w-full pl-3 pr-14 py-2 bg-slate-50 rounded-xl text-sm font-bold outline-none focus:ring-2 focus:ring-emerald-500" />
                    <UnitSelector value={unitB} onChange={setUnitB} />
                  </div>
                </div>
              </div>

              {winner && (
                 <div className="text-center mt-4 animate-in slide-in-from-bottom-2 bg-slate-50 p-3 rounded-xl border border-slate-100">
                    <p className="text-slate-600 text-sm font-medium">
                      {winner === 'Draw' ? 'Harga per unit sama sahaja.' : 
                        <>
                           Pilih <span className="font-black text-emerald-600">Barang {winner}</span>.<br/>
                           <span className="text-xs text-slate-400">Lebih jimat {savings.toFixed(1)}% berbanding Barang {winner === 'A' ? 'B' : 'A'}.</span>
                        </>
                      }
                    </p>
                 </div>
              )}
            </div>
          ) : (
            <div className="space-y-4">
              <div className="w-full bg-slate-100 p-4 rounded-xl text-right text-2xl font-mono font-bold text-slate-700 h-16 flex items-center justify-end overflow-x-auto">
                {calcDisplay || '0'}
              </div>
              <div className="grid grid-cols-4 gap-2">
                {['7','8','9','/','4','5','6','*','1','2','3','-','C','0','.','+'].map(btn => (
                  <button 
                    key={btn}
                    onClick={() => handleCalcPress(btn)}
                    className={`p-4 rounded-xl font-bold text-lg shadow-sm active:scale-95 transition ${
                      ['/','*','-','+'].includes(btn) ? 'bg-blue-100 text-blue-600' : 
                      btn === 'C' ? 'bg-rose-100 text-rose-600' : 'bg-slate-50 text-slate-700'
                    }`}
                  >
                    {btn}
                  </button>
                ))}
                <button onClick={() => handleCalcPress('=')} className="col-span-4 bg-emerald-500 text-white p-3 rounded-xl font-bold shadow-lg shadow-emerald-200 mt-2 active:scale-95">=</button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// --- Components ---

const JoinScreen = ({ onJoin }: { onJoin: (code: string) => void }) => {
  const [code, setCode] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (code.trim()) onJoin(code.trim().toUpperCase());
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-emerald-500 to-teal-700 p-6 font-sans relative overflow-hidden">
      <div className="absolute top-0 left-0 w-64 h-64 bg-white/10 rounded-full -translate-x-1/2 -translate-y-1/2 blur-3xl"></div>
      <div className="absolute bottom-0 right-0 w-80 h-80 bg-teal-300/20 rounded-full translate-x-1/3 translate-y-1/3 blur-3xl"></div>

      <div className="bg-white/95 backdrop-blur-xl p-8 rounded-[2.5rem] shadow-2xl w-full max-w-md text-center relative z-10 border border-white/50">
        <div className="bg-gradient-to-tr from-emerald-400 to-teal-500 w-24 h-24 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg shadow-emerald-500/30 transform -translate-y-12 border-4 border-white">
          <ShoppingBasket className="w-12 h-12 text-white" />
        </div>
        
        <div className="-mt-8 mb-8">
          <h1 className="text-4xl font-black text-gray-800 tracking-tight mb-1">Jom<span className="text-emerald-500">Shop</span></h1>
          <p className="text-gray-400 font-medium text-sm">Sync Barang Dapur Suami Isteri</p>
        </div>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="relative group">
            <input
              type="text"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              placeholder="NAMA BILIK (CTH: SYURGAKU)"
              className="w-full px-4 py-5 rounded-2xl bg-gray-50 border-2 border-gray-100 focus:border-emerald-500 focus:bg-white outline-none transition uppercase text-center text-lg font-bold tracking-widest text-emerald-900 placeholder-gray-300 shadow-inner group-hover:bg-white"
              required
            />
          </div>
          <button
            type="submit"
            className="w-full bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white font-bold py-5 px-6 rounded-2xl transition transform active:scale-95 shadow-xl shadow-emerald-500/20 flex items-center justify-center gap-2"
          >
            Mula Shopping <ArrowRight className="w-5 h-5" />
          </button>
        </form>
      </div>
      <p className="absolute bottom-6 text-emerald-100/60 text-xs font-medium">Ultimate Edition V2</p>
    </div>
  );
};

const MasterListModal = ({ isOpen, onClose, listCode, user }: any) => {
  const [favorites, setFavorites] = useState<any[]>([]);
  const [newItem, setNewItem] = useState('');
  const [selectedCat, setSelectedCat] = useState('kering');

  useEffect(() => {
    if (!isOpen) return;
    const q = query(
      collection(db, 'artifacts', appId, 'public', 'data', 'grocery_favorites'),
      where('listCode', '==', listCode)
    );
    const unsub = onSnapshot(q, (snap) => setFavorites(snap.docs.map(d => ({ id: d.id, ...d.data() }))));
    return () => unsub();
  }, [isOpen, listCode]);

  const addToFavorites = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newItem.trim()) return;
    await addDoc(collection(db, 'artifacts', appId, 'public', 'data', 'grocery_favorites'), {
      listCode, name: newItem, category: selectedCat
    });
    setNewItem('');
  };

  const deleteFav = async (id: string) => {
    if(confirm('Padam dari Master List?')) await deleteDoc(doc(db, 'artifacts', appId, 'public', 'data', 'grocery_favorites', id));
  };

  const importToMainList = async (item: any) => {
    await addDoc(collection(db, 'artifacts', appId, 'public', 'data', 'grocery_items_v3'), {
      listCode, name: item.name, quantity: '1', category: item.category, isBought: false, price: 0, createdAt: serverTimestamp(), createdBy: user.uid
    });
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-slate-900/60 z-50 flex items-end sm:items-center justify-center backdrop-blur-sm animate-in fade-in">
      <div className="bg-white w-full max-w-md h-[85vh] sm:h-[600px] rounded-t-[2.5rem] sm:rounded-3xl flex flex-col shadow-2xl animate-in slide-in-from-bottom-20 duration-300">
        <div className="p-6 bg-gradient-to-r from-rose-50 to-pink-50 rounded-t-[2.5rem] flex justify-between items-center border-b border-rose-100">
          <div>
            <h2 className="font-black text-xl text-rose-600 flex items-center gap-2"><Heart className="w-6 h-6 fill-rose-500" /> Master List</h2>
            <p className="text-rose-400 text-xs font-bold uppercase tracking-wider mt-1">Simpanan Barang Wajib</p>
          </div>
          <button onClick={onClose} className="bg-white p-2 rounded-full shadow-sm text-gray-400 hover:text-gray-800 transition"><Check className="w-5 h-5" /></button>
        </div>
        <div className="p-5 bg-white shadow-sm z-10">
           <form onSubmit={addToFavorites} className="flex gap-3 mb-3">
             <input value={newItem} onChange={e => setNewItem(e.target.value)} placeholder="Item baru..." className="flex-1 px-4 py-3 bg-gray-50 border border-gray-100 rounded-xl focus:ring-2 focus:ring-rose-200 focus:bg-white outline-none transition" />
             <button type="submit" className="bg-rose-500 hover:bg-rose-600 text-white px-5 rounded-xl font-bold shadow-lg shadow-rose-200 transition active:scale-95"><Plus className="w-6 h-6" /></button>
           </form>
           <div className="flex gap-2 overflow-x-auto pb-2 no-scrollbar">
             {CATEGORIES.map(c => (
               <button key={c.id} onClick={() => setSelectedCat(c.id)} className={`text-[11px] font-bold px-3 py-1.5 rounded-full border transition-all ${selectedCat === c.id ? 'bg-rose-500 text-white border-rose-500 shadow-md transform scale-105' : 'bg-white text-gray-400 border-gray-200'}`}>{c.name}</button>
             ))}
           </div>
        </div>
        <div className="flex-1 overflow-y-auto p-5 space-y-3 bg-gray-50/50">
          {favorites.map(fav => (
            <div key={fav.id} className="flex items-center justify-between p-4 bg-white border border-gray-100 rounded-2xl shadow-sm hover:shadow-md transition">
              <div>
                <p className="font-bold text-gray-700 text-lg">{fav.name}</p>
                <p className="text-[10px] text-gray-400 uppercase font-bold tracking-wider">{CATEGORIES.find(c => c.id === fav.category)?.name}</p>
              </div>
              <div className="flex gap-2">
                <button onClick={() => deleteFav(fav.id)} className="p-2 text-gray-300 hover:text-red-400 transition"><Trash2 className="w-5 h-5" /></button>
                <button onClick={() => importToMainList(fav)} className="bg-emerald-100 text-emerald-700 px-4 py-2 rounded-xl text-xs font-bold hover:bg-emerald-200 transition">+ Add</button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

const ShoppingList = ({ listCode, onLeave }: { listCode: string, onLeave: () => void }) => {
  const [items, setItems] = useState<any[]>([]);
  const [newItemName, setNewItemName] = useState('');
  const [newItemQty, setNewItemQty] = useState('1');
  const [selectedCategory, setSelectedCategory] = useState('kering');
  const [budget, setBudget] = useState(0);
  const [isEditingBudget, setIsEditingBudget] = useState(false);
  const [tempBudget, setTempBudget] = useState('');
  const [priceModalItem, setPriceModalItem] = useState<any | null>(null);
  const [priceInput, setPriceInput] = useState('');
  const [user, setUser] = useState<any>(null);
  const [showMasterList, setShowMasterList] = useState(false);
  const [showTools, setShowTools] = useState(false); // New state for Calculator

  useEffect(() => {
    const initAuth = async () => {
      if (typeof __initial_auth_token !== 'undefined' && __initial_auth_token) {
        await signInWithCustomToken(auth, __initial_auth_token);
      } else {
        await signInAnonymously(auth);
      }
    };
    initAuth();
    const unsubscribe = onAuthStateChanged(auth, setUser);
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (!user || !listCode) return;
    const itemsQuery = query(
      collection(db, 'artifacts', appId, 'public', 'data', 'grocery_items_v3'),
      where('listCode', '==', listCode)
    );
    const unsubItems = onSnapshot(itemsQuery, (snapshot) => {
      setItems(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });
    const budgetRef = doc(db, 'artifacts', appId, 'public', 'data', 'grocery_budgets', listCode);
    const unsubBudget = onSnapshot(budgetRef, (docSnap) => {
      if (docSnap.exists()) setBudget(docSnap.data().amount || 0);
    });
    return () => { unsubItems(); unsubBudget(); };
  }, [user, listCode]);

  const handleAddItem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newItemName.trim() || !user) return;
    await addDoc(collection(db, 'artifacts', appId, 'public', 'data', 'grocery_items_v3'), {
      listCode, name: newItemName.trim(), quantity: newItemQty, category: selectedCategory, isBought: false, price: 0, createdAt: serverTimestamp(), createdBy: user.uid
    });
    setNewItemName(''); setNewItemQty('1');
  };

  const handleUpdateBudget = async () => {
    const amount = parseFloat(tempBudget);
    if (!isNaN(amount)) {
      await setDoc(doc(db, 'artifacts', appId, 'public', 'data', 'grocery_budgets', listCode), { amount });
      setIsEditingBudget(false);
    }
  };

  const confirmPurchase = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!priceModalItem) return;
    const price = parseFloat(priceInput);
    await updateDoc(doc(db, 'artifacts', appId, 'public', 'data', 'grocery_items_v3', priceModalItem.id), {
      isBought: true, price: isNaN(price) ? 0 : price
    });
    setPriceModalItem(null); setPriceInput('');
  };

  const handleUntick = async (item: any) => {
    await updateDoc(doc(db, 'artifacts', appId, 'public', 'data', 'grocery_items_v3', item.id), { isBought: false, price: 0 });
  };

  const handleDelete = async (id: string) => {
    if(confirm("Padam?")) await deleteDoc(doc(db, 'artifacts', appId, 'public', 'data', 'grocery_items_v3', id));
  };

  const clearBoughtItems = async () => {
    if(!confirm("Clear semua barang dah beli?")) return;
    const batch = writeBatch(db);
    items.filter(i => i.isBought).forEach(item => batch.delete(doc(db, 'artifacts', appId, 'public', 'data', 'grocery_items_v3', item.id)));
    await batch.commit();
  };

  const quickSaveToMaster = async (item: any) => {
    await addDoc(collection(db, 'artifacts', appId, 'public', 'data', 'grocery_favorites'), { listCode, name: item.name, category: item.category });
    alert("Disimpan ke Master List!");
  };

  const groupedItems = CATEGORIES.map(cat => ({ ...cat, items: items.filter(i => !i.isBought && i.category === cat.id) })).filter(g => g.items.length > 0);
  const boughtItems = items.filter(i => i.isBought);
  const totalSpent = items.reduce((acc, item) => acc + (item.isBought ? (item.price || 0) : 0), 0);
  const remaining = budget - totalSpent;
  const isOverBudget = remaining < 0;

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col max-w-md mx-auto shadow-2xl overflow-hidden font-sans relative">
      
      {/* Header */}
      <div className="bg-gradient-to-br from-emerald-600 to-teal-700 text-white pt-8 pb-10 px-6 rounded-b-[2.5rem] shadow-2xl z-20 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-40 h-40 bg-white/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2"></div>
        <div className="flex justify-between items-center mb-6 relative z-10">
          <div className="flex items-center gap-3">
            <div className="bg-white/20 p-2 rounded-xl backdrop-blur-md"><ShoppingBasket className="w-5 h-5 text-white" /></div>
            <div><h2 className="font-bold text-lg leading-none">{listCode}</h2></div>
          </div>
          <div className="flex gap-2">
            <button onClick={() => setShowTools(true)} className="bg-blue-500/30 p-2 rounded-xl hover:bg-blue-500/50 backdrop-blur-md transition active:scale-95 text-blue-100" title="Tools Pintar"><Calculator className="w-5 h-5" /></button>
            <button onClick={clearBoughtItems} className="bg-white/10 p-2 rounded-xl hover:bg-white/20 backdrop-blur-md transition active:scale-95 text-emerald-50"><RotateCcw className="w-5 h-5" /></button>
            <button onClick={onLeave} className="bg-rose-500/20 p-2 rounded-xl hover:bg-rose-500/30 backdrop-blur-md transition active:scale-95 text-rose-100"><LogOut className="w-5 h-5" /></button>
          </div>
        </div>

        <div onClick={() => { setTempBudget(budget.toString()); setIsEditingBudget(true); }} className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-2xl p-5 relative overflow-hidden group cursor-pointer hover:bg-white/15 transition-all duration-300">
          <div className="flex justify-between items-start mb-8 relative z-10">
            <div><p className="text-emerald-100 text-xs font-bold uppercase tracking-widest mb-1">Baki Bajet</p><p className={`text-3xl font-black tracking-tight ${isOverBudget ? 'text-rose-300' : 'text-white'}`}>RM {remaining.toFixed(2)}</p></div>
            <div className="text-right"><div className="bg-white/20 p-1.5 rounded-lg inline-block mb-1"><Wallet className="w-4 h-4 text-emerald-100" /></div><p className="text-xs text-emerald-100 font-medium">dari RM {budget.toFixed(2)}</p></div>
          </div>
          <div className="relative z-10">
            <div className="flex justify-between text-[10px] font-bold text-emerald-100 mb-1 opacity-80"><span>Belanja: RM {totalSpent.toFixed(2)}</span><span>{Math.min((totalSpent / (budget || 1)) * 100, 100).toFixed(0)}%</span></div>
            <div className="w-full bg-black/20 rounded-full h-2.5 overflow-hidden backdrop-blur-sm"><div className={`h-full rounded-full transition-all duration-700 ease-out shadow-lg ${isOverBudget ? 'bg-rose-400' : 'bg-gradient-to-r from-emerald-300 to-lime-300'}`} style={{ width: `${Math.min((totalSpent / (budget || 1)) * 100, 100)}%` }} /></div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-5 space-y-6 pb-28 -mt-4 pt-8 bg-gray-50/50">
        <div className="bg-white p-4 rounded-[1.5rem] shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-gray-100">
          <form onSubmit={handleAddItem} className="flex flex-col gap-3">
            <div className="flex gap-2">
              <input type="text" value={newItemName} onChange={(e) => setNewItemName(e.target.value)} placeholder="Nak beli apa?" className="flex-1 pl-4 pr-4 py-3 bg-gray-50 rounded-xl border border-gray-100 focus:ring-2 focus:ring-emerald-500 outline-none transition font-medium text-gray-700" />
              <div className="w-20 relative"><input type="number" value={newItemQty} onChange={(e) => setNewItemQty(e.target.value)} className="w-full px-2 py-3 bg-gray-50 rounded-xl border border-gray-100 focus:ring-2 focus:ring-emerald-500 text-center font-bold text-gray-700 outline-none" /><span className="absolute right-2 top-0.5 text-[9px] text-gray-400 font-bold uppercase">Qty</span></div>
            </div>
            <div className="flex gap-2 overflow-x-auto pb-1 no-scrollbar items-center">
              {CATEGORIES.map(cat => (
                <button key={cat.id} type="button" onClick={() => setSelectedCategory(cat.id)} className={`px-3 py-1.5 rounded-lg text-[10px] font-bold whitespace-nowrap transition-all border ${selectedCategory === cat.id ? 'bg-emerald-600 text-white border-emerald-600 shadow-md transform scale-105' : 'bg-white text-gray-400 border-gray-200 hover:border-emerald-300'}`}>{cat.name}</button>
              ))}
              <button type="submit" className="bg-emerald-600 text-white p-2 rounded-xl shadow-lg shadow-emerald-200 active:scale-90 transition ml-auto"><Plus className="w-5 h-5" /></button>
            </div>
          </form>
        </div>

        <button onClick={() => setShowMasterList(true)} className="w-full bg-gradient-to-r from-rose-50 to-pink-50 border border-rose-100 text-rose-600 font-bold py-3.5 rounded-2xl flex items-center justify-center gap-2 hover:shadow-md transition active:scale-95"><Sparkles className="w-5 h-5 fill-rose-400 text-rose-500" /><span className="bg-clip-text text-transparent bg-gradient-to-r from-rose-600 to-pink-600">Buka Master List</span></button>

        {items.length === 0 && <div className="text-center py-10 opacity-30 flex flex-col items-center"><ShoppingBag className="w-16 h-16 mb-2 text-gray-400" /><p className="font-bold text-gray-400">List masih kosong</p></div>}

        {groupedItems.map(group => (
          <div key={group.id} className="animate-in slide-in-from-bottom-5 duration-500">
             <div className="flex items-center gap-2 mb-3 px-1"><span className={`w-2 h-6 rounded-full ${group.color.split(' ')[0]}`}></span><span className="text-xs font-black uppercase tracking-widest text-gray-400">{group.name}</span></div>
             <div className="space-y-3">
              {group.items.map(item => (
                <div key={item.id} className="group flex items-center p-3.5 bg-white border border-gray-100 rounded-2xl shadow-sm hover:shadow-md transition-all active:scale-[0.98]">
                  <button onClick={() => { setPriceModalItem(item); setPriceInput(''); }} className="text-gray-200 hover:text-emerald-500 transition mr-4"><Circle className="w-7 h-7 stroke-2" /></button>
                  <div className="flex-1"><p className="font-bold text-gray-700 text-lg leading-tight">{item.name}</p><div className="flex items-center gap-2 mt-0.5"><span className="text-xs font-bold text-gray-400 bg-gray-100 px-2 py-0.5 rounded text-center min-w-[30px]">x{item.quantity}</span></div></div>
                  <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity"><button onClick={() => quickSaveToMaster(item)} className="p-2 text-gray-300 hover:text-rose-400 bg-gray-50 rounded-lg"><Heart className="w-4 h-4" /></button><button onClick={() => handleDelete(item.id)} className="p-2 text-gray-300 hover:text-red-400 bg-gray-50 rounded-lg"><Trash2 className="w-4 h-4" /></button></div>
                </div>
              ))}
             </div>
          </div>
        ))}

        {boughtItems.length > 0 && (
          <div className="mt-8">
            <div className="flex items-center gap-2 mb-4 opacity-50 px-2"><Check className="w-4 h-4" /><span className="text-xs font-bold uppercase tracking-widest">Selesai ({boughtItems.length})</span><div className="h-[1px] bg-gray-300 flex-1"></div></div>
            <div className="space-y-2">{boughtItems.map(item => (<div key={item.id} className="flex items-center justify-between p-3 bg-gray-100/50 border border-gray-200/50 rounded-xl opacity-60 hover:opacity-100 transition"><div className="flex items-center gap-3"><button onClick={() => handleUntick(item)} className="text-emerald-500 bg-emerald-100 p-0.5 rounded-full"><Check className="w-4 h-4" /></button><span className="line-through text-gray-500 font-medium decoration-2 decoration-gray-300">{item.name}</span></div><span className="font-bold text-emerald-700 text-sm bg-emerald-100 px-2 py-1 rounded-lg">RM {item.price.toFixed(2)}</span></div>))}</div>
          </div>
        )}
      </div>

      {priceModalItem && (<div className="fixed inset-0 bg-slate-900/60 z-50 flex items-center justify-center p-6 backdrop-blur-sm animate-in fade-in duration-200"><div className="bg-white rounded-[2rem] w-full max-w-sm p-6 shadow-2xl scale-100"><h3 className="text-lg font-bold mb-1 text-gray-800 text-center">Harga Sebenar</h3><p className="text-gray-400 text-center text-sm mb-6">Berapa harga <span className="text-emerald-600 font-bold">{priceModalItem.name}</span>?</p><form onSubmit={confirmPurchase}><div className="relative mb-6 group"><span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-300 font-black text-2xl group-focus-within:text-emerald-500 transition">RM</span><input type="number" step="0.01" value={priceInput} onChange={(e) => setPriceInput(e.target.value)} placeholder="0.00" autoFocus className="w-full pl-14 pr-4 py-5 text-4xl font-black text-center text-gray-800 rounded-2xl bg-gray-50 border-2 border-gray-100 focus:border-emerald-500 focus:bg-white outline-none transition" /></div><button type="submit" className="w-full py-4 rounded-xl font-bold text-lg text-white bg-emerald-600 hover:bg-emerald-700 shadow-xl shadow-emerald-200 transition transform active:scale-95">Simpan</button></form></div></div>)}
      {isEditingBudget && (<div className="fixed inset-0 bg-slate-900/60 z-50 flex items-center justify-center p-6 backdrop-blur-sm"><div className="bg-white rounded-[2rem] w-full max-w-sm p-6 shadow-2xl"><h3 className="text-lg font-bold mb-6 text-center text-gray-800">Tetapkan Bajet</h3><div className="relative mb-6"><span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-300 font-black text-2xl">RM</span><input type="number" value={tempBudget} onChange={(e) => setTempBudget(e.target.value)} autoFocus className="w-full pl-14 pr-4 py-5 text-4xl font-black text-center text-gray-800 rounded-2xl bg-gray-50 border-2 border-gray-100 focus:border-emerald-500 outline-none transition" /></div><button onClick={handleUpdateBudget} className="w-full py-4 rounded-xl font-bold text-lg text-white bg-emerald-600 hover:bg-emerald-700 shadow-xl shadow-emerald-200 transition active:scale-95">Set Bajet</button></div></div>)}
      <MasterListModal isOpen={showMasterList} onClose={() => setShowMasterList(false)} listCode={listCode} user={user} />
      <SmartToolsModal isOpen={showTools} onClose={() => setShowTools(false)} />
    </div>
  );
};

export default function App() {
  const [listCode, setListCode] = useState<string | null>(localStorage.getItem('jomShoppingCodeV3'));
  const handleJoin = (code: string) => { localStorage.setItem('jomShoppingCodeV3', code); setListCode(code); };
  const handleLeave = () => { localStorage.removeItem('jomShoppingCodeV3'); setListCode(null); };
  if (!listCode) return <JoinScreen onJoin={handleJoin} />;
  return <ShoppingList listCode={listCode} onLeave={handleLeave} />;
}