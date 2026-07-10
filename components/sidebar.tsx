'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  Sparkles,
  History,
  CreditCard,
  Settings,
  LogOut,
  ChevronRight,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { NAV_ITEMS } from '@/lib/constants';
import { Logo } from '@/components/logo';
import { useAuth } from '@/contexts/auth-context';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

const ICONS = {
  LayoutDashboard,
  Sparkles,
  History,
  CreditCard,
  Settings,
};

const COLLAPSED_WIDTH = 'w-[72px]';
const EXPANDED_WIDTH = 'w-[248px]';

interface SidebarProps {
  collapsed: boolean;
}

export function Sidebar({ collapsed }: SidebarProps) {
  const pathname = usePathname();
  const { profile, signOut } = useAuth();

  const initials = (profile?.full_name || profile?.email || 'U')
    .split(' ')
    .map((p) => p[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();

  return (
    <aside
      className={cn(
        'hidden md:flex flex-col h-screen sticky top-0 border-r border-border bg-card/40 backdrop-blur-xl transition-[width] duration-200 ease-out z-30',
        collapsed ? COLLAPSED_WIDTH : EXPANDED_WIDTH
      )}
    >
      {/* Logo */}
      <div className={cn('flex items-center h-16 border-b border-border px-4', collapsed && 'justify-center px-0')}>
        {collapsed ? <Logo showText={false} size="sm" /> : <Logo size="sm" />}
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-1">
        {NAV_ITEMS.map((item) => {
          const Icon = ICONS[item.icon as keyof typeof ICONS];
          const active =
            pathname === item.href ||
            (item.href !== '/dashboard' && pathname.startsWith(item.href));
          const link = (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-200 relative group',
                active
                  ? 'bg-primary/10 text-primary'
                  : 'text-muted-foreground hover:text-foreground hover:bg-accent/60',
                collapsed && 'justify-center px-0'
              )}
            >
              {active && (
                <span className="absolute left-0 top-1/2 -translate-y-1/2 h-5 w-[3px] rounded-r-full bg-primary" />
              )}
              <Icon className={cn('h-[18px] w-[18px] shrink-0', active && 'text-primary')} />
              {!collapsed && <span>{item.label}</span>}
            </Link>
          );
          if (collapsed) {
            return (
              <TooltipProvider key={item.href} delayDuration={0}>
                <Tooltip>
                  <TooltipTrigger asChild>{link}</TooltipTrigger>
                  <TooltipContent side="right" sideOffset={8}>
                    {item.label}
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            );
          }
          return link;
        })}
      </nav>

      {/* Upgrade card */}
      {!collapsed && (
        <div className="px-3 pb-3">
          <div className="rounded-xl border border-border bg-gradient-primary-soft p-4">
            <p className="text-sm font-medium text-foreground">Upgrade to Pro</p>
            <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
              150 listings/mo, SEO optimization & price suggestions.
            </p>
            <Link href="/pricing" className="mt-3 block">
              <Button size="sm" className="w-full bg-gradient-primary glow-primary">
                Upgrade
                <ChevronRight className="h-3.5 w-3.5 ml-1" />
              </Button>
            </Link>
          </div>
        </div>
      )}

      {/* User avatar at bottom */}
      <div className={cn('border-t border-border p-3', collapsed && 'px-2')}>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              className={cn(
                'flex w-full items-center gap-3 rounded-lg p-2 text-left transition-colors hover:bg-accent/60',
                collapsed && 'justify-center p-1.5'
              )}
            >
              <Avatar className="h-8 w-8 border border-border">
                <AvatarImage src={profile?.avatar_url ?? undefined} />
                <AvatarFallback className="bg-primary/20 text-primary text-xs font-semibold">
                  {initials}
                </AvatarFallback>
              </Avatar>
              {!collapsed && (
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate text-foreground">
                    {profile?.full_name || 'User'}
                  </p>
                  <p className="text-xs text-muted-foreground truncate">
                    {profile?.plan ? profile.plan.charAt(0).toUpperCase() + profile.plan.slice(1) : 'Free'} plan
                  </p>
                </div>
              )}
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent side="top" align={collapsed ? 'center' : 'start'} className="w-56 mb-2">
            <DropdownMenuLabel className="font-normal">
              <div className="flex flex-col">
                <span className="text-sm font-medium">{profile?.full_name || 'User'}</span>
                <span className="text-xs text-muted-foreground">{profile?.email}</span>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <Link href="/settings">
              <DropdownMenuItem>
                <Settings className="h-4 w-4 mr-2" />
                Settings
              </DropdownMenuItem>
            </Link>
            <Link href="/pricing">
              <DropdownMenuItem>
                <CreditCard className="h-4 w-4 mr-2" />
                Billing
              </DropdownMenuItem>
            </Link>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => signOut()} className="text-destructive focus:text-destructive">
              <LogOut className="h-4 w-4 mr-2" />
              Sign out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </aside>
  );
}
