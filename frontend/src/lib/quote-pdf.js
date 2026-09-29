// KWE Quote PDF exporter
// Uses jsPDF + autotable to render a branded, shareable PDF of a single offer
// including the 3-section charge breakdown (Origin / Freight / Destination).

import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

const NAVY = [11, 37, 69]; // #0B2545
const GOLD = [212, 175, 55]; // #D4AF37
const SLATE_600 = [71, 85, 105];
const SLATE_100 = [241, 245, 249];

function fmtMoney(n, currency = 'USD') {
  const v = Number(n || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  return `${v} ${currency}`;
}

function sectionTotal(rows = []) {
  return rows.reduce((a, r) => a + (r.amount || 0), 0);
}

export function downloadQuotePdf(offer, payload) {
  const doc = new jsPDF({ unit: 'pt', format: 'a4' });
  const pageW = doc.internal.pageSize.getWidth();
  const marginX = 40;
  const currency = offer.currency || 'USD';

  // ------ Header band ------
  doc.setFillColor(...NAVY);
  doc.rect(0, 0, pageW, 90, 'F');

  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(22);
  doc.text('KWE', marginX, 40);
  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(212, 175, 55);
  doc.text('FREIGHT NETWORK · INSTANT QUOTE', marginX, 55);

  // Quote meta on right
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(9);
  doc.text(`Quote ID: ${offer.matrixId || offer.id}`, pageW - marginX, 40, { align: 'right' });
  doc.text(`Issued: ${new Date().toISOString().split('T')[0]}`, pageW - marginX, 55, { align: 'right' });
  doc.text(`Valid for: 14 days`, pageW - marginX, 70, { align: 'right' });

  // ------ Lane summary ------
  let y = 120;
  doc.setTextColor(...NAVY);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(16);
  doc.text(`${offer.origin?.city || offer.origin?.code}  →  ${offer.destination?.city || offer.destination?.code}`, marginX, y);
  y += 18;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.setTextColor(...SLATE_600);
  const meta = [
    `${offer.serviceType || (offer.mode === 'air' ? 'Air freight' : 'Ocean freight')}`,
    `Provider: ${offer.providerName}`,
    `${offer.transit} days door-to-door`,
    `Depart ${offer.sailDate} · Arrive ${offer.arrivalDate}`,
  ];
  doc.text(meta.join('    ·    '), marginX, y);

  // ------ Cargo box ------
  y += 20;
  doc.setDrawColor(...SLATE_100);
  doc.setFillColor(248, 250, 252);
  doc.roundedRect(marginX, y, pageW - marginX * 2, 60, 6, 6, 'FD');
  doc.setTextColor(...NAVY);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.text('SHIPMENT', marginX + 14, y + 20);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.setTextColor(...SLATE_600);
  const cargoLabel = payload?.cargoMode === 'fcl'
    ? (payload.containers?.map((c) => `${c.count} × ${c.type}`).join(' + ') || 'Container load')
    : `${payload?.shipmentTotals?.units || 0} units · ${(payload?.shipmentTotals?.cft || 0).toFixed(1)} CFT · ${(payload?.shipmentTotals?.lb || 0).toFixed(0)} LB`;
  doc.text(cargoLabel, marginX + 14, y + 38);
  doc.text(`Ready date: ${payload?.readyDate || '—'}`, marginX + 14, y + 52);

  // ------ Charges ------
  y += 80;
  const charges = offer.charges || { origin: [], freight: [], destination: [] };
  const sections = [
    { title: 'Origin Charges', rows: charges.origin, highlight: false },
    { title: `Freight (${offer.origin?.code} → ${offer.destination?.code})`, rows: charges.freight, highlight: true },
    { title: 'Destination Charges', rows: charges.destination, highlight: false },
  ];

  for (const sec of sections) {
    // Section title
    if (y > 720) { doc.addPage(); y = 60; }
    doc.setFillColor(sec.highlight ? 234 : 248, sec.highlight ? 243 : 250, sec.highlight ? 255 : 252);
    doc.rect(marginX, y, pageW - marginX * 2, 22, 'F');
    doc.setTextColor(...NAVY);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.text(sec.title.toUpperCase(), marginX + 10, y + 15);
    doc.text(`${sec.rows.length} charge${sec.rows.length !== 1 ? 's' : ''}`, pageW - marginX - 10, y + 15, { align: 'right' });
    y += 22;

    if (sec.rows.length === 0) {
      doc.setFont('helvetica', 'italic');
      doc.setTextColor(...SLATE_600);
      doc.setFontSize(9);
      doc.text('No charges in this section.', marginX + 10, y + 14);
      y += 22;
    } else {
      autoTable(doc, {
        startY: y,
        margin: { left: marginX, right: marginX },
        head: [['Fee code', 'Fee name', 'Comment', 'Units', 'Unit price', 'Amount']],
        body: sec.rows.map((r) => [
          r.code,
          r.name,
          r.comment,
          typeof r.units === 'number' ? r.units.toLocaleString('en-US') : r.units,
          fmtMoney(r.unitPrice, currency),
          fmtMoney(r.amount, currency),
        ]),
        theme: 'striped',
        styles: { fontSize: 8, cellPadding: 5 },
        headStyles: { fillColor: [255, 255, 255], textColor: SLATE_600, fontStyle: 'bold', lineWidth: { bottom: 0.5 }, lineColor: [226, 232, 240] },
        alternateRowStyles: { fillColor: [252, 253, 254] },
        columnStyles: {
          0: { fontStyle: 'bold', textColor: NAVY, cellWidth: 60 },
          3: { halign: 'right' },
          4: { halign: 'right' },
          5: { halign: 'right', fontStyle: 'bold', textColor: NAVY },
        },
      });
      y = doc.lastAutoTable.finalY;
    }

    // Subtotal
    const sub = sectionTotal(sec.rows);
    doc.setDrawColor(226, 232, 240);
    doc.line(marginX, y, pageW - marginX, y);
    doc.setTextColor(...SLATE_600);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.text('SUBTOTAL', pageW - marginX - 120, y + 14, { align: 'right' });
    doc.setTextColor(...NAVY);
    doc.text(fmtMoney(sub, currency), pageW - marginX - 10, y + 14, { align: 'right' });
    y += 30;
  }

  // ------ Grand total ------
  if (y > 720) { doc.addPage(); y = 60; }
  doc.setFillColor(...NAVY);
  doc.roundedRect(marginX, y, pageW - marginX * 2, 44, 6, 6, 'F');
  doc.setTextColor(...GOLD);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.text('ALL-IN TOTAL', marginX + 14, y + 20);
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(16);
  doc.text(fmtMoney(offer.price, currency), pageW - marginX - 14, y + 28, { align: 'right' });

  // Footer
  y = doc.internal.pageSize.getHeight() - 40;
  doc.setTextColor(...SLATE_600);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.text(`© KWE Freight Network · Rates are all-in including fuel & security surcharges · Matrix ${offer.matrixId} v${offer.matrixVersion || 1}`, marginX, y);

  const safeCarrier = (offer.providerCode || 'KWE').replace(/[^A-Z0-9]/gi, '');
  doc.save(`KWE-Quote-${offer.origin?.code || 'ORG'}-${offer.destination?.code || 'DST'}-${safeCarrier}.pdf`);
}
