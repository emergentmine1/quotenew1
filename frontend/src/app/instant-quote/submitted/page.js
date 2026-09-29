import Link from 'next/link';
import { CheckCircle2 } from 'lucide-react';
import StatusPage, { primaryButtonClass } from '@/components/StatusPage';

export const metadata = {
  title: 'Request received | KWE Instant Quote',
};

// Shown after a quote request is saved. Phase 1 does not show prices, only the reference.
export default async function SubmittedPage({ searchParams }) {
  const { ref } = await searchParams;

  return (
    <StatusPage
      icon={CheckCircle2}
      iconClassName="text-emerald-500"
      title="We received your request"
      message="Thank you. Our team will review your shipment details and contact you by email."
    >
      {ref && (
        <div className="mt-8 rounded-2xl border border-slate-200 bg-white px-6 py-5" data-testid="submitted-reference">
          <div className="text-xs font-semibold uppercase tracking-widest text-slate-500">Your reference</div>
          <div className="mt-1 text-2xl font-black text-[#0B2545]">{ref}</div>
        </div>
      )}

      <Link href="/instant-quote" className={primaryButtonClass}>
        Submit another request
      </Link>
    </StatusPage>
  );
}
