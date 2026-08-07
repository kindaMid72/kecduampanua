import { Loader2 } from "lucide-react";

interface LoadingSpinnerProps {
  size?: "sm" | "md" | "lg";
  className?: string;
}

export function LoadingSpinner({ size = "md", className = "" }: LoadingSpinnerProps) {
  const sizeMap = {
    sm: 16,
    md: 24,
    lg: 48,
  };

  return (
    <div className={`flex justify-center items-center ${className}`}>
      <Loader2
        size={sizeMap[size]}
        className="animate-spin text-secondary"
      />
      <span className="sr-only">Memuat...</span>
    </div>
  );
}
