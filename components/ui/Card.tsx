type CardVariant = "default" | "elevated";
type CardPadding = "sm" | "md" | "lg" | "none";

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: CardVariant;
  padding?: CardPadding;
  interactive?: boolean; // hover elevation
}

const paddingClasses: Record<CardPadding, string> = {
  none: "",
  sm: "p-3",
  md: "p-5",
  lg: "p-8",
};

export function Card({
  variant = "default",
  padding = "md",
  interactive = false,
  className = "",
  children,
  ...props
}: CardProps) {
  return (
    <div
      className={[
        "rounded-[var(--radius-card)] border border-surface bg-surface/60",
        variant === "elevated" ? "shadow-md" : "",
        interactive
          ? "transition-shadow duration-150 hover:shadow-md cursor-pointer"
          : "",
        paddingClasses[padding],
        className,
      ].join(" ")}
      {...props}
    >
      {children}
    </div>
  );
}
