/**
 * R2 · No Rate Found / Manual Review screen.
 * Displayed when the pricing engine returns 0 matching rate cells,
 * OR when the inquiry requires manual sales review (e.g. weight > 1000kg, sensitive commodity).
 */
export default function NoRateFound({
  inquiryRef,
  origin,
  destination,
  commodity,
  cargoSummary,
  status = 'RATE_NOT_FOUND',
}) {
  const isHazardous = status === 'HAZARDOUS_GOODS';
  const isManual = status === 'MANUAL_REVIEW_REQUIRED';
  const reason = isHazardous
    ? 'KWE Sales Representative will contact you.'
    : isManual
      ? 'Your shipment needs a manual review by a KWE Representative'
      : 'No published rate matches this lane';
  const headline = isHazardous
    ? 'No matched quotes are available now.'
    : 'A KWE Representative will contact you directly.';

return (
  <section className="w-full min-h-[52vh] flex flex-col items-center justify-center text-center" data-testid="no-rate-panel">
    <h1 className="text-4xl md:text-5xl font-normal text-black mb-6" data-testid="no-rate-title">
      {headline}
    </h1>
    <p className="text-4xl md:text-5xl font-normal text-black">
      {reason}
    </p>
  </section>
);
}
