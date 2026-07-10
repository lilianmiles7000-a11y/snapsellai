import Link from 'next/link';
import { cn } from '@/lib/utils';
import { APP_NAME } from '@/lib/constants';

interface LogoProps {
  className?: string;
  showText?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

const sizeMap = {
  sm: { box: 'h-7 w-7', icon: 'h-4 w-4', text: 'text-base' },
  md: { box: 'h-9 w-9', icon: 'h-5 w-5', text: 'text-lg' },
  lg: { box: 'h-11 w-11', icon: 'h-6 w-6', text: 'text-xl' },
};

export function Logo({ className, showText = true, size = 'md' }: LogoProps) {
  const s = sizeMap[size];
  return (
    <Link
      href="/dashboard"
      className={cn('flex items-center gap-2.5 group', className)}
    >
      <div
        className={cn(
          'relative flex items-center justify-center rounded-xl bg-gradient-primary shrink-0 transition-transform duration-200 group-hover:scale-105',
          s.box
        )}
      >
        <svg
          viewBox="0 0 24 24"
          fill="none"
          className={cn(s.icon, 'text-white')}
        >
          <path
            d="M3 9.5L9 3.5C9.5 3 10.2 2.8 10.9 3L20 6C20.6 6.2 20.9 6.9 20.6 7.5L17.5 14.5C17.2 15.1 16.5 15.4 15.9 15.1L7 11.8C6.3 11.5 6 10.7 6.3 10L3 9.5Z"
            fill="currentColor"
            fillOpacity="0.9"
          />
          <circle cx="12" cy="14" r="2.5" fill="currentColor" />
          <path
            d="M6 18.5L4.5 20"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
          />
          <path
            d="M10 19.5L9 21"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
          />
        </svg>
      </div>
      {showText && (
        <span className={cn('font-semibold tracking-tight text-foreground', s.text)}>
          {APP_NAME}
        </span>
      )}
    </Link>
  );
}
