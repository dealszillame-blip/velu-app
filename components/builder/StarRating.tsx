import { Star } from "lucide-react";
import { cn } from "@/lib/utils";

type StarRatingProps = {
  rating: number;
  max?: number;
  size?: "sm" | "md";
  className?: string;
};

export function StarRating({
  rating,
  max = 5,
  size = "sm",
  className,
}: StarRatingProps) {
  const iconClass = size === "sm" ? "h-3.5 w-3.5" : "h-4 w-4";

  return (
    <div className={cn("flex items-center gap-0.5", className)} aria-label={`${rating} out of ${max} stars`}>
      {Array.from({ length: max }, (_, i) => {
        const filled = rating >= i + 1;
        const half = !filled && rating > i && rating < i + 1;
        return (
          <Star
            key={i}
            className={cn(
              iconClass,
              filled || half
                ? "fill-amber-400 text-amber-400"
                : "text-muted-foreground/30"
            )}
            strokeWidth={1.5}
          />
        );
      })}
    </div>
  );
}

type StarRatingInputProps = {
  value: number;
  onChange: (value: number) => void;
};

export function StarRatingInput({ value, onChange }: StarRatingInputProps) {
  return (
    <div className="flex gap-1">
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          onClick={() => onChange(star)}
          className="rounded p-0.5 transition-transform hover:scale-110"
          aria-label={`Rate ${star} stars`}
        >
          <Star
            className={cn(
              "h-5 w-5",
              value >= star
                ? "fill-amber-400 text-amber-400"
                : "text-muted-foreground/30"
            )}
            strokeWidth={1.5}
          />
        </button>
      ))}
    </div>
  );
}
