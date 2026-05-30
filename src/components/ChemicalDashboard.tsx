import { Gauge, Thermometer, Zap, GaugeCircle } from 'lucide-react';

export default function ChemicalDashboard({ temp, pressure, rpm }: { temp: number, pressure: number, rpm: number }) {
  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
      <h3 className="text-sm font-bold text-slate-400 mb-6 flex items-center gap-2">
        <GaugeCircle size={16} /> لوحة التحكم الكيميائية
      </h3>
      <div className="grid grid-cols-3 gap-4">
        <div className="text-center">
            <Thermometer className="mx-auto text-orange-400 mb-2" size={24} />
            <div className="text-xl font-bold">{temp.toFixed(1)}°C</div>
            <div className="text-xs text-slate-500">درجة الحرارة</div>
        </div>
        <div className="text-center">
            <Gauge className="mx-auto text-sky-400 mb-2" size={24} />
            <div className="text-xl font-bold">{pressure.toFixed(1)} Bar</div>
            <div className="text-xs text-slate-500">الضغط</div>
        </div>
        <div className="text-center">
            <Zap className="mx-auto text-emerald-400 mb-2" size={24} />
            <div className="text-xl font-bold">{rpm} RPM</div>
            <div className="text-xs text-slate-500">سرعة التحريك</div>
        </div>
      </div>
    </div>
  );
}
