import { Formula } from '../types';

export default function WorkflowManager({ formula, onUpdate }: { formula: Formula, onUpdate: (status: Formula['status']) => void }) {
  const statuses: Formula['status'][] = ['Draft', 'Review', 'Approved', 'Production'];
  
  return (
    <div className="flex gap-2 items-center">
      {statuses.map(s => (
        <button 
          key={s}
          onClick={() => onUpdate(s)}
          className={`px-3 py-1 rounded text-xs transition ${formula.status === s ? 'bg-sky-600 text-white' : 'bg-slate-800 text-slate-400 hover:bg-slate-700'}`}
        >
          {s}
        </button>
      ))}
    </div>
  );
}
