export type SketchPoint = { x: number; y: number };

export type SketchEdge = {
  index: number;
  label: string;
  length: number | null;
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  numberX: number;
  numberY: number;
  lengthX: number;
  lengthY: number;
};

export const LAND_SKETCH_WIDTH = 360;
export const LAND_SKETCH_HEIGHT = 280;
export const LAND_SKETCH_VIEWBOX = `0 0 ${LAND_SKETCH_WIDTH} ${LAND_SKETCH_HEIGHT}`;

function positive(value: number | null | undefined, fallback: number) {
  return value != null && Number.isFinite(value) && value > 0 ? value : fallback;
}

/** Closed block outline. Side 1 is the front (bottom). The walk continues to the left, then the rear, then the right. */
export function landSketchEdges(
  labels: string[],
  lengths: Array<number | null | undefined>
): { edges: SketchEdge[]; points: string } {
  const count = labels.length;
  if (count < 3) return { edges: [], points: "" };

  const raw = count === 4 ? trapezoid(lengths) : regularPolygon(count);
  const fitted = fit(raw, 52, LAND_SKETCH_WIDTH, LAND_SKETCH_HEIGHT);
  const centerX = fitted.reduce((sum, point) => sum + point.x, 0) / count;
  const centerY = fitted.reduce((sum, point) => sum + point.y, 0) / count;

  const edges = labels.map((label, index) => {
    const start = fitted[index];
    const end = fitted[(index + 1) % count];
    const midX = (start.x + end.x) / 2;
    const midY = (start.y + end.y) / 2;
    const outwardX = midX - centerX;
    const outwardY = midY - centerY;
    const span = Math.hypot(outwardX, outwardY) || 1;
    const unitX = outwardX / span;
    const unitY = outwardY / span;
    const length = lengths[index];
    return {
      index,
      label,
      length: length != null && Number.isFinite(length) && length > 0 ? length : null,
      x1: start.x,
      y1: start.y,
      x2: end.x,
      y2: end.y,
      numberX: midX + unitX * 22,
      numberY: midY + unitY * 22,
      lengthX: midX - unitX * 16,
      lengthY: midY - unitY * 16,
    };
  });

  return {
    edges,
    points: fitted.map((point) => `${point.x.toFixed(1)},${point.y.toFixed(1)}`).join(" "),
  };
}

function trapezoid(lengths: Array<number | null | undefined>): SketchPoint[] {
  const front = positive(lengths[0], 16);
  const left = positive(lengths[1], 30);
  const rear = positive(lengths[2], 16);
  const right = positive(lengths[3], 30);
  const halfHeight = (left + right) / 4;
  return [
    { x: front / 2, y: halfHeight },
    { x: -front / 2, y: halfHeight },
    { x: -rear / 2, y: -halfHeight },
    { x: rear / 2, y: -halfHeight },
  ];
}

function regularPolygon(count: number): SketchPoint[] {
  const radius = 100;
  return Array.from({ length: count }, (_, index) => {
    const angle = Math.PI / count + index * ((2 * Math.PI) / count);
    return { x: radius * Math.cos(angle), y: radius * Math.sin(angle) };
  });
}

function fit(points: SketchPoint[], pad: number, width: number, height: number): SketchPoint[] {
  const minX = Math.min(...points.map((point) => point.x));
  const maxX = Math.max(...points.map((point) => point.x));
  const minY = Math.min(...points.map((point) => point.y));
  const maxY = Math.max(...points.map((point) => point.y));
  const spanX = maxX - minX || 1;
  const spanY = maxY - minY || 1;
  const scale = Math.min((width - pad * 2) / spanX, (height - pad * 2) / spanY);
  const offsetX = (width - spanX * scale) / 2;
  const offsetY = (height - spanY * scale) / 2;
  return points.map((point) => ({
    x: offsetX + (point.x - minX) * scale,
    y: offsetY + (point.y - minY) * scale,
  }));
}

export function formatSideMeters(length: number): string {
  const rounded = Math.round(length * 100) / 100;
  return `${rounded} m`;
}
