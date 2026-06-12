import { MapPin } from "lucide-react";
import { cn } from "@/lib/utils";

type LandThumbnailProps = {
  className?: string;
  size?: "sm" | "md";
};

export function LandThumbnail({ className, size = "md" }: LandThumbnailProps) {
  return (
    <div
      className={cn(
        "relative overflow-hidden",
        // Warm earthy gradient — mimics arid Australian land
        "bg-gradient-to-br from-[#e8dcc8] via-[#d4c4a0] to-[#c4b48a]",
        size === "sm" ? "aspect-[5/3] rounded-xl" : "aspect-[16/9] rounded-t-2xl",
        className
      )}
    >
      {/* Subtle topographic rings */}
      <svg
        className="absolute inset-0 h-full w-full opacity-[0.12]"
        viewBox="0 0 400 225"
        preserveAspectRatio="xMidYMid slice"
        aria-hidden
      >
        <ellipse cx="200" cy="112" rx="180" ry="90" fill="none" stroke="#5c4a2a" strokeWidth="1.5" />
        <ellipse cx="200" cy="112" rx="140" ry="68" fill="none" stroke="#5c4a2a" strokeWidth="1.5" />
        <ellipse cx="200" cy="112" rx="100" ry="48" fill="none" stroke="#5c4a2a" strokeWidth="1.5" />
        <ellipse cx="200" cy="112" rx="62" ry="30" fill="none" stroke="#5c4a2a" strokeWidth="1.5" />
        {/* Block boundary lines */}
        <rect x="100" y="55" width="200" height="115" fill="none" stroke="#5c4a2a" strokeWidth="2" rx="2" strokeDasharray="6 3" />
      </svg>

      {/* Pin icon centred */}
      <div className="absolute inset-0 flex items-center justify-center">
        <div
          className={cn(
            "flex items-center justify-center rounded-full bg-white/70 backdrop-blur-sm",
            size === "sm" ? "h-7 w-7" : "h-10 w-10"
          )}
        >
          <MapPin
            className={cn(
              "text-[#5c4a2a]",
              size === "sm" ? "h-3.5 w-3.5" : "h-5 w-5"
            )}
            strokeWidth={2}
          />
        </div>
      </div>

      {/* Subtle vignette */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/10 to-transparent" />
    </div>
  );
}
