import EmptyState from "./EmptyState.jsx";
import ErrorState from "./ErrorState.jsx";
import Skeleton from "./Skeleton.jsx";

// query     : the result of useQuery(...)
// isEmpty   : (data) => true when there is nothing to show
// skeleton  : what to show while loading (optional)
// children  : (data) => the real page
export default function QueryState({
  query,
  isEmpty,
  skeleton,
  empty,
  children,
}) {
  if (query.isPending) return skeleton ?? <Skeleton className="h-40 w-full" />;
  if (query.isError) return <ErrorState onRetry={() => query.refetch()} />;
  if (isEmpty?.(query.data)) return empty ?? <EmptyState />;
  return children(query.data);
}
