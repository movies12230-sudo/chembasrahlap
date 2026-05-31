import React, { useState } from 'react';
import { auth } from '../lib/firebase';
import { signInWithEmailAndPassword, createUserWithEmailAndPassword } from 'firebase/auth';

export default function AuthModal({ onClose }: { onClose: () => void }) {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    try {
      if (isLogin) {
        await signInWithEmailAndPassword(auth, email, password);
      } else {
        await createUserWithEmailAndPassword(auth, email, password);
      }
      onClose();
    } catch (err: any) {
      if (err.message && err.message.includes('auth/operation-not-allowed')) {
        setError('طريقة التسجيل بالبريد غير مفعّلة في لوحة تحكم Firebase بعد. لتفعيلها، اذهب إلى: Firebase Console -> Authentication -> Sign-in methods -> وقم بتفعيل البريد وكلمة المرور (Email/Password). للبدء فوراً، يمكنك الضغط على "الدخول كزائر" بالأسفل.');
      } else if (err.message && (err.message.includes('auth/user-not-found') || err.message.includes('auth/wrong-password') || err.message.includes('auth/invalid-credential'))) {
        setError('خطأ: البريد الإلكتروني أو كلمة المرور غير صحيحة، أو الحساب غير موجود.');
      } else {
        setError(err.message || 'حدث خطأ أثناء الاتصال بالخادم.');
      }
    }
  };

  const handleGuestSignIn = () => {
    const guestUser = {
      uid: 'guest',
      displayName: 'مهندس زائر',
      email: 'guest@basra-lab.com'
    };
    localStorage.setItem('guest_user', JSON.stringify(guestUser));
    window.location.reload();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
      <div className="bg-slate-900 border border-slate-700 rounded-2xl p-8 max-w-sm w-full">
        <h2 className="text-xl font-bold mb-4 text-sky-400">{isLogin ? 'تسجيل دخول' : 'إنشاء حساب'}</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <input 
            type="email" 
            placeholder="البريد الإلكتروني" 
            className="w-full bg-slate-950 p-3 rounded-lg border border-slate-800"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          <input 
            type="password" 
            placeholder="كلمة المرور" 
            className="w-full bg-slate-950 p-3 rounded-lg border border-slate-800"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
          {error && <p className="text-red-500 text-xs">{error}</p>}
          <button type="submit" className="w-full bg-emerald-600 hover:bg-emerald-700 py-3 rounded-lg font-bold">
            {isLogin ? 'دخول' : 'تسجيل'}
          </button>
        </form>
        <button onClick={() => setIsLogin(!isLogin)} className="w-full mt-4 text-slate-400 text-xs underline">
          {isLogin ? 'ليس لديك حساب؟ سجل الآن' : 'لديك حساب؟ سجل دخول'}
        </button>
        <div className="relative flex py-3 items-center">
            <div className="flex-grow border-t border-slate-800"></div>
            <span className="flex-shrink mx-4 text-slate-500 text-[10px]">أو تجربة فورية للتطبيق</span>
            <div className="flex-grow border-t border-slate-800"></div>
        </div>
        <button 
          onClick={handleGuestSignIn} 
          type="button"
          className="w-full bg-slate-850 hover:bg-slate-850/80 border border-slate-700 hover:border-slate-600 text-sky-400 text-xs py-3 rounded-lg font-bold"
        >
          🔑 الدخول السريع كمهندس زائر (بدون حساب)
        </button>
        <button onClick={onClose} className="w-full mt-4 text-slate-500 hover:text-slate-450 underline text-xs">إغلاق</button>
      </div>
    </div>
  );
}
