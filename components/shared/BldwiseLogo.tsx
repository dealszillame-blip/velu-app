import Link from "next/link";
import { cn } from "@/lib/utils";

type BldwiseLogoProps = {
  href?: string;
  variant?: "light" | "dark";
  size?: "sm" | "md" | "lg";
  showWordmark?: boolean;
  className?: string;
};

const sizes = {
  sm: "text-base",
  md: "text-xl",
  lg: "text-2xl",
};

export function BldwiseLogo({
  href = "/",
  variant = "dark",
  size = "md",
  showWordmark = true,
  className,
}: BldwiseLogoProps) {
  if (!showWordmark) return null;

  const content = (
    <span
      className={cn(
        "font-bold tracking-tight",
        sizes[size],
        variant === "light" ? "text-white" : "text-foreground"
      )}
    >
      bldwise
    </span>
  );

  if (href) {
    return (
      <Link href={href} className={cn("inline-flex items-center", className)}>
        {content}
      </Link>
    );
  }

  return <div className={cn("inline-flex items-center", className)}>{content}</div>;
}
