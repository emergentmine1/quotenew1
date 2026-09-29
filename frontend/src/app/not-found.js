import Link from 'next/link';
import { SearchX } from 'lucide-react';
import StatusPage, { primaryButtonClass } from '@/components/StatusPage';

export const metadata = {
  title: 'Page not found | KWE Instant Quote',
};

export default function NotFound() {
  return (
    <StatusPage
      icon={SearchX}
      iconClassName="text-slate-400"
      title="Page not found"
      message="The page you are looking for does not exist."
    >
      <Link href="/instant-quote" className={primaryButtonClass}>
        Go to Instant Quote
      </Link>
    </StatusPage>
  );
}
