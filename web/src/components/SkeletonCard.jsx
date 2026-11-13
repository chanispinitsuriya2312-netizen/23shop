export default function SkeletonCard() {
  return (
    <div className="overflow-hidden rounded-2xl bg-white ring-1 ring-ink-100">
      <div className="aspect-square animate-pulse bg-ink-100" />
      <div className="space-y-2 p-3.5">
        <div className="h-3.5 w-11/12 animate-pulse rounded bg-ink-100" />
        <div className="h-3.5 w-2/3 animate-pulse rounded bg-ink-100" />
        <div className="h-5 w-1/2 animate-pulse rounded bg-ink-100" />
        <div className="h-9 w-full animate-pulse rounded-xl bg-ink-100" />
      </div>
    </div>
  )
}

export function SkeletonGrid({ count = 8 }) {
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
      {Array.from({ length: count }).map((_, i) => (
        <SkeletonCard key={i} />
      ))}
    </div>
  )
}
