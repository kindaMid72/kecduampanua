import { LoadingSpinner } from "@/components/ui/LoadingSpinner";

export default function PublicLoading() {
  return (
    <div className="min-h-[50vh] flex items-center justify-center">
      <LoadingSpinner size="lg" />
    </div>
  );
}
