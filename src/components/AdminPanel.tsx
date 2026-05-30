import { useState } from 'react';
import { db } from '../lib/firebase';
import { collection, query, where, getDocs, updateDoc } from 'firebase/firestore';

export default function AdminPanel({ onClose }: { onClose: () => void }) {
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');

  const whitelistUser = async () => {
    try {
      const q = query(collection(db, 'users'), where('email', '==', email));
      const querySnapshot = await getDocs(q);
      
      if (querySnapshot.empty) {
        setMessage('المستخدم غير موجود');
        return;
      }
      
      querySnapshot.forEach(async (userDoc) => {
          await updateDoc(userDoc.ref, { isSubscribed: true });
          setMessage(`تم تفعيل الاشتراك للمستخدم: ${email}`);
      });
    } catch (e) {
      setMessage('حدث خطأ أثناء التحديث');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
      <div className="bg-slate-900 border border-slate-700 rounded-2xl p-8 max-w-lg w-full">
        <h2 className="text-xl font-bold mb-4 text-sky-400">لوحة تحكم الأدمن</h2>
        <input 
            type="email" 
            placeholder="بريد المستخدم" 
            className="w-full bg-slate-950 p-3 rounded-lg border border-slate-800 mb-4"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
        />
        <button 
            onClick={whitelistUser}
            className="w-full bg-emerald-600 hover:bg-emerald-700 py-3 rounded-lg font-bold mb-4"
        >
            تفعيل اشتراك المستخدم
        </button>
        {message && <p className="text-sm text-center mb-4 text-slate-300">{message}</p>}
        <button onClick={onClose} className="w-full text-slate-500 underline text-sm">إغلاق</button>
      </div>
    </div>
  );
}
