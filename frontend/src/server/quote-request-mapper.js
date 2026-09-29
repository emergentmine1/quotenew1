// Turns the quote form into the backend's QuoteRequestPayload
// (tx_quoterequest + tx_quoterequestdetails + tx_quoteaccessorialservices).
// The form already holds backend codes. Weights are sent in KG, dimensions in CM and volumes in CBM.

import { LOCATION_DOOR, RATING_TOTAL } from '@/lib/quote-codes';

const KG_PER_LB = 0.453592;
const CM_PER_IN = 2.54;
const CFT_PER_CBM = 35.3147;
const AIR_VOLUMETRIC_KG_PER_CBM = 167;
const MAX_COMMODITY_LENGTH = 256;

const toKg = (value, unit) => (unit === 'LB' ? (Number(value) || 0) * KG_PER_LB : Number(value) || 0);
const toCm = (value, unit) => (unit === 'IN' ? (Number(value) || 0) * CM_PER_IN : Number(value) || 0);
const round = (value, digits = 4) => Number((Number(value) || 0).toFixed(digits));
const commodityText = (text) => (text || 'General cargo').slice(0, MAX_COMMODITY_LENGTH);
const toDateTime = (isoDate) => (isoDate ? `${isoDate}T00:00:00` : null);

// Door pickup or delivery needs an address. The city or zip text the user entered is address line 1,
// and a picked suggestion also fills city, state and zip code.
function doorAddress(location, isDoor) {
  if (!isDoor) return {};
  return {
    address1: location.address || undefined,
    city: location.city || undefined,
    state: location.state || undefined,
    postalCode: location.postalCode || undefined,
  };
}

// Totals come straight from what the user entered, converted once to KG and CBM.
// Going through the pound and cubic foot totals shown on screen would add rounding, for example 299.9999 KG.
function totalsFrom(form) {
  const { calcMode, units, totalShipment, weightUnit, dimUnit } = form;
  if (calcMode === RATING_TOTAL) {
    const volume = Number(totalShipment.volume) || 0;
    return {
      weightKg: toKg(totalShipment.weight, weightUnit),
      volumeCbm: dimUnit === 'CM' ? volume : volume / CFT_PER_CBM,
    };
  }

  let weightKg = 0;
  let volumeCbm = 0;
  for (const unit of units) {
    const count = Number(unit.units) || 0;
    const cubicCm = toCm(unit.length, dimUnit) * toCm(unit.width, dimUnit) * toCm(unit.height, dimUnit);
    weightKg += toKg(unit.weight, weightUnit) * count;
    volumeCbm += (cubicCm / 1_000_000) * count;
  }
  return { weightKg, volumeCbm };
}

function lineItemsFrom(form, defaults) {
  const { quote, calcMode, units, totalShipment, weightUnit, dimUnit } = form;
  const { weightUom, dimensionUom, volumeUom } = defaults;

  if (calcMode === RATING_TOTAL) {
    const volume = Number(totalShipment.volume) || 0;
    return [
      {
        commodity: commodityText(quote.commodity),
        quantity: 1,
        grossWeight: round(toKg(totalShipment.weight, weightUnit)),
        grossWeightUom: weightUom,
        volume: round(dimUnit === 'CM' ? volume : volume / CFT_PER_CBM),
        volumeUom,
        dimensionUom,
        isHazmat: Boolean(quote.flags.hazardous),
        isStackable: Boolean(quote.flags.stackable),
      },
    ];
  }

  return units.map((unit) => ({
    commodity: commodityText(unit.commodity || quote.commodity),
    quantity: Number(unit.units) || 1,
    packageType: unit.packageType,
    grossWeight: round(toKg(unit.weight, weightUnit)),
    grossWeightUom: weightUom,
    length: round(toCm(unit.length, dimUnit)),
    width: round(toCm(unit.width, dimUnit)),
    height: round(toCm(unit.height, dimUnit)),
    dimensionUom,
    isHazmat: Boolean(unit.hazardous),
    isStackable: Boolean(quote.flags.stackable),
  }));
}

/**
 * @param form    { quote, contact, calcMode, units, totalShipment, weightUnit, dimUnit } from the quote form
 * @param options result of loadFormOptions()
 */
export function toQuoteRequestPayload(form, options) {
  const { quote, contact, calcMode } = form;
  const { defaults } = options;

  const originIsDoor = quote.originType === LOCATION_DOOR;
  const destinationIsDoor = quote.destinationType === LOCATION_DOOR;

  const { weightKg, volumeCbm } = totalsFrom(form);
  const chargeableKg = Math.max(weightKg, volumeCbm * AIR_VOLUMETRIC_KG_PER_CBM);
  const pickup = doorAddress(quote.origin, originIsDoor);
  const delivery = doorAddress(quote.destination, destinationIsDoor);

  return {
    mode: quote.shippingMode,
    cargoType: quote.cargoType,
    ratingType: calcMode,
    pickupType: quote.originType,
    originPortCode: quote.origin.code,
    pickupAddress1: pickup.address1,
    pickupCity: pickup.city,
    pickupState: pickup.state,
    pickupPostalCode: pickup.postalCode,
    pickupCountryCode: quote.origin.countryCode,
    deliveryType: quote.destinationType,
    destinationPortCode: quote.destination.code,
    deliveryAddress1: delivery.address1,
    deliveryCity: delivery.city,
    deliveryState: delivery.state,
    deliveryPostalCode: delivery.postalCode,
    deliveryCountryCode: quote.destination.countryCode,
    weightUom: defaults.weightUom,
    dimensionUom: defaults.dimensionUom,
    totalGrossWeight: round(weightKg),
    totalGrossWeightUom: defaults.weightUom,
    totalVolume: round(volumeCbm),
    totalVolumeUom: defaults.volumeUom,
    totalChargeableWeight: round(chargeableKg),
    totalChargeableWeightUom: defaults.weightUom,
    cargoReadyDate: toDateTime(quote.readyDate),
    requiredDeliveryDate: toDateTime(quote.requiredDeliveryDate),
    fullName: contact.fullName,
    companyName: contact.company,
    isCommercialCustomer: Boolean(quote.commercialCustomer),
    email: contact.email,
    isConsentEmail: Boolean(quote.customerEmailConsent),
    phone: contact.phone || undefined,
    jobTitle: contact.jobTitle || undefined,
    address: contact.addressDisplay || undefined,
    countryCode: contact.countryCode || undefined,
    lineItems: lineItemsFrom(form, defaults),
    accessorialServices: quote.services,
  };
}
