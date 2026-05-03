import type { ButtonHTMLAttributes, ReactNode } from "react";

type Variant = "primary" | "secondary" | "ghost";

export function Button({
  variant = "primary",
  className = "",
  children,
  type = "button",
  ...rest
}: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: Variant; children: ReactNode }) {
  const base =
    "inline-flex items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-sm font-medium transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand disabled:opacity-50";
  const styles: Record<Variant, string> = {
    primary: "bg-brand text-white hover:bg-brand-dark shadow-sm",
    secondary:
      "border border-line bg-white text-ink hover:bg-surface-page",
    ghost: "border border-brand/30 text-brand bg-brand-muted/40 hover:bg-brand-muted",
  };
  return (
    <button type={type} className={`${base} ${styles[variant]} ${className}`} {...rest}>
      {children}
    </button>
  );
}
