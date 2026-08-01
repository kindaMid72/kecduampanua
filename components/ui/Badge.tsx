type BadgeVariant = "default" | "success" | "warning" | "info" | "inactive";
type BadgeSize = "sm" | "md";

interface BadgeProps {
  variant?: BadgeVariant;
  size?: BadgeSize;
  children: React.ReactNode;
  className?: string;
}

const variantClasses: Record<BadgeVariant, string> = {
  default:  "bg-primary/10 text-primary",
  success:  "bg-[color:var(--color-status-success)]/15 text-[color:var(--color-status-success)]",
  warning:  "bg-accent/15 text-accent",
  info:     "bg-secondary/15 text-secondary",
  inactive: "bg-surface text-text/50",
};

const sizeClasses: Record<BadgeSize, string> = {
  sm: "px-1.5 py-0.5 text-[11px]",
  md: "px-2 py-0.5 text-xs",
};

export function Badge({
  variant = "default",
  size = "md",
  children,
  className = "",
}: BadgeProps) {
  return (
    <span
      className={[
        "inline-flex items-center font-mono font-medium uppercase tracking-wide",
        "rounded-[var(--radius-badge)]",
        variantClasses[variant],
        sizeClasses[size],
        className,
      ].join(" ")}
    >
      {children}
    </span>
  );
}
