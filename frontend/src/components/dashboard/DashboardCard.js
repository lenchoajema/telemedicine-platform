import { ArrowUpIcon, ArrowDownIcon } from '@heroicons/react/24/solid';

export default function DashboardCard({
  title,
  value,
  icon,
  variant = 'primary',
  trend,
  trendValue,
  className = ''
}) {
  const variantClasses = {
    primary: 'bg-blue-50 text-blue-600',
    secondary: 'bg-purple-50 text-purple-600',
    success: 'bg-green-50 text-green-600',
    warning: 'bg-yellow-50 text-yellow-600',
    error: 'bg-red-50 text-red-600'
  };

  return (
    <div className={`dashboard-card ${variantClasses[variant]} ${className}`}>
      <div className="card-header">
        <h3 className="card-title">{title}</h3>
        {icon && <div className="card-icon">{icon}</div>}
      </div>

      <div className="card-content">
        <p className="card-value">{value}</p>
        {trend && (
          <div className={`trend-indicator ${trend}`}>
            {trend === 'up' ? (
              <ArrowUpIcon className="trend-icon" />
            ) : (
              <ArrowDownIcon className="trend-icon" />
            )}
            <span>{trendValue}</span>
          </div>
        )}
      </div>
    </div>
  );
}