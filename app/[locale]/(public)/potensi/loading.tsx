import { SkeletonLoader } from "@/components/ui/SkeletonLoader";
import { SectionDivider } from "@/components/ui/SectionDivider";

export default function PotensiLoading() {
  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      <div className="mb-8">
        <div className="h-8 bg-surface/50 rounded w-64 mb-2"></div>
        <div className="h-4 bg-surface/30 rounded w-96"></div>
      </div>
      <SectionDivider className="mb-8" />
      <SkeletonLoader variant="card" count={4} />
    </div>
  );
}
