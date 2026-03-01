import { LucideIcon } from 'lucide-react';

interface StatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: LucideIcon;
  iconColor?: string;
  iconBg?: string;
  trend?: {
    value: number;
    isPositive: boolean;
  };
}

export function StatCard({
  title,
  value,
  subtitle,
  icon: Icon,
  iconColor = 'text-cosmic-gold',
  iconBg = 'bg-cosmic-gold/20',
  trend
}: StatCardProps) {
  return (
    <div className="rounded-xl p-5" style={{ background: 'white', border: '1px solid #e8ddd0' }}>
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className="text-sm mb-1" style={{ color: '#9a8578' }}>{title}</p>
          <p className="text-2xl font-bold" style={{ color: '#3d2f2a' }}>{value}</p>
          {subtitle && (
            <p className="text-xs mt-1" style={{ color: '#9a8578' }}>{subtitle}</p>
          )}
          {trend && (
            <p className={`text-xs mt-2 ${trend.isPositive ? 'text-green-600' : 'text-red-500'}`}>
              {trend.isPositive ? '↑' : '↓'} {Math.abs(trend.value)}% from last week
            </p>
          )}
        </div>
        <div className={`w-12 h-12 rounded-xl ${iconBg} flex items-center justify-center`}>
          <Icon className={`w-6 h-6 ${iconColor}`} />
        </div>
      </div>
    </div>
  );
}
