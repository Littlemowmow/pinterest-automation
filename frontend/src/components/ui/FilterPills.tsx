import { cn } from '@/lib/utils';

interface FilterOption {
  value: string;
  label: string;
  count?: number;
}

interface FilterPillsProps {
  options: FilterOption[];
  value: string;
  onChange: (value: string) => void;
  className?: string;
}

export function FilterPills({ options, value, onChange, className }: FilterPillsProps) {
  return (
    <div className={cn('flex items-center gap-2 flex-wrap', className)}>
      {options.map((option) => (
        <button
          key={option.value}
          onClick={() => onChange(option.value)}
          className={cn(
            'filter-pill',
            value === option.value ? 'filter-pill-active' : 'filter-pill-inactive'
          )}
        >
          {option.label}
          {option.count !== undefined && (
            <span className={cn(
              'ml-1.5',
              value === option.value ? 'text-primary-foreground/80' : 'text-muted-foreground'
            )}>
              ({option.count})
            </span>
          )}
        </button>
      ))}
    </div>
  );
}
