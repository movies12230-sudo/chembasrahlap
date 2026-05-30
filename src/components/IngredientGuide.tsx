import { BookOpen } from 'lucide-react';
import { Product } from '../types';

export default function IngredientGuide({ product }: { product: Product }) {
  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 h-full">
      <h3 className="text-sm font-bold text-slate-400 mb-6 flex items-center gap-2">
        <BookOpen size={16} /> دليل المكونات الذكي
      </h3>
      <div className="space-y-4 max-h-64 overflow-y-auto">
        {product.ingredients.map((ing, i) => (
          <div key={i} className="flex justify-between items-center bg-slate-950 p-3 rounded-lg border border-slate-800">
            <span className="font-medium text-sm text-sky-200">{ing.name}</span>
            <span className="text-xs bg-slate-800 px-2 py-1 rounded text-slate-300">{ing.amount}%</span>
          </div>
        ))}
      </div>
    </div>
  );
}
