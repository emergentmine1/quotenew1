'use client';

import { useState } from 'react';

export default function BrandLogo({
  className = 'h-10 w-auto',
  alt = 'KWE Global Logistics Partner',
}) {
  const [src] = useState('/Kwe-logo.png');

  return <img src={src} alt={alt} className={className} draggable={false} />;
}
