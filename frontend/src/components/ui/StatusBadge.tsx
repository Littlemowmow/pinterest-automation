import { cn } from '@/lib/utils';

interface StatusBadgeProps {
  variant: 'success' | 'warning' | 'info' | 'error';
  children: React.ReactNode;
  dot?: boolean;
  className?: string;
}

const variantStyles = {
  success: 'status-badge-success',
  warning: 'status-badge-warning',
  info: 'status-badge-info',
  error: 'status-badge-error',
};

const dotStyles = {
  success: 'bg-success',
  warning: 'bg-warning',
  info: 'bg-info',
  error: 'bg-destructive',
};

export function StatusBadge({ variant, children, dot = true, className }: StatusBadgeProps) {
  return (
    <span className={cn('status-badge', variantStyles[variant], className)}>
      {dot && <span className={cn('w-1.5 h-1.5 rounded-full', dotStyles[variant])} />}
      {children}
    </span>
  );
}
