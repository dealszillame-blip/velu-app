import Image from "next/image";
import Link from "next/link";
import { cn } from "@/lib/utils";

type VeluLogoProps = {
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

export function VeluLogo({
  href = "/",
  variant = "dark",
  size = "md",
  showWordmark = true,
  className,
}: VeluLogoProps) {
  const { img, word } = sizes[size];
  const content = (
    <>
      <Image
        src="/velu-logo-nav.png"
        alt="Velu"
        width={img * 3}
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
          Velu
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
