import { LoadingSpinner } from "@/components/ui/LoadingSpinner";

export default function AdminDashboardLoading() {
  return (
    <div className="flex-1 flex items-center justify-center py-12">
      <LoadingSpinner size="lg" />
    </div>
  );
}
