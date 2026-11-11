export default function Skeleton({ className = '' }) {
  return (
    <div
      aria-hidden="true"
      className={`skeleton-shimmer relative overflow-hidden animate-pulse rounded-2xl bg-line ${className}`}
    />
  );
}
