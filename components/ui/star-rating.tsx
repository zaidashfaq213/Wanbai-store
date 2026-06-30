import { cn } from "@/lib/utils";
import { StarIcon } from "./icons";

export function StarRating({
  value,
  size = "size-4",
  className,
}: {
  value: number;
  size?: string;
  className?: string;
}) {
  return (
    <span className={cn("inline-flex items-center gap-0.5", className)} aria-label={`${value} / 5`}>
      {Array.from({ length: 5 }).map((_, i) => (
        <StarIcon
          key={i}
          className={cn(size, i < Math.round(value) ? "text-warning" : "text-border")}
        />
      ))}
    </span>
  );
}
