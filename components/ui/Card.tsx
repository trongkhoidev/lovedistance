import { forwardRef, type HTMLAttributes } from 'react';

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  padded?: boolean;
}

export const Card = forwardRef<HTMLDivElement, CardProps>(function Card(
  { padded = true, className = '', children, ...props },
  ref
) {
  return (
    <div ref={ref} className={`card ${padded ? 'p-4 sm:p-5' : ''} ${className}`} {...props}>
      {children}
    </div>
  );
});

export function CardTitle({ children, icon, className = '' }: { children: React.ReactNode; icon?: string; className?: string }) {
  return (
    <h3 className={`mb-3 flex items-center gap-2 font-display text-lg font-bold text-text ${className}`}>
      {icon && <span aria-hidden>{icon}</span>}
      {children}
    </h3>
  );
}
