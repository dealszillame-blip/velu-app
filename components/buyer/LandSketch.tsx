import { formatSideMeters, LAND_SKETCH_VIEWBOX, landSketchEdges } from "@/lib/land-sketch";

type LandSketchProps = {
  labels: string[];
  lengths: Array<number | null | undefined>;
  activeIndex?: number | null;
  onSelect?: (index: number) => void;
};

export function LandSketch({ labels, lengths, activeIndex = null, onSelect }: LandSketchProps) {
  const { edges, points } = landSketchEdges(labels, lengths);
  if (!points) return null;

  return (
    <svg
      viewBox={LAND_SKETCH_VIEWBOX}
      role="img"
      aria-label="Sketch of the block. Side 1 is the front, then each following side around the block."
      className="h-auto w-full"
    >
      <polygon
        points={points}
        fill="var(--bldwise-green-dim)"
        stroke="var(--bldwise-green)"
        strokeWidth={2}
      />
      {edges.map((edge) => {
        const active = activeIndex === edge.index;
        const number = String(edge.index + 1);
        return (
          <g key={edge.index}>
            <line
              x1={edge.x1}
              y1={edge.y1}
              x2={edge.x2}
              y2={edge.y2}
              stroke={active ? "var(--bldwise-green-bright)" : "var(--bldwise-green)"}
              strokeWidth={active ? 4 : 2.5}
              strokeLinejoin="round"
            />
            <circle
              cx={edge.numberX}
              cy={edge.numberY}
              r={13}
              fill={active ? "var(--bldwise-mark)" : "var(--card)"}
              stroke="var(--bldwise-green)"
              strokeWidth={1.5}
              className={onSelect ? "cursor-pointer" : undefined}
              onClick={onSelect ? () => onSelect(edge.index) : undefined}
            />
            <text
              x={edge.numberX}
              y={edge.numberY}
              textAnchor="middle"
              dominantBaseline="central"
              fill={active ? "var(--bldwise-mark-ink)" : "var(--bldwise-green)"}
              fontSize={12}
              fontWeight={700}
              className={onSelect ? "cursor-pointer" : undefined}
              onClick={onSelect ? () => onSelect(edge.index) : undefined}
            >
              {number}
            </text>
            {edge.length != null ? (
              <text
                x={edge.lengthX}
                y={edge.lengthY}
                textAnchor="middle"
                dominantBaseline="central"
                fill="var(--ink)"
                fontSize={11}
                fontWeight={600}
              >
                {formatSideMeters(edge.length)}
              </text>
            ) : null}
          </g>
        );
      })}
    </svg>
  );
}
