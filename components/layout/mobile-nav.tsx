'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Menu, X, Wand2 } from 'lucide-react';
import { Sidebar } from './sidebar';

export function MobileNav() {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();

  // Close on route change
  if (typeof window !== 'undefined') {
    // handled by link clicks
  }

  return (
    <>
      <header className="flex h-14 items-center gap-3 border-b border-border bg-card px-4 lg:hidden">
        <button
          onClick={() => setOpen(true)}
          className="rounded-lg p-1.5 text-muted-foreground hover:bg-accent"
        >
          <Menu className="h-5 w-5" />
        </button>
        <div className="flex items-center gap-2">
          <div className="flex h-6 w-6 items-center justify-center rounded-lg bg-gradient-primary">
            <Wand2 className="h-3.5 w-3.5 text-white" />
          </div>
          <span className="text-sm font-semibold text-foreground">SnapSell AI</span>
        </div>
      </header>

      {open && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setOpen(false)} />
          <div className="absolute left-0 top-0 bottom-0 w-56 flex flex-col" onClick={() => setOpen(false)}>
            <Sidebar />
          </div>
          <button onClick={() => setOpen(false)} className="absolute top-4 left-60 rounded-full bg-card p-1.5 text-muted-foreground">
            <X className="h-4 w-4" />
          </button>
        </div>
      )}
    </>
  );
}
