export default function SubscriptionModal({ onClose }: { onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
      <div className="bg-slate-900 border border-slate-700 rounded-2xl p-8 max-w-lg w-full text-center">
        <h2 className="text-xl font-bold mb-4 text-sky-400">انتهت الفترة المجانية لليوم</h2>
        <p className="text-slate-400 text-sm mb-6">
          لقد استنفدت الساعتين المجانيتين لهذا اليوم. يمكنك المحاولة مجدداً غداً، أو الاشتراك للحصول على وصول غير محدود مقابل ١٥ دولار شهرياً.
        </p>
        <a 
          href="https://wa.me/9647806053200" 
          target="_blank" 
          rel="noopener noreferrer" 
          className="block w-full bg-emerald-600 hover:bg-emerald-700 py-3 rounded-lg font-bold mb-4"
        >
          للاشتراك: راسلنا على واتس اب
        </a>
        <button onClick={onClose} className="text-slate-500 underline text-sm">إغلاق</button>
      </div>
    </div>
  );
}
