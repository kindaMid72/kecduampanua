import { SkeletonLoader } from "@/components/ui/SkeletonLoader";

export default function AdminTablePageLoading() {
  return (
    <div className="space-y-4">
      <div className="mb-6">
        <div className="h-8 bg-surface/50 rounded w-48 mb-2"></div>
        <div className="h-4 bg-surface/30 rounded w-96"></div>
      </div>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
        <div className="h-10 bg-surface/30 rounded w-full sm:w-64"></div>
        <div className="flex gap-2">
          <div className="h-10 bg-surface/30 rounded w-32 hidden sm:block"></div>
          <div className="h-10 bg-surface/30 rounded w-32"></div>
        </div>
      </div>
      <SkeletonLoader variant="table" count={5} />
    </div>
  );
}
