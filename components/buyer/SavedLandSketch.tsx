import { LandSketch } from "@/components/buyer/LandSketch";
import type { BoundarySide } from "@/lib/buyer-requirements";

type SavedLandSketchProps = {
  sides: BoundarySide[];
  heading?: string;
  description?: string;
};

export function SavedLandSketch({
  sides,
  heading = "Land sketch",
  description = "Sides in the order entered, starting at the front.",
}: SavedLandSketchProps) {
  if (sides.length < 4) return null;

  return (
    <section className="surface-subtle p-4 sm:p-5">
      <p className="font-medium tracking-tight">{heading}</p>
      <p className="mt-1 text-sm text-muted-foreground">{description}</p>
      <div className="mt-4 grid items-center gap-4 sm:grid-cols-[minmax(0,16rem)_1fr]">
        <LandSketch
          labels={sides.map((side) => side.label)}
          lengths={sides.map((side) => side.length_meters)}
        />
        <ol className="space-y-1 text-sm">
          {sides.map((side, index) => (
            <li key={`${side.label}-${index}`}>
              <span className="font-medium">
                {index + 1} · {side.label}
              </span>
              <span className="text-muted-foreground"> — {side.length_meters} m</span>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
