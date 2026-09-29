'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import BrandLogo from '@/components/BrandLogo';
import {
  Anchor,
  ArrowLeft,
  ArrowRight,
  ArrowDownUp,
  Plane,
  Truck,
  Clock,
  Leaf,
  Star,
  Shield,
  FileCheck,
  CheckCircle2,
  Filter,
  Calendar,
  Sparkles,
  MapPin,
  ChevronDown,
  Download,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { cn } from '@/lib/utils';
import { providers as allProviders, airports as airportList, ports as portList } from '@/lib/mock-data';
import {
  AIR_DESTINATIONS as ENGINE_AIRPORTS,
  AIRLINES as ENGINE_AIRLINES,
  OCEAN_CARRIERS as ENGINE_CARRIERS,
} from '@/lib/pricing-data';
import {
  calculateQuote,
  listEligibleAirMatrices,
} from '@/lib/pricing-engine';
import Flag from '@/components/Flag';
import { toast } from 'sonner';
import { downloadQuotePdf } from '@/lib/quote-pdf';
import { CURRENCIES, formatMoney } from '@/lib/currency';
import NoRateFound from '@/views/NoRateFound';
import LoadingState from '@/components/LoadingState';
import { withQuoteNumbers } from '@/lib/quote-number';

// Brand colors per carrier so the cards stay visually consistent with KWE.
const CARRIER_COLORS = {
  // Ocean carriers
  MSK: { bg: '#42B0D5', text: '#FFFFFF' },
  KN: { bg: '#005A9C', text: '#FFFFFF' },
  DSV: { bg: '#0066B3', text: '#FFFFFF' },
  DBS: { bg: '#E2001A', text: '#FFFFFF' },
  YSL: { bg: '#003366', text: '#FFFFFF' },
  DHL: { bg: '#FFCC00', text: '#0F172A' },
  CMA: { bg: '#E30613', text: '#FFFFFF' },
  GDS: { bg: '#0033A0', text: '#FFFFFF' },
  // Airlines
  KE: { bg: '#00256C', text: '#FFFFFF' },
  NH: { bg: '#13294B', text: '#FFFFFF' },
  CI: { bg: '#B11D33', text: '#FFFFFF' },
  JL: { bg: '#A0122E', text: '#FFFFFF' },
  AA: { bg: '#0078D2', text: '#FFFFFF' },
  BR: { bg: '#155F50', text: '#FFFFFF' },
  SQ: { bg: '#0C2340', text: '#FFFFFF' },
  CX: { bg: '#006564', text: '#FFFFFF' },
};
const FALLBACK_COLOR = { bg: '#475569', text: '#FFFFFF' };

const MODE_ICONS = { air: Plane, road: Truck };

// Build offers by querying the KWE pricing engine.
// Each eligible matrix becomes one offer card — the engine returns the
// applied break, base cost, surcharges, and total cost directly.
function buildOffers(payload) {
  if (!payload || payload.services?.hazardous) return [];
  const { origin, destination, shipmentTotals } = payload;
  const offers = [];

  const weightKg = (shipmentTotals?.lb || 0) / 2.20462;
  const cbm = (shipmentTotals?.cft || 0) / 35.3147;

  const airDest = resolveAirDestination(destination);
  const airOrigin = resolveAirDestination(origin) || origin;

  if (airDest) {
    const eligible = listEligibleAirMatrices({ destination: airDest });

    eligible.forEach((m, idx) => {
      const r = calculateQuote({
        mode: 'air',
        destination: airDest,
        carrier: m.airlineCode,
        serviceType: m.serviceType,
        weight: Math.max(weightKg, 45),
      });
      if (r.matrix && !r.error) {
        offers.push(toOfferCard(r, idx, airOrigin, destination, 'air', weightKg, cbm));
      }
    });
  }
  return offers;
}

function resolveAirDestination(loc) {
  if (!loc?.code) return null;
  // Direct hit (user picked from air list)
  if (ENGINE_AIRPORTS.find((d) => d.code === loc.code)) return loc.code;
  // City match (e.g. user picked CNSHA seaport for Shanghai → look up PVG)
  const match = ENGINE_AIRPORTS.find((d) => d.city?.toLowerCase() === (loc.city || '').toLowerCase());
  return match?.code || null;
}

const KWE_SERVICE_LABELS = {
  'KWE Express': 'KWE Express (Lead Time 4 days)',
  'KWE Standard': 'KWE Regular (Lead Time 5 days)',
  'KWE Economy': 'KWE Economy (Lead Time 6 days)',
};

function toOfferCard(result, idx, origin, destination, mode, weightKg, cbm) {
  const isAir = mode === 'air';
  const m = result.matrix;
  const carrierCode = isAir ? m.airlineCode : m.carrierCode;
  // R8: replace raw airline / ocean carrier names with configurable KWE service names.
  // Air service tiers map to KWE Express / Standard / Economy based on the underlying matrix serviceType.
  const kweServiceNameRaw = isAir
    ? (m.serviceType === 'Express' ? 'KWE Express'
      : m.serviceType === 'Economy' ? 'KWE Economy'
      : 'KWE Standard')
    : (mode === 'fcl' ? 'KWE Ocean FCL Service' : 'KWE Ocean LCL Service');
  const kweServiceName = KWE_SERVICE_LABELS[kweServiceNameRaw] || kweServiceNameRaw;
  const kweServiceCode = isAir
    ? (m.serviceType === 'Express' ? 'KWE-EXP'
      : m.serviceType === 'Economy' ? 'KWE-ECO'
      : 'KWE-STD')
    : (mode === 'fcl' ? 'KWE-OCE-FCL' : 'KWE-OCE-LCL');
  const colors = CARRIER_COLORS[carrierCode] || FALLBACK_COLOR;
  const sailDate = new Date(Date.now() + (3 + (idx % 6)) * 86400000);
  const transit = isAir ? 4 + (idx % 5) : mode === 'fcl' ? 22 + (idx % 12) : 18 + (idx % 14);
  const arrivalDate = new Date(sailDate.getTime() + transit * 86400000);
  return {
    // Keep matrixId for business references, but make offer card ids unique per result row.
    id: `${m.id}-${idx + 1}`,
    matrixId: m.id,
    matrixVersion: m.version,
    providerName: kweServiceName,                 // R8: KWE Service Name (not airline)
    providerCode: kweServiceCode,
    providerColor: colors.bg,
    providerTextColor: colors.text,
    reliability: parseFloat((4.4 + ((idx * 7) % 6) / 10).toFixed(1)),
    mode,
    serviceType: kweServiceName,
    transit,
    price: result.totalCost,
    baseCost: result.baseCost,
    totalSurcharges: result.totalSurcharges,
    currency: result.currency,
    sailDate: sailDate.toISOString().split('T')[0],
    arrivalDate: arrivalDate.toISOString().split('T')[0],
    co2: isAir ? Math.round(weightKg * 2.1) : Math.round(cbm * 350),
    flightNumber: isAir ? m.airlineFlightCode : null,
    vesselName: !isAir ? `${carrierCode} ${['HORIZON', 'PIONEER', 'VOYAGER', 'NAVIGATOR', 'ENDEAVOR'][idx % 5]}` : null,
    features: [
      result.surcharges?.length ? `${result.surcharges.length} surcharges applied` : null
    ].filter(Boolean),
    origin: isAir
      ? { code: m.origin || origin.code, city: origin.city, country: origin.country, countryCode: origin.countryCode }
      : { code: m.originPort, city: m.originCity, country: m.originCountry, countryCode: m.originCountryCode },
    destination: isAir
      ? { code: m.destination, city: m.destinationCity, country: m.destinationCountry, countryCode: m.destinationCountryCode }
      : { code: m.destinationPort, city: m.destinationCity, country: m.destinationCountry, countryCode: m.destinationCountryCode },
    breakdown: result.breakdown,
    charges: result.charges,
    surcharges: result.surcharges,
    appliedBreak: result.appliedBreak,
  };
}

export default function InstantQuoteResults() {
  const router = useRouter();
  const [payload, setPayload] = useState(null);
  const [sort, setSort] = useState('price-asc');
  const [priceRange, setPriceRange] = useState([0, 50000]);
  const [carriers, setCarriers] = useState([]);
  const [maxTransit, setMaxTransit] = useState(60);
  const [currency, setCurrency] = useState('USD');
  const [hazmatLoading, setHazmatLoading] = useState(false);
  const quoteNumberMapRef = useRef(new Map());

  useEffect(() => {
    const raw = sessionStorage.getItem('iq_payload');
    if (!raw) {
      router.push('/instant-quote');
      return;
    }
    setPayload(JSON.parse(raw));
  }, [router]);

  const offers = useMemo(
    () => withQuoteNumbers(buildOffers(payload), (offer) => `${offer.mode}-${offer.id}`, quoteNumberMapRef.current),
    [payload]
  );

  useEffect(() => {
    if (!payload?.services?.hazardous) {
      setHazmatLoading(false);
      return undefined;
    }

    setHazmatLoading(true);
    const timer = setTimeout(() => setHazmatLoading(false), 1400);
    return () => clearTimeout(timer);
  }, [payload]);

  const minPrice = useMemo(() => (offers.length ? Math.min(...offers.map((o) => o.price)) : 0), [offers]);
  const maxPrice = useMemo(() => (offers.length ? Math.max(...offers.map((o) => o.price)) : 50000), [offers]);

  useEffect(() => {
    if (offers.length) setPriceRange([minPrice, maxPrice]);
  }, [minPrice, maxPrice, offers.length]);

  const filtered = useMemo(() => {
    let list = offers.filter((o) => (
      o.price >= priceRange[0] &&
      o.price <= priceRange[1] &&
      o.transit <= maxTransit &&
      (carriers.length === 0 || carriers.includes(o.providerCode))
    ));
    switch (sort) {
      case 'price-asc': list = list.sort((a, b) => a.price - b.price); break;
      case 'price-desc': list = list.sort((a, b) => b.price - a.price); break;
      case 'transit-asc': list = list.sort((a, b) => a.transit - b.transit); break;
      case 'reliability-desc': list = list.sort((a, b) => b.reliability - a.reliability); break;
      case 'co2-asc': list = list.sort((a, b) => a.co2 - b.co2); break;
      default: break;
    }
    return list;
  }, [offers, priceRange, carriers, maxTransit, sort]);

  const cheapest = useMemo(() => (filtered.length ? Math.min(...filtered.map((o) => o.price)) : null), [filtered]);
  const fastest = useMemo(() => (filtered.length ? Math.min(...filtered.map((o) => o.transit)) : null), [filtered]);
  const greenest = useMemo(() => (filtered.length ? Math.min(...filtered.map((o) => o.co2)) : null), [filtered]);

  const airOffers = useMemo(() => filtered.filter((o) => o.mode === 'air'), [filtered]);

  if (!payload) return null;

  const isHazardousGoods = Boolean(payload.services?.hazardous);

  // R2: No matching rate — render the "KWE Representative will contact you" panel.
 const noRatesFound = offers.length === 0;

  const summary = (() => {
    const { origin, destination, shipmentTotals, cargoMode, containers, readyDate } = payload;
    const cargoLabel = cargoMode === 'fcl'
      ? (containers && containers.length
        ? containers.map((c) => `${c.count} × ${c.type}`).join(' + ')
        : `${shipmentTotals.units} containers`)
      : `${shipmentTotals.units} units · ${shipmentTotals.cft.toFixed(1)} CFT · ${shipmentTotals.lb.toFixed(0)} LB`;
    return { origin, destination, cargoLabel, readyDate };
  })();

  const toggleCarrier = (code) =>
    setCarriers((arr) => (arr.includes(code) ? arr.filter((c) => c !== code) : [...arr, code]));

  const handleExportPdf = (offer) => {
    try {
      downloadQuotePdf(offer, payload);
      toast.success(`PDF downloaded for ${offer.providerName}`);
    } catch (e) {
      toast.error('Could not generate PDF. Please try again.');
    }
  };

  const handleBook = (offer) => {
    // Public quote tool: persist the selection; booking lives in the admin app.
    sessionStorage.setItem('kwe_selected_offer', JSON.stringify(offer));
    sessionStorage.setItem('kwe_selected_payload', JSON.stringify(payload));
    toast.success(`Selected: ${offer.providerName}`);
  };

  return (
    <div className="min-h-screen bg-[#F4F8FC] pb-16">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-white/85 backdrop-blur-md border-b border-slate-100">
        <div className="max-w-[1400px] mx-auto h-16 px-6 flex items-center justify-between">
         <Link href="/instant-quote" className="flex items-center gap-2.5">
                     <BrandLogo className="h-10 w-auto" />
                     <div>
                       <div className="text-[10px] uppercase tracking-[0.18em] text-slate-500 font-semibold mt-0.5">Instant Quote · Results</div>
                     </div>
                   </Link>
          <Button variant="outline" onClick={() => router.push('/instant-quote')} className="rounded-xl gap-1.5" data-testid="iq-edit-search">
            <ArrowLeft className="h-4 w-4" /> Edit search
          </Button>
        </div>
      </header>

      {/* Search summary banner */}
      <section className="bg-[#0B2545] text-white py-6">
        <div className="max-w-[1400px] mx-auto px-6 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="flex flex-wrap items-center gap-x-6 gap-y-3 text-sm">
            <div className="flex items-center gap-2.5">
              <Flag code={summary.origin.countryCode} size={22} />
              <div>
                <div className="font-mono text-[11px] text-[#5BB3FF]">{summary.origin.code}</div>
                <div className="text-sm font-semibold">{summary.origin.city}</div>
              </div>
              <ArrowRight className="h-4 w-4 mx-1 text-[#5BB3FF]" />
              <Flag code={summary.destination.countryCode} size={22} />
              <div>
                <div className="font-mono text-[11px] text-[#5BB3FF]">{summary.destination.code}</div>
                <div className="text-sm font-semibold">{summary.destination.city}</div>
              </div>
            </div>
            <div className="hidden md:block w-px h-8 bg-white/10" />
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-[#5BB3FF]" />
              <span>Ready {summary.readyDate}</span>
            </div>
            <div className="flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-[#5BB3FF]" />
              <span>{summary.cargoLabel}</span>
            </div>
          </div>
          {!noRatesFound && (
            <div className="flex items-center gap-4">
              <div className="text-xs text-slate-300">
                <span className="text-[#5BB3FF] font-bold">{offers.length}</span> live offers
                {airOffers.length > 0 && <span> · <span className="text-white font-bold">{airOffers.length}</span> air</span>}
              </div>
            </div>
          )}
        </div>
      </section>

      {/* Body */}
      <section className="max-w-[1400px] mx-auto px-6 py-8">
        <div
          className={
            noRatesFound
              ? "w-full"
              : "grid grid-cols-1 lg:grid-cols-[300px_1fr] gap-6"
          }
        >

          {/* Filters */}
          {!noRatesFound && (
            <aside className="bg-white rounded-2xl border border-slate-100 kwe-shadow p-5 h-fit lg:sticky lg:top-20">
            <div className="flex items-center gap-2 mb-5">
              <Filter className="h-4 w-4 text-[#1E6AE1]" />
              <h3 className="font-bold text-[#0B2545]">Refine Results</h3>
            </div>

            <div className="space-y-6">
              {/* Price */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <Label className="text-xs font-semibold uppercase tracking-widest text-slate-600">Price</Label>
                <span className="text-xs font-mono text-slate-700">${Math.round(priceRange[0]).toLocaleString('en-US')}–${Math.round(priceRange[1]).toLocaleString('en-US')}</span>
                </div>
                <Slider
                  data-testid="filter-price"
                  min={minPrice}
                  max={maxPrice}
                  step={50}
                  value={priceRange}
                  onValueChange={setPriceRange}
                />
              </div>

              {/* Transit */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <Label className="text-xs font-semibold uppercase tracking-widest text-slate-600">Max transit</Label>
                  <span className="text-xs font-mono text-slate-700">{maxTransit}d</span>
                </div>
                <Slider data-testid="filter-transit" min={3} max={10} step={1} value={[maxTransit]} onValueChange={(v) => setMaxTransit(v[0])} />
              </div>

              <button
                type="button"
                onClick={() => {
                  setPriceRange([minPrice, maxPrice]);
                  setMaxTransit(10);
                  setCarriers([]);
                  toast.info('Filters reset');
                }}
                data-testid="filter-reset"
                className="w-full text-xs font-semibold uppercase tracking-widest text-slate-600 hover:text-[#1E6AE1]"
              >
                Reset all filters
              </button>
            </div>
          </aside>
          )}

          {/* Results */}
          <div className="space-y-4">
           {!noRatesFound && (
           <>
             {/* Result header */}
             <div className="flex items-center justify-between gap-3 flex-wrap">
              <div>
                <h2 className="text-2xl font-black text-[#0B2545] tracking-tight">
                  {filtered.length} offer{filtered.length !== 1 ? 's' : ''} available
                </h2>
              </div>
              <div className="flex items-center gap-2">
                <ArrowDownUp className="h-4 w-4 text-slate-500" />
                <Select value={sort} onValueChange={setSort}>
                  <SelectTrigger data-testid="iq-sort" className="h-10 w-52 rounded-xl border-slate-200 bg-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="price-asc">Lowest price</SelectItem>
                    <SelectItem value="price-desc">Highest price</SelectItem>
                    <SelectItem value="transit-asc">Fastest transit</SelectItem>
                    <SelectItem value="reliability-desc">Highest reliability</SelectItem>
                    <SelectItem value="co2-asc">Lowest CO₂</SelectItem>
                  </SelectContent>
                </Select>
              </div>
             </div>
           </>
           )}


           {/* Offers - grouped by mode */}
           <div className="space-y-6">
            {noRatesFound ? (
              hazmatLoading ? (
                <LoadingState label="Searching for quotes. Please wait..." />
              ) : (
                <NoRateFound
                  status={isHazardousGoods ? 'HAZARDOUS_GOODS' : 'RATE_NOT_FOUND'}
                  inquiryRef="N/A"
                  origin={summary.origin}
                  destination={summary.destination}
                  commodity={payload.commodity}
                  cargoSummary={summary.cargoLabel}
                />
              )
            ) : filtered.length === 0 ? (
               <div className="bg-white rounded-2xl border border-dashed border-slate-200 py-16 text-center text-sm text-slate-500">
                 No offers match your filters. Try widening price or transit range.
               </div>
             ) : (
               <>
                 {airOffers.length > 0 && (
                   <ModeSection
                     mode="air"
                     offers={airOffers}
                     cheapest={cheapest}
                     fastest={fastest}
                     greenest={greenest}
                     currency={currency}
                     payload={payload}
                     onBook={(o) => handleBook(o)}
                     onExportPdf={(o) => handleExportPdf(o)}
                   />
                 )}
               </>
             )}
           </div>
          </div>
        </div>
      </section>

      <footer className="fixed bottom-0 left-0 right-0 z-30 border-t border-slate-100 bg-white py-4 text-center text-xs text-slate-400">
         © KWE Freight Network · Quotes are valid for 14 days from issuance
       </footer>
    </div>
  );
}

function ModeSection({ mode, offers, cheapest, fastest, greenest, currency, payload, onBook, onExportPdf }) {
  const isAir = mode === 'air';
  const Icon = isAir ? Plane : Ship;
  const title = isAir ? 'Air freight offers' : 'Ocean freight offers';
  const subtitle = isAir
    ? 'Faster transit · ideal for time-sensitive and high-value cargo'
    : 'Lowest cost per unit · ideal for bulk and non-urgent shipments';
  const accentBg = isAir ? 'bg-sky-50 text-sky-700 ring-sky-600/20' : 'bg-indigo-50 text-indigo-700 ring-indigo-600/20';
  const dotColor = isAir ? 'bg-sky-500' : 'bg-indigo-500';

  return (
    <div data-testid={`mode-section-${mode}`}>
      {/* Section header */}
      <div className="flex items-center gap-3 mb-3">
        <div className={cn('inline-flex items-center gap-2 px-3 py-1.5 rounded-full ring-1 ring-inset font-semibold text-xs uppercase tracking-widest', accentBg)}>
          <Icon className="h-3.5 w-3.5" />
          {isAir ? 'Air' : 'Ocean'}
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="font-bold text-[#0B2545]">{title}</h3>
          <p className="text-xs text-slate-500">{subtitle}</p>
        </div>
        <span className="text-xs font-bold text-slate-500">{offers.length} offer{offers.length !== 1 ? 's' : ''}</span>
      </div>

      <div className="space-y-3 relative">
        <div className={cn('absolute left-0 top-2 bottom-2 w-0.5 rounded-full', dotColor, 'opacity-15')} />
        {offers.map((o) => (
          <OfferCard
            key={`${o.mode}-${o.id}`}
            offer={o}
            isCheapest={o.price === cheapest}
            isFastest={o.transit === fastest}
            isGreenest={o.co2 === greenest}
            currency={currency}
            payload={payload}
            onBook={onBook}
            onExportPdf={onExportPdf}
          />
        ))}
      </div>
    </div>
  );
}

function OfferCard({ offer, isCheapest, isFastest, isGreenest, currency = 'USD', onBook, onExportPdf }) {
  const [showCharges, setShowCharges] = useState(false);
  const isAir = offer.mode === 'air';
  const ModeIcon = isAir ? Plane : Ship;
  const modeBadge = isAir
    ? { ring: 'ring-sky-500/40', bg: 'bg-sky-50', text: 'text-sky-700', accent: 'text-sky-500' }
    : { ring: 'ring-indigo-500/40', bg: 'bg-indigo-50', text: 'text-indigo-700', accent: 'text-indigo-500' };

  return (
    <div
      data-testid={`offer-${offer.id}`}
      className={cn(
        'group relative bg-white rounded-2xl border border-slate-100 p-5 md:p-6 transition-all duration-200 hover:-translate-y-0.5 kwe-shadow hover:shadow-[0_18px_40px_-16px_rgba(11,37,69,0.18)]',
        'ml-4' // leave room for the mode rail
      )}
    >
      {/* Mode strip on the left edge */}
      <div className={cn('absolute -left-1 top-5 bottom-5 w-1 rounded-full', isAir ? 'bg-sky-500' : 'bg-indigo-500')} />

      {/* Badges */}
      {(isCheapest || isFastest || isGreenest) && (
        <div className="absolute -top-2 left-5 flex gap-1.5 z-10">
          {isCheapest && <Badge color="emerald">Best price</Badge>}
          {isFastest && <Badge color="blue">Fastest</Badge>}
        </div>
      )}

      <div className="flex items-start justify-between gap-4 mb-4">
        <div className="min-w-0">
          <div className="font-bold text-sm text-[#0B2545] truncate">{offer.providerName}</div>
          <div className="flex items-center gap-1.5 mt-0.5 text-xs text-slate-500">
            <span className="font-semibold text-slate-700">{offer.providerCode}</span>
          </div>
        </div>
        <div className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-right">
          <div className="font-mono text-sm font-bold text-[#0B2545] whitespace-nowrap" data-testid={`quote-number-${offer.id}`}>
            Quote #: {offer.quoteNumber}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1.8fr)_minmax(0,1fr)_220px] gap-5 items-center">

        {/* Route timeline with flags */}
        <div className="flex items-center gap-3">
          <div className="text-center min-w-0">
            <Flag code={offer.origin.countryCode} size={22} className="mx-auto mb-1" />
            <div className="text-[10px] uppercase tracking-widest font-semibold text-slate-500">Depart</div>
            <div className="font-bold text-[#0B2545] text-sm mt-0.5">{offer.sailDate}</div>
            <div className="font-mono text-[11px] text-slate-500 mt-0.5">{offer.origin.code}</div>
          </div>
          <div className="flex-1 relative h-px bg-gradient-to-r from-slate-200 via-[#5BB3FF] to-slate-200">
            <div className={cn(
              'absolute left-1/2 -translate-x-1/2 -top-3 bg-white border rounded-full px-2 py-0.5 flex items-center gap-1 text-[10px] font-bold',
              isAir ? 'border-sky-200 text-sky-700' : 'border-indigo-200 text-indigo-700'
            )}>
              <ModeIcon className={cn('h-3 w-3', modeBadge.accent)} /> {offer.transit}d
            </div>
          </div>
          <div className="text-center min-w-0">
            <Flag code={offer.destination.countryCode} size={22} className="mx-auto mb-1" />
            <div className="text-[10px] uppercase tracking-widest font-semibold text-slate-500">Arrive</div>
            <div className="font-bold text-[#0B2545] text-sm mt-0.5">{offer.arrivalDate}</div>
            <div className="font-mono text-[11px] text-slate-500 mt-0.5">{offer.destination.code}</div>
          </div>
        </div>

        {/* Meta */}
        <div className="space-y-1.5 text-xs">
          <div className="flex items-center gap-1.5 text-slate-600">
            <Shield className="h-3.5 w-3.5 text-[#1E6AE1]" />
            <span className="font-semibold">14-day price validity</span>
          </div>
        </div>

        {/* Price + CTA */}
        <div className="flex items-center justify-between lg:flex-col lg:items-end gap-3">
          <div className="lg:text-right">
            <div className="text-2xl font-black tracking-tight text-[#0B2545]">{formatMoney(offer.price, currency, { digits: 0 })}</div>
            <div className="text-[11px] text-slate-500">{currency}{currency !== offer.currency ? ` · from ${offer.currency}` : ''}</div>
          </div>
          <div className="flex flex-col gap-1.5 w-full lg:w-auto">
            <Button
              data-testid={`book-${offer.id}`}
              onClick={() => {
                sessionStorage.setItem('kwe_selected_offer', JSON.stringify(offer));
                sessionStorage.setItem('kwe_selected_payload', JSON.stringify({}));
                toast.success(`Selected: ${offer.providerName}`);
              }}
              className="bg-[#1E6AE1] hover:bg-[#1758c2] text-white font-semibold rounded-xl gap-1.5 active:scale-95 transition-all"
            >
              Select
            </Button>
          </div>
        </div>
      </div>

      <div className="mt-4 pt-4 border-t border-slate-100 flex flex-wrap items-center gap-1.5">
        {offer.features.map((f) => (
          <span key={f} className="text-[10px] uppercase tracking-widest font-semibold px-2 py-0.5 rounded-md bg-slate-100 text-slate-600 inline-flex items-center gap-1">
            <CheckCircle2 className="h-3 w-3 text-[#1E6AE1]" /> {f}
          </span>
        ))}
        <button
          type="button"
          onClick={() => setShowCharges((v) => !v)}
          data-testid={`toggle-charges-${offer.id}`}
          className="ml-auto text-xs font-bold text-[#1E6AE1] hover:text-[#0B2545] inline-flex items-center gap-1"
        >
          {showCharges ? 'Hide' : 'View'} charge details
          <ChevronDown className={cn('h-3.5 w-3.5 transition-transform', showCharges && 'rotate-180')} />
        </button>
      </div>

      {showCharges && offer.charges && (
        <ChargesPanel charges={offer.charges} origin={offer.origin} destination={offer.destination} displayCurrency={currency} sourceCurrency={offer.currency} />
      )}
    </div>
  );
}

function ChargesPanel({ charges, origin, destination, displayCurrency, sourceCurrency }) {
  const sum = (rows) => rows.reduce((a, r) => a + (r.amount || 0), 0);
  const originSub = sum(charges.origin || []);
  const freightSub = sum(charges.freight || []);
  const destSub = sum(charges.destination || []);

  return (
    <div data-testid="charges-panel" className="mt-4 pt-4 border-t border-slate-100 space-y-4">
      <ChargeSection title="Origin Charges" rows={charges.origin} subtotal={originSub} currency={displayCurrency} testId="charges-origin" />
      <ChargeSection
        title={`Freight (${origin?.code || 'origin'} → ${destination?.code || 'destination'})`}
        rows={charges.freight}
        subtotal={freightSub}
        currency={displayCurrency}
        testId="charges-freight"
        highlight
      />
      <ChargeSection title="Destination Charges" rows={charges.destination} subtotal={destSub} currency={displayCurrency} testId="charges-destination" />
    </div>
  );
}

function ChargeSection({ title, rows = [], subtotal, currency, testId, highlight }) {
  return (
    <div data-testid={testId} className={cn('rounded-xl overflow-hidden border', highlight ? 'border-[#1E6AE1]/25' : 'border-slate-100')}>
      <div className={cn('px-3 py-2 flex items-center justify-between', highlight ? 'bg-[#EAF3FF]' : 'bg-slate-50')}>
        <div className="text-xs font-bold uppercase tracking-widest text-[#0B2545]">{title}</div>
        <div className="text-xs font-semibold text-slate-500">{rows.length} charge{rows.length !== 1 ? 's' : ''}</div>
      </div>
      {rows.length === 0 ? (
        <div className="px-3 py-3 text-xs text-slate-400 italic">No charges in this section.</div>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full text-xs">
            <thead className="bg-white">
              <tr className="text-left text-[10px] uppercase tracking-widest text-slate-500">
                <th className="px-3 py-2 font-semibold">Charges</th>
                <th className="px-3 py-2 font-semibold">Comment</th>
                <th className="px-3 py-2 font-semibold text-right">Units</th>
                <th className="px-3 py-2 font-semibold text-right">Unit price</th>
                <th className="px-3 py-2 font-semibold text-right">Amount</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {rows.map((r, i) => (
                <tr key={`${r.code}-${i}`} className="hover:bg-slate-50/60">
                  <td className="px-3 py-2 text-slate-700">{r.name}</td>
                  <td className="px-3 py-2 text-slate-500">{r.comment}</td>
                  <td className="px-3 py-2 text-right font-mono text-slate-700">{typeof r.units === 'number' ? r.units.toLocaleString('en-US') : r.units}</td>
                  <td className="px-3 py-2 text-right font-mono text-slate-700">{formatMoney(r.unitPrice, currency)}</td>
                  <td className="px-3 py-2 text-right font-mono font-bold text-[#0B2545]">{formatMoney(r.amount, currency)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      <div className="px-3 py-2 flex items-center justify-end gap-3 border-t border-slate-100 bg-white">
        <span className="text-[11px] uppercase tracking-widest font-semibold text-slate-500">Subtotal</span>
        <span className="font-mono font-black text-[#0B2545]">{formatMoney(subtotal, currency)} {currency}</span>
      </div>
    </div>
  );
}

function Badge({ color, children }) {
  const colors = {
    emerald: 'bg-emerald-500 text-white',
    blue: 'bg-[#1E6AE1] text-white',
    teal: 'bg-teal-500 text-white',
  };
  return (
    <span className={cn('text-[10px] uppercase tracking-widest font-bold px-2 py-0.5 rounded-md shadow-sm', colors[color])}>
      {children}
    </span>
  );
}
