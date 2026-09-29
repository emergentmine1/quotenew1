'use client';

import { AlertTriangle } from 'lucide-react';
import StatusPage, { primaryButtonClass } from '@/components/StatusPage';

// Shown when a page fails to render. Next.js logs the error on the server and
// passes only a digest here, so no internal detail reaches the browser.
export default function Error({ reset }) {
  return (
    <StatusPage
      icon={AlertTriangle}
      iconClassName="text-amber-500"
      title="Something went wrong"
      message="This page could not be loaded. Please try again in a few minutes."
    >
      <button type="button" onClick={reset} className={primaryButtonClass}>
        Try again
      </button>
    </StatusPage>
  );
}
