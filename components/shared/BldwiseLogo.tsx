import Image from "next/image";
import Link from "next/link";
import { cn } from "@/lib/utils";

type BldwiseLogoProps = {
  href?: string;
  variant?: "light" | "dark";
  size?: "sm" | "md" | "lg";
  className?: string;
};

const ASPECT = 1240 / 291;

const heights = {
  sm: 34,
  md: 46,
  lg: 62,
};

export function BldwiseLogo({
  href = "/",
  variant = "dark",
  size = "md",
  className,
}: BldwiseLogoProps) {
  const height = heights[size];
  const content = (
    <Image
      src={
        variant === "light"
          ? "/bldwise-logo-wordmark-light.png"
          : "/bldwise-logo-wordmark.png"
      }
      alt="BLD-Wise.com.au"
      width={Math.round(height * ASPECT)}
      height={height}
      className="w-auto"
      style={{ height }}
      priority={size !== "sm"}
    />
  );

  const classes = cn("inline-flex items-center", className);

  if (href) {
    return (
      <Link href={href} className={classes}>
        {content}
      </Link>
    );
  }

  return <div className={classes}>{content}</div>;
}
