'use client';

import { ReactNode } from 'react';
import Link from 'next/link';
import { cn } from '@/lib/utils';

interface StatCardProps {
  title: string;
  value: number;
  icon: ReactNode;
  variant?: 'default' | 'primary' | 'success' | 'warning' | 'info';
  description?: string;
  href?: string;
}

const borderStyles = {
  default: 'border-l-4 border-muted-foreground/20',
  primary: 'stat-card-border-primary',
  success: 'stat-card-border-success',
  warning: 'stat-card-border-warning',
  info: 'stat-card-border-info',
};

const iconStyles = {
  default: 'text-muted-foreground/20',
  primary: 'text-primary/15',
  success: 'text-success/15',
  warning: 'text-warning/15',
  info: 'text-info/15',
};

export function StatCard({ title, value, icon, variant = 'default', description, href }: StatCardProps) {
  const content = (
    <div
      className={cn(
        'stat-card animate-fade-in',
        borderStyles[variant],
        href && 'cursor-pointer hover-lift'
      )}
    >
      {/* Background watermark icon */}
      <div className={cn('absolute -bottom-4 -right-4 w-24 h-24 pointer-events-none', iconStyles[variant])}>
        {icon}
      </div>

      <div className="relative z-10">
        <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{title}</p>
        <p className="text-4xl font-bold mt-2 text-foreground">{value}</p>
        {description && (
          <p className="text-sm text-muted-foreground mt-1">{description}</p>
        )}
      </div>
    </div>
  );

  if (href) {
    return <Link href={href}>{content}</Link>;
  }

  return content;
}
