'use client';

import { useState } from 'react';
import { ChevronDown, ChevronUp, HelpCircle, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Flag from '@/components/Flag';

function SummaryItem({ label, value }) {
  return (
    <div className="flex items-start justify-between gap-3 border-b border-white/10 pb-3">
      <span className="text-[11px] font-semibold uppercase tracking-widest text-[#5BB3FF]/80">{label}</span>
      <span className="text-right font-semibold">{value}</span>
    </div>
  );
}

export default function QuoteSummary({ summary, onSubmit, submitDisabled = false }) {
  const [showDetails, setShowDetails] = useState(false);

  return (
    <aside className="lg:sticky lg:top-20 lg:self-start">
      <div className="relative overflow-hidden rounded-2xl bg-[#0B2545] p-6 text-white shadow-[0_12px_34px_-16px_rgba(11,37,69,0.6)]">
        <div className="absolute -right-10 -top-10 h-32 w-32 rounded-full bg-[#1E6AE1]/30 blur-2xl" />
        <div className="relative">
          <div className="text-xs font-semibold uppercase tracking-[0.18em] text-[#5BB3FF]">Quote Summary</div>
          <h3 className="mt-1 text-2xl font-black tracking-tight">Your Shipment</h3>

          <div className="mt-4 rounded-xl border border-white/15 bg-white/5 px-3.5 py-3">
            <div className="flex items-center justify-between gap-2 text-sm">
              <div className="inline-flex items-center gap-2 min-w-0">
                {summary.pickupCountryCode ? <Flag code={summary.pickupCountryCode} size={16} /> : null}
                <span className="font-semibold truncate">{summary.pickupFrom}</span>
              </div>
              <Sparkles className="h-3.5 w-3.5 shrink-0 text-[#5BB3FF]" />
              <div className="inline-flex items-center gap-2 min-w-0">
                <span className="font-semibold truncate">{summary.deliveryTo}</span>
                {summary.deliveryCountryCode ? <Flag code={summary.deliveryCountryCode} size={16} /> : null}
              </div>
            </div>
          </div>

          <div className="mt-4 space-y-4 text-sm">
            <SummaryItem label="Shipping mode" value={summary.shippingMode} />
            <SummaryItem label="Cargo type" value={summary.cargoType} />
            <SummaryItem label="Commodity / Goods" value={summary.commodity} />
            <SummaryItem label="Ready date" value={summary.readyDate} />
            <SummaryItem label="Delivery date" value={summary.deliveryDate || 'Not selected'} />
            <SummaryItem label="Services" value={`${summary.servicesSelected || 0} selected`} />
            <button
              type="button"
              onClick={() => setShowDetails((v) => !v)}
              className="w-full inline-flex items-center justify-between rounded-lg border border-white/10 px-3 py-2 text-xs font-semibold uppercase tracking-widest text-[#5BB3FF] hover:bg-white/5 transition-colors"
            >
              <span>{showDetails ? 'Hide details' : 'Show details'}</span>
              {showDetails ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
            </button>
            {showDetails ? (
              <>
                <SummaryItem label="Total weight" value={`${summary.totalWeight} ${summary.weightUnit}`} />
                <SummaryItem label="Total volume" value={`${summary.totalVolume} ${summary.volumeUnit}`} />
                {summary.chargeableWeight ? (
                  <SummaryItem label="Chargeable weight" value={summary.chargeableWeight} />
                ) : null}
              </>
            ) : null}
          </div>

          <Button
            onClick={onSubmit}
            disabled={submitDisabled}
            data-testid="iq-rail-submit"
            className="mt-6 h-12 w-full rounded-xl bg-[#1E6AE1] font-semibold text-white hover:bg-[#1758c2]"
          >
            {submitDisabled ? 'Sending...' : 'Get Instant Quote'}
          </Button>
        </div>
      </div>
    </aside>
  );
}


