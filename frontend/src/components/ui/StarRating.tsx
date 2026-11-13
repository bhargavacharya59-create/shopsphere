import { StarIcon } from '@heroicons/react/24/solid';
import { StarIcon as StarOutlineIcon } from '@heroicons/react/24/outline';

interface Props {
  rating: number;
  reviewCount?: number;
  size?: 'sm' | 'md';
}

export function StarRating({ rating, reviewCount, size = 'sm' }: Props) {
  const iconClass = size === 'sm' ? 'h-3.5 w-3.5' : 'h-4 w-4';
  const stars = Array.from({ length: 5 }, (_, i) => i + 1);

  return (
    <div className="flex items-center gap-1">
      <div className="flex items-center">
        {stars.map((star) => (
          <span key={star}>
            {star <= Math.round(rating)
              ? <StarIcon className={`${iconClass} text-amber-400`} />
              : <StarOutlineIcon className={`${iconClass} text-gray-300`} />
            }
          </span>
        ))}
      </div>
      <span className="text-xs text-gray-500">
        {rating.toFixed(1)}
        {reviewCount !== undefined && (
          <span className="text-gray-400"> ({reviewCount.toLocaleString()})</span>
        )}
      </span>
    </div>
  );
}
