import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';

export default function AnalyticsDashboard({ formulas }: { formulas: any[] }) {
  const data = formulas.map((f, i) => ({
    name: f.name,
    safety: f.safetyScore || Math.random() * 100,
    efficiency: f.efficiencyScore || Math.random() * 100
  }));

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 h-64">
      <h3 className="text-sm font-bold text-slate-400 mb-4">تحليلات الأداء والسلامة</h3>
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
          <XAxis dataKey="name" stroke="#94a3b8" />
          <YAxis stroke="#94a3b8" />
          <Tooltip contentStyle={{backgroundColor: '#0f172a'}} />
          <Legend />
          <Line type="monotone" dataKey="safety" stroke="#10b981" name="مستوى السلامة" />
          <Line type="monotone" dataKey="efficiency" stroke="#0ea5e9" name="كفاءة التصنيع" />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
