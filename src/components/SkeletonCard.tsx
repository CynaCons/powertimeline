import './SkeletonCard.css';

interface SkeletonCardProps {
  lines?: number;
  showFooter?: boolean;
  minHeight?: number;
  className?: string;
}

export function SkeletonCard({
  lines = 3,
  showFooter = true,
  minHeight = 160,
  className = '',
}: SkeletonCardProps) {
  const lineWidths = Array.from({ length: lines }).map((_, index) => {
    const base = 95 - index * 10;
    return `${Math.max(base, 60)}%`;
  });

  return (
    <div
      className={`skeleton-card ${className}`}
      style={{ minHeight }}
      aria-busy="true"
      aria-live="polite"
      aria-label="Loading timeline card"
    >
      <div className="skeleton-block skeleton-title" />
      {lineWidths.map((width, index) => (
        <div
          key={`skeleton-line-${index}`}
          className="skeleton-block skeleton-line"
          style={{ width }}
        />
      ))}
      {showFooter && (
        <div className="skeleton-footer">
          <span className="skeleton-pill" />
          <span className="skeleton-pill" />
        </div>
      )}
    </div>
  );
}
