import { forwardRef, isValidElement, cloneElement } from "react";

type ButtonVariant = "primary" | "secondary" | "ghost" | "danger";
type ButtonSize = "sm" | "md" | "lg";

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
  asChild?: boolean;
}

const variantClasses: Record<ButtonVariant, string> = {
  primary:
    "bg-primary text-white hover:bg-primary/90 focus-visible:ring-primary",
  secondary:
    "bg-secondary text-white hover:bg-secondary/90 focus-visible:ring-secondary",
  ghost:
    "bg-transparent text-primary hover:bg-primary/10 focus-visible:ring-primary",
  danger:
    "bg-red-700 text-white hover:bg-red-800 focus-visible:ring-red-600",
};

const sizeClasses: Record<ButtonSize, string> = {
  sm: "h-9 px-3 text-sm",
  md: "h-11 px-4 text-sm",   // h-11 = 44px — min tap target
  lg: "h-12 px-6 text-base",
};

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      variant = "primary",
      size = "md",
      loading = false,
      asChild = false,
      disabled,
      className = "",
      children,
      ...props
    },
    ref
  ) => {
    const isDisabled = disabled || loading;

    const combinedClassName = [
      "inline-flex items-center justify-center gap-2",
      "rounded-[var(--radius-button)] font-body font-medium",
      "transition-colors duration-150",
      "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2",
      "disabled:opacity-50 disabled:cursor-not-allowed",
      variantClasses[variant],
      sizeClasses[size],
      className,
    ].filter(Boolean).join(" ");

    const spinner = loading ? (
      <svg
        className="h-4 w-4 animate-spin"
        xmlns="http://www.w3.org/2000/svg"
        fill="none"
        viewBox="0 0 24 24"
        aria-hidden="true"
      >
        <circle
          className="opacity-25"
          cx="12"
          cy="12"
          r="10"
          stroke="currentColor"
          strokeWidth="4"
        />
        <path
          className="opacity-75"
          fill="currentColor"
          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
        />
      </svg>
    ) : null;

    if (asChild && isValidElement(children)) {
      const child = children as React.ReactElement<{ className?: string; children?: React.ReactNode; ref?: React.Ref<any> }>;
      return cloneElement(child, {
        ref,
        className: [combinedClassName, child.props.className].filter(Boolean).join(" "),
        ...props,
        children: (
          <>
            {spinner}
            {child.props.children}
          </>
        ),
      });
    }

    return (
      <button
        ref={ref}
        disabled={isDisabled}
        aria-busy={loading}
        className={combinedClassName}
        {...props}
      >
        {spinner}
        {children}
      </button>
    );
  }
);

Button.displayName = "Button";

export { Button };
export type { ButtonProps, ButtonVariant, ButtonSize };

