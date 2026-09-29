import Link from 'next/link';
import BrandLogo from '@/components/BrandLogo';

/** Shared layout for the confirmation, error and not found pages. */
export default function StatusPage({ icon: Icon, iconClassName, title, message, children }) {
  return (
    <div className="min-h-screen bg-gradient-to-b from-[#EAF3FF] via-white to-white">
      <header className="border-b border-slate-100 bg-white/85">
        <div className="max-w-[1400px] mx-auto h-16 px-6 flex items-center">
          <Link href="/instant-quote">
            <BrandLogo className="h-10 w-auto" />
          </Link>
        </div>
      </header>

      <main className="max-w-xl mx-auto px-6 py-20 text-center">
        <Icon className={`mx-auto h-14 w-14 ${iconClassName}`} />
        <h1 className="mt-6 text-3xl font-black tracking-tight text-[#0B2545]">{title}</h1>
        <p className="mt-3 text-slate-600">{message}</p>
        {children}
      </main>
    </div>
  );
}

export const primaryButtonClass =
  'mt-10 inline-flex h-12 items-center rounded-xl bg-[#0B2545] px-6 font-semibold text-white hover:bg-[#143a6b]';
