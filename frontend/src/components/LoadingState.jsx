import { Loader2 } from 'lucide-react';

export default function LoadingState({ label = 'Loading…' }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-slate-500">
      <Loader2 className="h-6 w-6 animate-spin text-[#D4AF37]" />
      <p className="mt-3 text-sm font-medium">{label}</p>
    </div>
  );
}
