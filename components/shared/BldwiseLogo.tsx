import Image from "next/image";
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
  sm: { img: 26, word: "text-base" },
  md: { img: 34, word: "text-xl" },
  lg: { img: 48, word: "text-2xl" },
};

export function BldwiseLogo({
  href = "/",
  variant = "dark",
  size = "md",
  showWordmark = true,
  className,
}: BldwiseLogoProps) {
  const { img, word } = sizes[size];
  const content = (
    <>
      <Image
        src="/bldwise-logo-nav.png"
        alt="bldwise"
        width={img}
        height={img}
        className="h-[var(--logo-h)] w-auto"
        style={{ "--logo-h": `${img}px` } as React.CSSProperties}
        priority={size !== "sm"}
      />
      {showWordmark && (
        <span
          className={cn(
            "font-bold tracking-tight",
            word,
            variant === "light" ? "text-white" : "text-foreground"
          )}
        >
          bldwise
        </span>
      )}
    </>
  );

  const classes = cn("inline-flex items-center gap-2.5", className);

  if (href) {
    return (
      <Link href={href} className={classes}>
        {content}
      </Link>
    );
  }

  return <div className={classes}>{content}</div>;
}
