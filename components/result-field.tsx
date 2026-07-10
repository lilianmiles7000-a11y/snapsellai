'use client';

import { Card } from '@/components/ui/card';
import { CopyButton } from '@/components/copy-button';
import { cn } from '@/lib/utils';

interface ResultFieldProps {
  label: string;
  value: string | null | undefined;
  icon?: React.ComponentType<{ className?: string }>;
  className?: string;
  multiline?: boolean;
}

export function ResultField({ label, value, icon: Icon, className, multiline }: ResultFieldProps) {
  return (
    <Card className={cn('card-hover p-4', className)}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
          {Icon && <Icon className="h-3.5 w-3.5" />}
          {label}
        </div>
        {value && <CopyButton value={value} label={label} />}
      </div>
      <p className={cn('mt-2 text-sm font-medium text-foreground', multiline && 'whitespace-pre-wrap leading-relaxed')}>
        {value || '—'}
      </p>
    </Card>
  );
}

interface ResultPriceFieldProps {
  label: string;
  value: number | null;
  className?: string;
  accent?: 'primary' | 'success' | 'warning';
}

const priceAccent = {
  primary: 'text-primary',
  success: 'text-success',
  warning: 'text-warning',
};

export function ResultPriceField({ label, value, className, accent = 'primary' }: ResultPriceFieldProps) {
  const formatted = value != null ? `€${value.toFixed(2)}` : '—';
  return (
    <Card className={cn('card-hover p-4', className)}>
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium text-muted-foreground">{label}</span>
        <CopyButton value={formatted} label={label} />
      </div>
      <p className={cn('mt-2 text-xl font-semibold', priceAccent[accent])}>{formatted}</p>
    </Card>
  );
}
