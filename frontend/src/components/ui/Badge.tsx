import { cn } from '@/utils/cn';

type BadgeVariant = 'green' | 'red' | 'yellow' | 'blue' | 'gray' | 'purple';

interface BadgeProps {
  variant?: BadgeVariant;
  className?: string;
  children: React.ReactNode;
}

export function Badge({ variant = 'gray', className, children }: BadgeProps) {
  const variants: Record<BadgeVariant, string> = {
    green: 'badge-green',
    red: 'badge-red',
    yellow: 'badge-yellow',
    blue: 'badge-blue',
    gray: 'badge-gray',
    purple: 'badge-purple',
  };
  return (
    <span className={cn('badge', variants[variant], className)}>{children}</span>
  );
}
