import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";

export function Callout({
  icon: Icon,
  children,
}: {
  icon: LucideIcon;
  children: ReactNode;
}) {
  return (
    <div className="flex gap-3 rounded-xl border border-brand-border bg-brand-muted/60 px-4 py-3 text-sm text-ink">
      <Icon className="mt-0.5 h-5 w-5 shrink-0 text-brand" aria-hidden />
      <div className="leading-relaxed text-ink/90">{children}</div>
    </div>
  );
}
