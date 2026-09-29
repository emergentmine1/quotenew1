function randomDigitString(length) {
  let output = '';
  for (let idx = 0; idx < length; idx += 1) {
    output += Math.floor(Math.random() * 10);
  }
  return output;
}

export function generateQuoteNumber(usedNumbers = new Set()) {
  let attempts = 0;
  while (attempts < 5000) {
    const quoteNumber = `6${randomDigitString(6)}`;
    if (!usedNumbers.has(quoteNumber)) return quoteNumber;
    attempts += 1;
  }
  throw new Error('Unable to generate a unique quote number');
}

export function withQuoteNumbers(offers, getKey = (offer) => offer?.id, quoteNumberMap = new Map()) {
  const used = new Set(quoteNumberMap.values());

  return (offers || []).map((offer) => {
    const key = getKey(offer);
    const existing = quoteNumberMap.get(key);
    if (existing) {
      return { ...offer, quoteNumber: existing };
    }

    const quoteNumber = generateQuoteNumber(used);
    quoteNumberMap.set(key, quoteNumber);
    used.add(quoteNumber);
    return { ...offer, quoteNumber };
  });
}

