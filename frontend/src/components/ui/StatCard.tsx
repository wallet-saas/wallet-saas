import { cn } from '@/utils/cn';
import { LucideIcon } from 'lucide-react';

interface StatCardProps {
  label: string;
  value: string | number;
  icon: LucideIcon;
  iconBg?: string;
  iconColor?: string;
  trend?: { value: string; positive?: boolean };
  className?: string;
}

export function StatCard({ label, value, icon: Icon, iconBg = 'bg-primary-50', iconColor = 'text-primary-600', trend, className }: StatCardProps) {
  return (
    <div className={cn('card p-5 flex items-start gap-4', className)}>
      <div className={cn('flex-shrink-0 w-11 h-11 rounded-xl flex items-center justify-center', iconBg)}>
        <Icon className={cn('h-5 w-5', iconColor)} />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-sm text-gray-500 dark:text-gray-400 truncate">{label}</p>
        <p className="text-2xl font-semibold text-gray-900 dark:text-white mt-0.5">{value}</p>
        {trend && (
          <p className={cn('text-xs mt-1', trend.positive ? 'text-green-600' : 'text-gray-400')}>
            {trend.value}
          </p>
        )}
      </div>
    </div>
  );
}
