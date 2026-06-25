import Link from 'next/link';

export function Logo({ size = 'md' }: { size?: 'sm' | 'md' | 'lg' }) {
  const text = size === 'lg' ? 'text-3xl sm:text-4xl' : size === 'sm' ? 'text-lg' : 'text-2xl';
  return (
    <Link href="/" className="inline-flex items-center gap-2 font-display font-bold">
      <span aria-hidden className="text-[1.4em]">🌊</span>
      <span className={`grad-text ${text}`}>LoveDistance</span>
    </Link>
  );
}
