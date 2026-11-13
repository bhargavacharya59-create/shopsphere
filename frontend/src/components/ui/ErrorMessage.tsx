import { ExclamationTriangleIcon, XMarkIcon } from '@heroicons/react/24/outline';

interface Props {
  message: string;
  onDismiss?: () => void;
  className?: string;
}

export function ErrorMessage({ message, onDismiss, className = '' }: Props) {
  return (
    <div className={`rounded-lg bg-red-50 border border-red-200 p-4 flex items-start gap-3 ${className}`} role="alert">
      <ExclamationTriangleIcon className="h-5 w-5 text-red-500 flex-shrink-0 mt-0.5" />
      <p className="text-sm text-red-700 flex-1">{message}</p>
      {onDismiss && (
        <button onClick={onDismiss} className="text-red-400 hover:text-red-600 transition-colors" aria-label="Dismiss">
          <XMarkIcon className="h-4 w-4" />
        </button>
      )}
    </div>
  );
}

export function EmptyState({ title, description, action }: {
  title: string;
  description?: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="text-center py-16 px-4">
      <div className="text-6xl mb-4">🛍️</div>
      <h3 className="text-lg font-semibold text-gray-800 mb-2">{title}</h3>
      {description && <p className="text-gray-500 mb-6">{description}</p>}
      {action}
    </div>
  );
}
