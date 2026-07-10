'use client';

import { cn } from '@/lib/utils';
import type { LucideIcon } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { TrendingUp, TrendingDown } from 'lucide-react';

interface StatCardProps {
  label: string;
  value: string | number;
  icon: LucideIcon;
  accent?: 'primary' | 'success' | 'warning' | 'neutral';
  trend?: { value: string; direction: 'up' | 'down' };
  loading?: boolean;
}

const accentColors = {
  primary: 'bg-primary/10 text-primary',
  success: 'bg-success/10 text-success',
  warning: 'bg-warning/10 text-warning',
  neutral: 'bg-muted text-muted-foreground',
};

export function StatCard({ label, value, icon: Icon, accent = 'primary', trend, loading }: StatCardProps) {
  if (loading) {
    return <Card className="p-5"><div className="skeleton h-20 w-full" /></Card>;
  }

  return (
    <Card className="p-5">
      <div className="flex items-center justify-between">
        <div className={cn('flex h-9 w-9 items-center justify-center rounded-lg', accentColors[accent])}>
          <Icon className="h-4.5 w-4.5" />
        </div>
        {trend && (
          <div className={cn('flex items-center gap-1 text-xs font-medium', trend.direction === 'up' ? 'text-success' : 'text-destructive')}>
            {trend.direction === 'up' ? <TrendingUp className="h-3.5 w-3.5" /> : <TrendingDown className="h-3.5 w-3.5" />}
            {trend.value}
          </div>
        )}
      </div>
      <div className="mt-3">
        <p className="text-2xl font-bold text-foreground">{value}</p>
        <p className="mt-0.5 text-sm text-muted-foreground">{label}</p>
      </div>
    </Card>
  );
}
