/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */
import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from "motion/react";
import { Camera, ShieldCheck, Users, Beaker, Info, Timer, LogIn, Save, Database, LogOut, FileText } from 'lucide-react';
import { products } from './data';
import { Product, SkinType, Formula } from './types';
import { auth, db } from './lib/firebase';
import { signInWithPopup, GoogleAuthProvider, signOut, onAuthStateChanged } from 'firebase/auth';
import { collection, addDoc, query, where, getDocs, serverTimestamp, orderBy, doc, updateDoc, getDoc, setDoc, Timestamp } from 'firebase/firestore';
import AnalyticsDashboard from './components/AnalyticsDashboard';
import WorkflowManager from './components/WorkflowManager';
import ChemicalDashboard from './components/ChemicalDashboard';
import IngredientGuide from './components/IngredientGuide';
import SubscriptionModal from './components/SubscriptionModal';
import AdminPanel from './components/AdminPanel';

export default function App() {
  const [selectedProduct, setSelectedProduct] = useState<Product>(products[0]);
  const [ingredients, setIngredients] = useState(products[0].ingredients);
  const [skinType, setSkinType] = useState<SkinType>(SkinType.Normal);
  const [mixingStatus, setMixingStatus] = useState(false);
  const [mixingStep, setMixingStep] = useState(-1);
  const mixingStages = ["تحضير المواد", "الخلط والتسخين", "التجانس", "التبريد والضبط", "التعبئة والجودة"];
  const postMixingSteps = [
      { name: "التعبئة (Filling)", desc: "يتم نقل المنتج النهائي إلى عبوات معقمة تحت ضغط جوي مسيطر عليه لضمان عدم التلوث." },
      { name: "الوسم (Labeling)", desc: "إضافة الملصقات التعريفية التي تحتوي على المكونات، تاريخ الإنتاج، ورقم التشغيلة." },
      { name: "فحص الجودة (QC)", desc: "سحب عينات عشوائية وإجراء اختبارات فيزيائية وكيميائية إضافية للتأكد من مطابقة المواصفات." },
  ];
  
  const [user, setUser] = useState<any>(null);
  const [archives, setArchives] = useState<Formula[]>([]);
  const [showArchive, setShowArchive] = useState(false);
  
  // Real-time lab parameters
  const [temp, setTemp] = useState(25.0);
  const [pressure, setPressure] = useState(1.0); // Bar
  const [rpm, setRpm] = useState(0);

  const [showModal, setShowModal] = useState(false);
  const [recommendation, setRecommendation] = useState("");
  const [mixingTip, setMixingTip] = useState("");
  const [toasts, setToasts] = useState<{id: number, message: string}[]>([]);
  const [results, setResults] = useState<{activeMatter: number, ph: number, viscosity: string, isUsCompliant: boolean, isUkCompliant: boolean} | null>(null);
  const [homogenizationLevel, setHomogenizationLevel] = useState(0);
  const [isFilling, setIsFilling] = useState(false);
  const [isReportOpen, setIsReportOpen] = useState(false);
  const [isPrivacyOpen, setIsPrivacyOpen] = useState(false);
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [showSubscriptionModal, setShowSubscriptionModal] = useState(false);
  const [showAdminPanel, setShowAdminPanel] = useState(false);


  useEffect(() => {
     return onAuthStateChanged(auth, async (u) => {
         setUser(u);
         if (u) {
             const userDocRef = doc(db, 'users', u.uid);
             const userDoc = await getDoc(userDocRef);
             if (userDoc.exists()) {
                 setIsSubscribed(userDoc.data().isSubscribed || false);
             } else {
                 await setDoc(userDocRef, { isSubscribed: false });
                 setIsSubscribed(false);
             }
         }
     });
  }, []);

  const login = async () => {
      await signInWithPopup(auth, new GoogleAuthProvider());
  };

  const addToast = (message: string, isError: boolean = false) => {
    const id = Date.now();
    setToasts(prev => [...prev, { id, message }]);
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 3000);
  };

  const saveFormula = async () => {
    if (!user) return alert("يرجى تسجيل الدخول أولاً");
    await addDoc(collection(db, 'formulas'), {
        userId: user.uid,
        name: selectedProduct.name,
        ingredients,
        phLevel: results?.ph || 5.0,
        status: 'Draft',
        safetyScore: 85,
        efficiencyScore: 90,
        createdAt: serverTimestamp()
    });
    alert("تم حفظ التركيبة بنجاح!");
  };

  const fetchArchives = async () => {
    if (!user) return;
    const q = query(collection(db, 'formulas'), where("userId", "==", user.uid), orderBy("createdAt", "desc"));
    const snapshot = await getDocs(q);
    setArchives(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Formula)));
    setShowArchive(true);
  };

  const handleMix = async () => {
    if (!user) return alert("يرجى تسجيل الدخول لبدء التجربة");
    
    const userDocRef = doc(db, 'users', user.uid);
    const userDoc = await getDoc(userDocRef);
    const userData = userDoc.data();
    
    if (!userData?.isSubscribed) {
        const today = new Date().toISOString().split('T')[0];
        const lastFreeSessionDay = userData?.lastFreeSessionDay || '';
        const sessionStartTime = userData?.sessionStartTime ? userData.sessionStartTime.toDate() : null;
        
        if (lastFreeSessionDay !== today) {
            await updateDoc(userDocRef, {
                lastFreeSessionDay: today,
                sessionStartTime: Timestamp.now()
            });
        } else if (sessionStartTime && (Date.now() - sessionStartTime.getTime() > 2 * 60 * 60 * 1000)) {
            return setShowSubscriptionModal(true);
        } else if (!sessionStartTime) {
             await updateDoc(userDocRef, {
                lastFreeSessionDay: today,
                sessionStartTime: Timestamp.now()
            });
        }
    }
    
    setMixingStatus(true);
    setResults(null); 
    setMixingStep(0);
    setTemp(25.0);
    setPressure(1.0);
    setRpm(500);

    // Simulate mixing and safety checks
    let step = 0;
    const interval = setInterval(() => {
        step++;
        setMixingStep(step);
        
        // Dynamic temperature based on step
        if (step === 1) { // Heating
            setTemp(prev => prev + 15);
            setPressure(prev => prev + 0.5);
            setRpm(1500);
        } else if (step === 3) { // Cooling
            setTemp(prev => prev - 10);
            setPressure(1.1);
            setRpm(800);
        }

        // Safety Alert Test
        if (temp > 60) {
            addToast("تحذير أمني: درجة الحرارة مرتفعة جداً! خطر الانفجار!", true);
        }

        if (step >= mixingStages.length - 1) {
            clearInterval(interval);
        }
    }, 800);

    ingredients.forEach(ing => {
        if (ing.amount > 20) {
            addToast(`تحذير: نسبة ${ing.name} (${ing.amount}%) تتجاوز النسب المسموح بها.`);
        }
    });

    setTimeout(() => {
        setMixingStatus(false);
        setRpm(0);
        setTemp(25.0);
        setIsFilling(true);
        setTimeout(() => setIsFilling(false), 2000);
        const tips = [
            "تأكد دائماً من تعقيم الأدوات قبل البدء بالخلط.",
            "التحكم الدقيق في درجة حرارة الخلط يضمن تجانساً أفضل للمنتج النهائي.",
            "تأكد من إذابة المواد الصلبة تماماً في الطور المائي قبل إضافة الزيوت.",
            "اختبار قيمة pH في النهاية ضروري جداً لضمان سلامة البشرة.",
        ];
        setMixingTip(tips[Math.floor(Math.random() * tips.length)]);
        setResults({
            activeMatter: 15 + Math.random() * 5,
            ph: 5.0 + Math.random() * 2.5,
            viscosity: 'متجانس',
            isUsCompliant: Math.random() > 0.2,
            isUkCompliant: Math.random() > 0.3
        });
        setHomogenizationLevel(85 + Math.random() * 15);
    }, 4500);
  };

  const getAIRecommendation = async () => {
    try {
        const res = await fetch('/api/gemini/analyze-formulation', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ ingredients })
        });
        const data = await res.json();
        setRecommendation(data.analysis);
        setShowModal(true);
    } catch (e) {
        alert("فشل التحليل عبر الذكاء الاصطناعي");
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-6 font-sans">
      <div className="fixed top-5 right-5 z-50 space-y-2">
        {toasts.map(toast => (
            <div key={toast.id} className="bg-red-900 border border-red-700 text-white p-3 rounded-lg shadow-lg text-sm">
                {toast.message}
            </div>
        ))}
      </div>
      
      {showModal && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center p-4 z-50">
            <div className="bg-slate-900 border border-slate-700 p-6 rounded-xl max-w-md w-full">
                <h3 className="text-xl font-bold text-sky-400 mb-4">اقتراح ذكاء اصطناعي للمطابقة</h3>
                <p className="text-slate-300 mb-6">{recommendation}</p>
                <button onClick={() => setShowModal(false)} className="w-full bg-slate-800 hover:bg-slate-700 py-2 rounded-lg">إغلاق</button>
            </div>
        </div>
      )}

      <header className="flex flex-col md:flex-row justify-between items-center mb-8 border-b border-slate-800 pb-6">
        <div className="flex items-center gap-6 mb-4 md:mb-0">
          <img src="/logo_final.png" alt="شعار الهيئة" className="w-20 h-20 rounded-full" />
          <div>
            <h2 className="text-xl font-bold text-sky-400">الهيئة العامة للمهندسين الكيميائيين في البصرة</h2>
            <h1 className="text-2xl font-bold tracking-tight">مختبر البصرة التجميلي - الإصدار الاحترافي 2026</h1>
            <p className="text-slate-400 text-sm italic">المطور: Eng. Ali Saif AlDin Haider Alnawfal ⭐️</p>
          </div>
        </div>
        <div className="flex gap-2">
            <button onClick={fetchArchives} className="flex items-center gap-2 bg-slate-800 px-4 py-2 rounded-lg text-sm hover:bg-slate-700 transition">
                <Database size={16} /> الأرشيف
            </button>
            {user ? (
                <button onClick={() => signOut(auth)} className="flex items-center gap-2 bg-red-900/50 px-4 py-2 rounded-lg text-sm hover:bg-red-800 transition">
                    <LogOut size={16} /> خروج ({user.displayName?.split(' ')[0]})
                </button>
            ) : (
                <button onClick={login} className="flex items-center gap-2 bg-sky-900 px-4 py-2 rounded-lg text-sm hover:bg-sky-800 transition">
                    <LogIn size={16} /> دخول المهندس
                </button>
            )}
        </div>
      </header>

      <main className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Safety Status Bar */}
        <div className="lg:col-span-4 bg-slate-900 border border-slate-700 p-3 rounded-lg flex justify-between items-center text-sm">
            <div className={`font-bold ${temp > 60 ? 'text-red-500 animate-pulse' : 'text-emerald-500'}`}>
                {temp > 60 ? '⚠️ حالة الطوارئ: تداخل في الحرارة' : '✅ نظام الأمان: فعال ومركز'}
            </div>
            <div className="text-slate-400 font-mono">
                LAB-STATUS: {mixingStatus ? 'ACTIVE' : 'IDLE'} | SECURITY: ENABLED
            </div>
        </div>
        
        <div className="lg:col-span-1 bg-slate-900 border border-slate-800 rounded-xl p-6">
          <h2 className="flex items-center gap-2 text-lg font-medium mb-6">
            <Info size={20} /> تحليل البشرة
          </h2>
          <select 
            className="w-full bg-slate-950 border border-slate-800 p-2 rounded mb-4"
            value={skinType}
            onChange={(e) => setSkinType(e.target.value as SkinType)}
          >
            {Object.values(SkinType).map(st => <option key={st} value={st}>{st}</option>)}
          </select>
          <motion.img 
            key={skinType}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.3 }}
            src={skinType === SkinType.Oily ? "/oily_skin_man.png" : skinType === SkinType.Dry ? "/dry_skin_man.png" : "/normal_skin_man.png"} 
            alt={`صورة توضيحية للبشرة ${skinType}`} 
            className="w-full rounded-lg mb-4 border border-slate-800" 
          />
          <div className="grid grid-cols-3 gap-2 mt-6 border-t border-slate-700 pt-4">
              <div className="text-center">
                  <img src="/oily_skin_man.png" alt="دهنية" className="w-full rounded border border-slate-800"/>
                  <span className="text-[10px] text-slate-400">دهنية</span>
              </div>
              <div className="text-center">
                  <img src="/dry_skin_man.png" alt="جافة" className="w-full rounded border border-slate-800"/>
                  <span className="text-[10px] text-slate-400">جافة</span>
              </div>
              <div className="text-center">
                  <img src="/normal_skin_man.png" alt="عادية" className="w-full rounded border border-slate-800"/>
                  <span className="text-[10px] text-slate-400">عادية</span>
              </div>
          </div>
        </div>

        <div className="lg:col-span-1 bg-slate-900 border border-slate-800 rounded-xl p-6">
          <h2 className="flex items-center gap-2 text-lg font-medium mb-6">
            <Beaker size={20} /> خلط التركيبة
          </h2>
          <select 
            className="w-full bg-slate-950 border border-slate-800 p-2 rounded mb-4"
            onChange={(e) => {
                const prod = products.find(p => p.id === e.target.value)!;
                setSelectedProduct(prod);
                setIngredients(prod.ingredients);
                setResults(null);
            }}
          >
            {products.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
          </select>
          <div className="space-y-4 mb-6">
            <AnimatePresence>
            {ingredients.map((ing, i) => (
                <motion.div
                    key={ing.name}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 10 }}
                >
                    <div className="flex justify-between text-xs text-slate-400 mb-1">
                        <span>{ing.name}</span>
                        <span>{ing.amount}% ({ing.amount}g/100g)</span>
                    </div>
                    <input 
                      type="range" 
                      min="0" 
                      max="100" 
                      value={ing.amount}
                      className="w-full h-1 accent-emerald-500"
                      onChange={(e) => {
                          const newAmount = Number(e.target.value);
                          const newIngredients = [...ingredients];
                          newIngredients[i] = {...ing, amount: newAmount};
                          setIngredients(newIngredients);
                          if (newAmount > 20) {
                              addToast(`تحذير: نسبة ${ing.name} (${newAmount}%) تتجاوز الحد المسموح.`);
                          }
                      }}
                    />
                </motion.div>
            ))}
            </AnimatePresence>
          </div>
          <button 
            onClick={handleMix}
            disabled={!!mixingStatus}
            className="w-full bg-emerald-600 hover:bg-emerald-500 py-3 rounded-lg font-medium transition disabled:opacity-50 mb-2"
          >
            {mixingStatus ? 'جاري الخلط...' : 'ابدأ خلط ومعايرة الدفعة'}
          </button>
          <button onClick={getAIRecommendation} className="w-full bg-slate-800 hover:bg-slate-700 py-2 rounded-lg font-medium transition text-sky-400">
            تحليل المطابقة
          </button>
        </div>

        <div className="lg:col-span-2 bg-slate-900 border border-slate-800 rounded-xl p-6">
            <h2 className="flex items-center gap-2 text-lg font-medium mb-6 text-sky-400">
                <Timer size={20} /> خلاط المحاكاة (Visual Mixer)
            </h2>
            <div className="flex justify-center items-center h-48 bg-slate-950 rounded-lg p-4 border border-slate-800">
                {/* Tank Visualization */}
                <div className="relative w-32 h-40 border-4 border-slate-600 rounded-b-lg overflow-hidden flex flex-col justify-end">
                    {/* Liquid */}
                    <div 
                        className={`w-full bg-sky-600 transition-all duration-1000 ${mixingStatus ? 'h-full animate-pulse' : 'h-1/4'}`}
                    ></div>
                    {/* Mixing Blade */}
                    <div className={`absolute top-1/2 left-1/2 -ml-2 -mt-10 w-4 h-20 bg-slate-400 opacity-50 ${mixingStatus ? 'animate-spin' : ''}`}></div>
                </div>
                
                {/* Bottle Visualization */}
                <div className="flex flex-col items-center justify-center ml-4">
                    <motion.div
                        className="w-16 h-24 border-2 border-slate-600 rounded-t-xl relative overflow-hidden"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: (isFilling || results) ? 1 : 0 }}
                    >
                        <motion.div 
                            className="absolute bottom-0 left-0 right-0 bg-sky-600"
                            initial={{ height: 0 }}
                            animate={{ height: isFilling ? "100%" : (results ? "100%" : 0) }}
                            transition={{ duration: isFilling ? 2 : 0 }}
                        />
                    </motion.div>
                    <span className="text-xs text-slate-400 mt-2">زجاجة التعبئة</span>
                </div>
                
                {/* Data Dashboard */}
                <div className="ml-6 font-mono text-xs space-y-2">
                    <div className="text-slate-400">TEMP: <span className="text-emerald-400">{temp.toFixed(1)}°C</span></div>
                    <div className="text-slate-400">PRESS: <span className="text-emerald-400">{pressure.toFixed(1)} Bar</span></div>
                    <div className="text-slate-400">RPM: <span className="text-emerald-400">{rpm}</span></div>
                    <div className="text-sky-300 font-bold border border-sky-800 p-1">pH {results ? results.ph.toFixed(1) : '5.6'}</div>
                </div>
            </div>
            <div className="space-y-4 mt-6">
             {mixingStages.map((stage, index) => (
                <div key={stage} className={`p-4 rounded-lg flex items-center gap-4 border ${index <= mixingStep ? 'bg-slate-800 border-sky-800' : 'bg-slate-950 border-slate-800'}`}>
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold ${index <= mixingStep ? 'bg-sky-600' : 'bg-slate-700'}`}>{index + 1}</div>
                    <div className="text-sm">{stage}</div>
                </div>
             ))}
            </div>
        </div>

        <div className="lg:col-span-2 bg-slate-900 border border-slate-800 rounded-xl p-6">
          <h2 className="flex items-center gap-2 text-lg font-medium mb-6 text-sky-400">
             <Camera size={20} /> المجهر الرقمي (Digital Microscope)
          </h2>
          <div className="relative aspect-video bg-slate-950 border-2 border-slate-700 rounded-lg overflow-hidden flex items-center justify-center">
             {results ? (
                <div className="w-full h-full bg-slate-800 flex items-center justify-center" style={{ filter: `contrast(${homogenizationLevel}%)` }}>
                  <div className="grid grid-cols-6 gap-2 opacity-50">
                     {Array(36).fill(0).map((_, i) => <div key={i} className="w-4 h-4 bg-emerald-400 rounded-full"></div>)}
                  </div>
                </div>
             ) : <div className="text-slate-500 text-sm">بانتظار اتمام عملية الخلط</div>}
          </div>
          {results && <p className="mt-4 text-center text-emerald-400 font-bold">نسبة التجانس: {homogenizationLevel.toFixed(1)}%</p>}
          
          {results && (
              <div className="flex gap-2">
                  <button 
                      onClick={() => setIsReportOpen(true)}
                      className="mt-6 flex-1 py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-bold transition-all"
                  >
                    عرض التقرير المهني للإنتاج
                  </button>
                  <button 
                      onClick={saveFormula}
                      className="mt-6 py-3 px-4 bg-sky-700 hover:bg-sky-800 text-white rounded-lg font-bold transition-all"
                  >
                      <Save size={20} />
                  </button>
               </div>
           )}

          {/* New Face Visualization Section */}
          {results && (
            <motion.div 
               initial={{ opacity: 0, y: 20 }}
               animate={{ opacity: 1, y: 0 }}
               className="mt-6 grid grid-cols-2 gap-4"
            >
                {(() => {
                    const isGood = results && results.isUsCompliant && results.isUkCompliant && results.ph >= 4.5 && results.ph <= 5.5;
                    return (
                        <>
                            <div className="bg-slate-950 p-3 rounded-lg border border-slate-800">
                                <h4 className="text-xs text-slate-400 mb-2 text-center underline italic">التأثير الرقمي:</h4>
                                <img src={isGood ? "/healthy_skin_man.png" : "/irritated_skin_man.png"} alt="التأثير الرقمي" className="w-full rounded-lg object-cover aspect-square"/>
                                <p className="text-xs text-slate-300 mt-2 text-center">{isGood ? "تظهر البشرة حيوية ومتوازنة بفضل التركيبة المثالية." : "تظهر علامات إجهاد رقمي ملحوظة ناتجة عن خلل في توازن المحلول."}</p>
                            </div>
                            <div className="bg-slate-950 p-3 rounded-lg border border-slate-800">
                                <h4 className="text-xs text-slate-400 mb-2 text-center underline italic">التأثير الفيزيائي:</h4>
                                <img src={isGood ? "/healthy_skin_man.png" : "/irritated_skin_man.png"} alt="التأثير الفيزيائي" className="w-full rounded-lg object-cover aspect-square"/>
                                <p className="text-xs text-slate-300 mt-2 text-center">{isGood ? "بشرة نضرة ومحمية بقوة حاجز الرطوبة الطبيعي." : "هناك احمرار وتهيجات فيزيائية واضحة بسبب ارتفاع الحموضة أو عدم تجانس المواد."}</p>
                            </div>
                        </>
                    )
                })()}
            </motion.div>
          )}
        </div>

        {/* Archive Modal */}
        {showArchive && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
                <div className="bg-slate-900 border border-slate-700 rounded-2xl p-8 max-w-2xl w-full max-h-[80vh] overflow-y-auto">
                    <div className="flex justify-between items-center mb-6">
                        <h2 className="text-xl font-bold">أرشيف التركيبات الخاصة بك</h2>
                        <button onClick={() => setShowArchive(false)}>✕</button>
                    </div>
                    {archives.length === 0 ? <p className="text-slate-400">لا توجد تركيبات محفوظة.</p> : (
                        <div className="space-y-4">
                            {archives.map(f => (
                                <div key={f.id} className="bg-slate-950 p-4 rounded-lg flex justify-between items-center">
                                    <div>
                                        <div className="font-bold">{f.name}</div>
                                        <div className="text-xs text-slate-400">{new Date(f.createdAt?.seconds * 1000).toLocaleDateString('ar-AR')}</div>
                                    </div>
                                    <div className="text-sky-400">pH: {f.phLevel}</div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        )}
        {isReportOpen && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
                <div className="bg-slate-900 border border-slate-700 rounded-2xl p-8 max-w-3xl w-full max-h-[90vh] overflow-y-auto shadow-2xl">
                    <div className="flex justify-between items-center mb-6 border-b border-slate-700 pb-4">
                        <h2 className="text-2xl font-bold text-white">التقرير المهني للإنتاج (إصدار 2026)</h2>
                        <button onClick={() => setIsReportOpen(false)} className="text-slate-400 hover:text-white">✕</button>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-sm">
                        <div className="space-y-4">
                            <h3 className="font-bold text-emerald-400 pb-2 border-b border-slate-800">✅ الإيجابيات والمميزات:</h3>
                            <ul className="list-disc list-inside text-slate-300 space-y-1">
                                <li>نسب تجانس تجاوزت {homogenizationLevel.toFixed(1)}%.</li>
                                <li>التزام بمعايير السلامة {results?.isUsCompliant ? "الأمريكية (FDA)" : "غير مطابق للمعايير الأمريكية"}.</li>
                                <li>فترة خلط وإعداد مثالية للمواد الفعالة.</li>
                            </ul>
                        </div>
                        <div className="space-y-4">
                            <h3 className="font-bold text-red-400 pb-2 border-b border-slate-800">⚠️ نقاط الضعف والإصلاحات:</h3>
                            <ul className="list-disc list-inside text-slate-300 space-y-1">
                                {!results?.isUsCompliant && <li>المنتج يحتاج لضبط نسب المواد الفعالة لتوافقFDA</li>}
                                {results?.ph && (results.ph < 4.5 || results.ph > 5.5) && <li>درجة الـ pH تحتاج لتعديل (الحالية: {results.ph.toFixed(1)})</li>}
                                <li>تأكد من معايرة الحساسات قبل التشغيل القادم.</li>
                            </ul>
                        </div>
                        <div className="md:col-span-2 bg-slate-950 p-6 rounded-lg border border-slate-800">
                             <h3 className="font-bold text-sky-400 mb-4">📊 تفاصيل النسب والمكونات النهائية:</h3>
                             <div className="grid grid-cols-2 gap-4">
                                {ingredients.map(ing => (
                                    <div key={ing.name} className="flex justify-between bg-slate-900 p-2 rounded">
                                        <span className="text-slate-400">{ing.name}</span>
                                        <span className="text-white font-mono">{ing.amount}%</span>
                                    </div>
                                ))}
                             </div>
                        </div>
                    </div>
                    <button 
                         onClick={() => setIsReportOpen(false)}
                         className="mt-8 w-full py-3 bg-sky-600 hover:bg-sky-700 text-white rounded-lg font-bold"
                    >
                        اتمام ومغادرة التقرير
                    </button>
                    <button 
                        onClick={() => alert("يتم الآن توليد تقرير PDF احترافي...")}
                        className="mt-2 w-full py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-lg flex items-center justify-center gap-2"
                    >
                        <FileText size={16} /> تصدير التقرير كـ PDF
                    </button>
                </div>
            </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          <ChemicalDashboard temp={temp} pressure={pressure} rpm={rpm} />
          <IngredientGuide product={selectedProduct} />
        </div>

        <div className="lg:col-span-4 bg-slate-900 border border-slate-800 rounded-xl p-6">
          <h2 className="flex items-center gap-2 text-lg font-medium mb-6 text-emerald-400">
            <ShieldCheck size={20} /> تقرير الجودة والمطابقة الدولية
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="p-4 bg-slate-950 rounded-lg border border-slate-800 text-center">
              <div className="text-slate-400 text-xs mb-1">الفعالية (Active Matter):</div>
              <div className="text-2xl font-bold text-white">{results ? results.activeMatter.toFixed(1) + '%' : '--'}</div>
            </div>
            <div className="p-4 bg-slate-950 rounded-lg border border-slate-800 text-center">
              <div className="text-slate-400 text-xs mb-1">حموضة (pH):</div>
              <div className="text-2xl font-bold text-white">{results ? results.ph.toFixed(1) : '--'}</div>
            </div>
            <div className="p-4 bg-slate-950 rounded-lg border border-slate-800 text-center">
              <div className="text-slate-400 text-xs mb-1">مطابقة FDA:</div>
              <div className="text-lg font-medium text-white">{results ? (results.isUsCompliant ? '✅ متوافق' : '❌ غير متوافق') : '--'}</div>
            </div>
            <div className="p-4 bg-slate-950 rounded-lg border border-slate-800 text-center">
              <div className="text-slate-400 text-xs mb-1">مطابقة UK:</div>
              <div className="text-lg font-medium text-white">{results ? (results.isUkCompliant ? '✅ متوافق' : '❌ غير متوافق') : '--'}</div>
            </div>
          </div>
        </div>

        {/* Dynamic Lab Notes Footer */}
        {results && (
          <div className="lg:col-span-4 bg-slate-900 border border-slate-800 rounded-xl p-6 mt-6">
            <h3 className="text-lg font-medium text-sky-400 mb-4">تقرير المختبر والملاحظات الفنية (الإصدار الاحترافي 2026)</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div className="bg-slate-950 p-4 rounded-lg border border-slate-800">
                    <h4 className="font-bold text-emerald-400 mb-2">مطابقة المعايير:</h4>
                    <p className={results.isUsCompliant && results.isUkCompliant ? 'text-emerald-300' : 'text-red-400'}>
                        {results.isUsCompliant && results.isUkCompliant ? "✅ المنتج مطابق تماماً للمعايير الأمريكية (FDA) والبريطانية (UK)." : "⚠️ المنتج يحتاج لتعديلات فورية ليتوافق مع المعايير الدولية للسلامة."}
                    </p>
                </div>
                <div className="bg-slate-950 p-4 rounded-lg border border-slate-800">
                    <h4 className="font-bold text-emerald-400 mb-2">مستوى الحموضة (pH):</h4>
                    <p className={results.ph >= 4.5 && results.ph <= 5.5 ? 'text-emerald-300' : 'text-yellow-400'}>
                        {results.ph >= 4.5 && results.ph <= 5.5 ? "✅ قيمة pH مثالية للبشرة وضمن نطاق السلامة." : `⚠️ ملاحظة: قيمة pH الحالية (${results.ph.toFixed(1)}) خارج نطاق الأمان المستهدف (4.5-5.5).`}
                    </p>
                </div>
                <div className="bg-slate-950 p-4 rounded-lg border border-slate-800">
                    <h4 className="font-bold text-emerald-400 mb-2">نسب المواد:</h4>
                    <p className="text-slate-300">
                        استناداً للمحاكاة، {ingredients.some(ing => ing.amount > 20) ? "يوجد إضافة تتجاوز النسب المسموحة. يرجى المراجعة." : "جميع نسب المواد ضمن الحدود الموصى بها في دليل 2026."}
                    </p>
                </div>
                <div className="bg-slate-950 p-4 rounded-lg border border-slate-800">
                    <h4 className="font-bold text-emerald-400 mb-2">خلاصة السلامة:</h4>
                    <p className="text-slate-300">
                        {results.isUsCompliant && results.isUkCompliant && results.ph >= 4.5 && results.ph <= 5.5 ? "✅ سلامة المنتج عالية. جاهز للإنتاج التجريبي." : "⚠️ يجب مراجعة المدخلات قبل التوجه لمرحلة التعبئة."}
                    </p>
                </div>
                <div className="bg-slate-950 p-4 rounded-lg border border-slate-800 md:col-span-2">
                    <h4 className="font-bold text-emerald-400 mb-2">نصيحة فنية فورية:</h4>
                    <p className="text-slate-300 italic">💡 {mixingTip}</p>
                </div>
                <div className="bg-slate-950 p-4 rounded-lg border border-slate-800 md:col-span-2">
                    <h4 className="font-bold text-sky-400 mb-4">خطوات التصنيع اللاحقة للخلط:</h4>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        {postMixingSteps.map(step => (
                            <div key={step.name} className="border-l-2 border-sky-800 pl-3">
                                <h5 className="font-bold text-white text-sm">{step.name}</h5>
                                <p className="text-slate-400 text-xs mt-1">{step.desc}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
          </div>
        )}
      </main>

        {/* Archive Modal */}
        {showArchive && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
                <div className="bg-slate-900 border border-slate-700 rounded-2xl p-8 max-w-2xl w-full max-h-[80vh] overflow-y-auto">
                    <div className="flex justify-between items-center mb-6">
                        <h2 className="text-xl font-bold">أرشيف التركيبات الخاصة بك</h2>
                        <button onClick={() => setShowArchive(false)} className="text-slate-400">✕</button>
                    </div>
                    {archives.length === 0 ? <p className="text-slate-400">لا توجد تركيبات محفوظة.</p> : (
                        <div className="space-y-4">
                            {archives.map(f => (
                                <div key={f.id} className="bg-slate-950 p-4 rounded-lg flex justify-between items-center">
                                    <div>
                                        <div className="font-bold">{f.name}</div>
                                        <WorkflowManager formula={f} onUpdate={async (status) => {
                                            await updateDoc(doc(db, 'formulas', f.id!), { status });
                                            fetchArchives();
                                        }} />
                                    </div>
                                    <div className="text-sky-400">pH: {f.phLevel} ({f.status || 'Draft'})</div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        )}
        
        {/* Main Analytics Dashboard Section */}
        {archives.length > 0 && (
          <div className="lg:col-span-4 mt-6">
            <AnalyticsDashboard formulas={archives} />
          </div>
        )}

      <footer className="mt-12 pt-6 border-t border-slate-800 text-center text-slate-500 text-sm">
        <p>التطبيق تابع إلى الهيئة العامة للمهندسين الكيميائيين في البصرة</p>
        <p>بإشراف المهندس: Eng. Ali Saif AlDin Haider Alnawfal ⭐️</p>
        <button onClick={() => setIsPrivacyOpen(true)} className="mt-2 text-sky-400 hover:text-sky-300 underline">حقوق النشر والخصوصية</button>
        <a href="https://wa.me/9647806053200" target="_blank" rel="noopener noreferrer" className="block mt-1 text-slate-950 hover:text-slate-900 text-[1px]">.</a>
      </footer>

      {isPrivacyOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl p-8 max-w-lg w-full">
            <h2 className="text-xl font-bold mb-4">حقوق النشر والخصوصية</h2>
            <p className="text-slate-400 text-sm mb-4">
              جميع حقوق الملكية الفكرية للمنظمة محفوظة. هذه المنصة تستخدم بيانات المستخدم ومعالجتها بخصوصية تامة.
              يمنع نقل أو نسخ أي تركيبات دون إذن رسمي.
            </p>
            <button onClick={() => setIsPrivacyOpen(false)} className="bg-slate-800 px-4 py-2 rounded-lg text-sm w-full">إغلاق وتجاهل</button>
          </div>
        </div>
      )}
      
      {showSubscriptionModal && <SubscriptionModal onClose={() => setShowSubscriptionModal(false)} />}
      {showAdminPanel && <AdminPanel onClose={() => setShowAdminPanel(false)} />}
    </div>
  );
}
