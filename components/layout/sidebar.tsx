'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, Plus, Clock, Settings, Zap, Wand as Wand2, LogOut, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuth } from '@/contexts/auth-context';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';

const NAV = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/new-listing', label: 'New Listing', icon: Plus },
  { href: '/history', label: 'History', icon: Clock },
  { href: '/settings', label: 'Settings', icon: Settings },
];

export function Sidebar() {
  const pathname = usePathname();
  const { profile, signOut } = useAuth();

  const initials = (profile?.full_name || profile?.email || 'U')
    .split(' ').map((p: string) => p[0]).slice(0, 2).join('').toUpperCase();

  const creditsPct = profile ? Math.round((profile.credits_remaining / profile.credits_total) * 100) : 0;

  return (
    <aside className="flex h-full w-56 flex-col border-r border-sidebar-border bg-sidebar-bg">
      {/* Logo */}
      <div className="flex h-14 items-center gap-2.5 px-4 border-b border-sidebar-border">
        <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-gradient-primary">
          <Wand2 className="h-4 w-4 text-white" />
        </div>
        <span className="text-sm font-semibold text-foreground">SnapSell AI</span>
      </div>

      {/* Nav */}
      <nav className="flex-1 space-y-0.5 p-2 pt-3">
        {NAV.map(({ href, label, icon: Icon }) => {
          const active = pathname === href || (href !== '/dashboard' && pathname.startsWith(href));
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                'flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium transition-all duration-100',
                active
                  ? 'bg-primary/15 text-primary'
                  : 'text-muted-foreground hover:bg-accent hover:text-foreground'
              )}
            >
              <Icon className="h-4 w-4 shrink-0" />
              {label}
              {href === '/new-listing' && (
                <span className="ml-auto flex h-5 w-5 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-white">+</span>
              )}
            </Link>
          );
        })}
      </nav>

      {/* Credits */}
      {profile && (
        <div className="mx-2 mb-2 rounded-lg border border-sidebar-border bg-muted/30 p-3">
          <div className="flex items-center justify-between mb-1.5">
            <div className="flex items-center gap-1.5">
              <Zap className="h-3.5 w-3.5 text-warning" />
              <span className="text-xs font-medium text-foreground">Credits</span>
            </div>
            <Badge variant={profile.plan === 'pro' ? 'success' : 'outline'} className="text-[10px] py-0 h-4">
              {profile.plan === 'pro' ? 'Pro' : 'Free'}
            </Badge>
          </div>
          <Progress value={creditsPct} className="h-1.5" />
          <p className="mt-1 text-[10px] text-muted-foreground">{profile.credits_remaining} / {profile.credits_total} remaining</p>
          {profile.plan === 'free' && (
            <Link href="/pricing" className="mt-2 flex items-center gap-1 text-[10px] font-medium text-primary hover:underline">
              Upgrade to Pro <ChevronRight className="h-3 w-3" />
            </Link>
          )}
        </div>
      )}

      {/* User */}
      {profile && (
        <div className="border-t border-sidebar-border p-3">
          <div className="flex items-center gap-2.5">
            <Avatar className="h-7 w-7">
              <AvatarImage src={profile.avatar_url ?? undefined} />
              <AvatarFallback className="bg-primary/20 text-primary text-xs">{initials}</AvatarFallback>
            </Avatar>
            <div className="min-w-0 flex-1">
              <p className="truncate text-xs font-medium text-foreground">{profile.full_name || 'User'}</p>
              <p className="truncate text-[10px] text-muted-foreground">{profile.email}</p>
            </div>
            <button
              onClick={() => signOut()}
              className="shrink-0 rounded-md p-1 text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
              title="Sign out"
            >
              <LogOut className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      )}
    </aside>
  );
}
