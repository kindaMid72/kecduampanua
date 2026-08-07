import { AlertCircle, RefreshCcw } from "lucide-react";
import Link from "next/link";
import { Button } from "./Button";

interface ErrorStateProps {
  title?: string;
  message: string;
  action?: {
    label: string;
    href?: string;
    onClick?: () => void;
  };
  variant?: "page" | "inline" | "admin";
}

export function ErrorState({ title, message, action, variant = "page" }: ErrorStateProps) {
  if (variant === "inline") {
    return (
      <div className="flex items-center justify-between p-4 bg-[#BE7B3D]/10 text-[#BE7B3D] rounded-md border border-[#BE7B3D]/20">
        <div className="flex items-center gap-3">
          <AlertCircle size={18} />
          <span className="text-sm font-medium">{message}</span>
        </div>
        {action?.onClick && (
          <button
            onClick={action.onClick}
            className="text-xs font-semibold underline hover:text-[#BE7B3D]/80 flex items-center gap-1"
          >
            <RefreshCcw size={12} />
            {action.label}
          </button>
        )}
      </div>
    );
  }

  return (
    <div
      className={`flex flex-col items-center justify-center text-center px-4 ${
        variant === "page" ? "min-h-[50vh] py-20" : "py-16"
      }`}
    >
      <div className="w-16 h-16 rounded-full bg-accent/10 flex items-center justify-center mb-6 text-accent">
        <AlertCircle size={32} />
      </div>
      <h2 className="text-2xl font-display font-semibold text-primary mb-3">
        {title || "Terjadi Kesalahan"}
      </h2>
      <p className="text-text/70 mb-8 max-w-md leading-relaxed">
        {message}
      </p>
      {action && (
        action.href ? (
          <Button asChild variant="primary">
            <Link href={action.href}>{action.label}</Link>
          </Button>
        ) : (
          <Button onClick={action.onClick} variant="primary" className="gap-2">
            <RefreshCcw size={16} />
            {action.label}
          </Button>
        )
      )}
    </div>
  );
}
