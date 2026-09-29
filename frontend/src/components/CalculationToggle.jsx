import { cn } from '@/lib/utils';

export default function CalculationToggle({ value, options, onChange, testIdPrefix = 'calc' }) {
  return (
    <div className="inline-flex rounded-xl bg-slate-100 p-1">
      {options.map((option) => (
        <button
          key={option.id}
          type="button"
          data-testid={`${testIdPrefix}-${option.id}`}
          onClick={() => onChange(option.id)}
          className={cn(
            'rounded-lg px-3.5 py-1.5 text-xs font-semibold transition-all',
            value === option.id ? 'bg-white text-[#0B2545] shadow-sm' : 'text-slate-500 hover:text-slate-700'
          )}
        >
          {option.label}
        </button>
      ))}
    </div>
  );
}
