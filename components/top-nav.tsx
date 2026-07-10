'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Search, Bell, PanelLeftClose, PanelLeft, Menu, X, Sparkles,
  LayoutDashboard, History, CreditCard, Settings,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Logo } from '@/components/logo';
import { NAV_ITEMS } from '@/lib/constants';
import { useAuth } from '@/contexts/auth-context';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';

const ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  LayoutDashboard,
  Sparkles,
  History,
  CreditCard,
  Settings,
};

interface TopNavProps {
  collapsed: boolean;
  onToggleCollapse: () => void;
}

export function TopNav({ collapsed, onToggleCollapse }: TopNavProps) {
  const router = useRouter();
  const { profile } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [query, setQuery] = useState('');

  const notifications = [
    { id: '1', title: 'Welcome to SnapSell AI', body: 'You have 10 free credits to get started.', time: 'just now', unread: true },
    { id: '2', title: 'Listing generated', body: 'Your Nike Air Max listing is ready to publish.', time: '2h ago', unread: true },
    { id: '3', title: 'Credits running low', body: 'You have used 8 of 10 free credits.', time: '1d ago', unread: false },
  ];
  const unreadCount = notifications.filter((n) => n.unread).length;

  const onSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) router.push(`/history?q=${encodeURIComponent(query)}`);
  };

  return (
    <>
      <header className="sticky top-0 z-20 flex h-16 items-center gap-3 border-b border-border bg-background/80 px-4 backdrop-blur-xl md:px-6">
        {/* Collapse toggle */}
        <button
          onClick={onToggleCollapse}
          className="hidden md:flex h-9 w-9 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
          aria-label="Toggle sidebar"
        >
          {collapsed ? <PanelLeft className="h-[18px] w-[18px]" /> : <PanelLeftClose className="h-[18px] w-[18px]" />}
        </button>

        {/* Mobile menu button */}
        <button
          onClick={() => setMobileOpen(true)}
          className="md:hidden flex h-9 w-9 items-center justify-center rounded-lg text-muted-foreground hover:text-foreground"
          aria-label="Open menu"
        >
          <Menu className="h-5 w-5" />
        </button>

        {/* Search */}
        <form onSubmit={onSearch} className="relative flex-1 max-w-md hidden sm:block">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search listings..."
            className="h-9 pl-9 pr-4 bg-card/60 border-border text-sm placeholder:text-muted-foreground/70"
          />
        </form>

        <div className="flex flex-1 items-center justify-end gap-2 sm:flex-initial">
          {/* Notifications */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="relative flex h-9 w-9 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-accent hover:text-foreground">
                <Bell className="h-[18px] w-[18px]" />
                {unreadCount > 0 && (
                  <span className="absolute top-1.5 right-1.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-primary px-1 text-[10px] font-bold text-white">
                    {unreadCount}
                  </span>
                )}
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-80 p-0">
              <DropdownMenuLabel className="flex items-center justify-between px-4 py-3">
                <span>Notifications</span>
                {unreadCount > 0 && <Badge variant="secondary" className="text-[10px]">{unreadCount} new</Badge>}
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <div className="max-h-80 overflow-y-auto">
                {notifications.map((n) => (
                  <div
                    key={n.id}
                    className={cn(
                      'flex gap-3 px-4 py-3 cursor-default transition-colors hover:bg-accent/50',
                      n.unread && 'bg-primary/5'
                    )}
                  >
                    <div className={cn('mt-1.5 h-2 w-2 rounded-full shrink-0', n.unread ? 'bg-primary' : 'bg-transparent')} />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-foreground">{n.title}</p>
                      <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">{n.body}</p>
                      <p className="text-[11px] text-muted-foreground/60 mt-1">{n.time}</p>
                    </div>
                  </div>
                ))}
              </div>
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Upgrade button */}
          <Link href="/pricing">
            <Button size="sm" className="bg-gradient-primary glow-primary hidden sm:inline-flex">
              <Sparkles className="h-3.5 w-3.5 mr-1.5" />
              Upgrade
            </Button>
          </Link>
        </div>
      </header>

      {/* Mobile drawer */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 md:hidden">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm animate-fade-in" onClick={() => setMobileOpen(false)} />
          <div className="absolute left-0 top-0 h-full w-72 bg-card border-r border-border animate-slide-in-right p-4 flex flex-col">
            <div className="flex items-center justify-between mb-6">
              <Logo size="sm" />
              <button onClick={() => setMobileOpen(false)} className="h-8 w-8 flex items-center justify-center rounded-lg hover:bg-accent">
                <X className="h-4 w-4" />
              </button>
            </div>
            <nav className="flex-1 space-y-1">
              {NAV_ITEMS.map((item) => {
                const Icon = ICONS[item.icon];
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setMobileOpen(false)}
                    className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-accent/60 transition-colors"
                  >
                    {Icon && <Icon className="h-[18px] w-[18px]" />}
                    {item.label}
                  </Link>
                );
              })}
            </nav>
            <div className="rounded-xl border border-border bg-gradient-primary-soft p-4">
              <p className="text-sm font-medium text-foreground">{profile?.credits_remaining ?? 10} credits left</p>
              <Link href="/pricing" onClick={() => setMobileOpen(false)} className="mt-3 block">
                <Button size="sm" className="w-full bg-gradient-primary">Upgrade</Button>
              </Link>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
