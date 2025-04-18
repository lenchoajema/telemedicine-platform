import './LoadingSpinner.css';

export default function LoadingSpinner({
  size = 'medium',
  color = 'primary',
  fullPage = false,
  className = ''
}) {
  const sizeClasses = {
    small: 'h-5 w-5 border-2',
    medium: 'h-8 w-8 border-3',
    large: 'h-12 w-12 border-4'
  };

  const colorClasses = {
    primary: 'border-t-blue-500',
    secondary: 'border-t-purple-500',
    white: 'border-t-white',
    dark: 'border-t-gray-800'
  };

  return (
    <div className={`loading-spinner-container ${fullPage ? 'full-page' : ''} ${className}`}>
      <div 
        className={`loading-spinner ${sizeClasses[size]} ${colorClasses[color]}`}
        aria-label="Loading"
        role="status"
      />
    </div>
  );
}