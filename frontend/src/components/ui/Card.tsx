import { cn } from '@/utils/cn';

interface CardProps {
  className?: string;
  children: React.ReactNode;
}
export function Card({ className, children }: CardProps) {
  return <div className={cn('card', className)}>{children}</div>;
}

export function CardHeader({ className, children }: CardProps) {
  return <div className={cn('card-header', className)}>{children}</div>;
}

export function CardBody({ className, children }: CardProps) {
  return <div className={cn('card-body', className)}>{children}</div>;
}

export function CardTitle({ className, children }: CardProps) {
  return <h3 className={cn('text-base font-semibold text-gray-900', className)}>{children}</h3>;
}
