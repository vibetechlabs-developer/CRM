import { cn } from "@/lib/utils";

type SpinnerProps = {
  size?: "sm" | "md" | "lg";
  className?: string;
};

export function Spinner({ size = "md", className }: SpinnerProps) {
  const base =
    "inline-block rounded-full border-2 border-primary/70 border-r-transparent animate-spin";

  const sizes: Record<NonNullable<SpinnerProps["size"]>, string> = {
    sm: "h-4 w-4",
    md: "h-5 w-5",
    lg: "h-8 w-8",
  };

  return <span className={cn(base, sizes[size], className)} aria-hidden="true" />;
}

