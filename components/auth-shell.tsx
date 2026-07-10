import { Logo } from '@/components/logo';
import { APP_NAME, APP_TAGLINE } from '@/lib/constants';
import { Check } from 'lucide-react';

export function AuthShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen lg:grid lg:grid-cols-2">
      {/* Left — form */}
      <div className="flex min-h-screen flex-col px-6 py-8 sm:px-10 lg:px-16">
        <div className="flex items-center justify-between">
          <Logo size="sm" />
        </div>
        <div className="flex flex-1 items-center justify-center py-10">
          <div className="w-full max-w-sm animate-fade-up">{children}</div>
        </div>
        <p className="text-center text-xs text-muted-foreground">
          © {new Date().getFullYear()} {APP_NAME}
        </p>
      </div>

      {/* Right — brand panel */}
      <div className="relative hidden overflow-hidden border-l border-border bg-card lg:flex lg:flex-col">
        <div className="absolute inset-0 bg-grid bg-grid-fade opacity-50" />
        <div className="absolute right-0 top-1/4 h-96 w-96 glow-orb" />
        <div className="absolute bottom-0 left-1/4 h-64 w-64 glow-orb opacity-60" />
        <div className="relative flex h-full flex-col justify-center p-16">
          <div className="max-w-md">
            <h2 className="text-3xl font-semibold tracking-tight text-foreground">
              Turn photos into <span className="text-gradient-primary">listings in seconds.</span>
            </h2>
            <p className="mt-4 text-muted-foreground">{APP_TAGLINE}</p>
            <ul className="mt-8 space-y-3">
              {[
                'AI-generated titles, descriptions & prices',
                'Optimized for Vinted, Leboncoin, eBay & Facebook',
                'SEO keywords included in every listing',
                'Copy & paste directly to your marketplace',
              ].map((item) => (
                <li key={item} className="flex items-center gap-3 text-sm text-foreground">
                  <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-success/15 text-success">
                    <Check className="h-3 w-3" />
                  </span>
                  {item}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
