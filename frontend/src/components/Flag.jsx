import { cn } from '@/lib/utils';

// Country flag served from local files (public/flags/{cc}.png), no CDN.
export default function Flag({ code, size = 20, className }) {
  if (!code) return null;
  const cc = code.toLowerCase();
  const w = size;
  const h = Math.round(size * 0.75);
  return (
    <img
      src={`/flags/${cc}.png`}
      width={w}
      height={h}
      alt={code}
      loading="lazy"
      className={cn('inline-block rounded-[3px] shadow-[0_0_0_1px_rgba(15,23,42,0.06)] object-cover shrink-0', className)}
      style={{ width: w, height: h }}
    />
  );
}
