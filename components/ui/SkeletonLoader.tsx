interface SkeletonLoaderProps {
  variant: "table" | "card" | "list";
  count?: number;
}

export function SkeletonLoader({ variant, count = 3 }: SkeletonLoaderProps) {
  const items = Array.from({ length: count }, (_, i) => i);

  if (variant === "table") {
    return (
      <div className="w-full animate-pulse mt-4">
        <div className="h-10 bg-surface/80 rounded-t border-b border-surface/50 w-full mb-2"></div>
        <div className="space-y-2">
          {items.map((i) => (
            <div key={i} className="h-14 bg-surface/40 rounded w-full"></div>
          ))}
        </div>
      </div>
    );
  }

  if (variant === "card") {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-pulse">
        {items.map((i) => (
          <div key={i} className="h-[340px] bg-surface/50 rounded-[var(--radius-card)] w-full"></div>
        ))}
      </div>
    );
  }

  // list
  return (
    <div className="space-y-4 animate-pulse">
      {items.map((i) => (
        <div key={i} className="h-24 bg-surface/50 rounded-[var(--radius-card)] w-full"></div>
      ))}
    </div>
  );
}
