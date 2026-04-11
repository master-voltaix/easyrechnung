import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center border px-2 py-0.5 text-[11px] font-semibold tracking-wider uppercase transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
  {
    variants: {
      variant: {
        default:
          "border-transparent bg-foreground text-background",
        secondary:
          "border-transparent bg-secondary text-secondary-foreground",
        destructive:
          "border-transparent bg-destructive/10 text-destructive border-destructive/30",
        outline:
          "text-foreground border-border",
        success:
          "border-transparent bg-emerald-50 text-emerald-700 border-emerald-200",
        warning:
          "border-transparent bg-amber-50 text-amber-700 border-amber-200",
        info:
          "border-transparent bg-sky-50 text-sky-700 border-sky-200",
        muted:
          "border-transparent bg-muted text-muted-foreground",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return (
    <div
      className={cn(badgeVariants({ variant }), className)}
      style={{ borderRadius: "2px", fontFamily: "var(--font-mono), 'IBM Plex Mono', monospace" }}
      {...props}
    />
  );
}

export { Badge, badgeVariants };
