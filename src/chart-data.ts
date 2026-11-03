import type { Engine, Sample } from './engine';

export const series = [
  { key: 'power', name: 'Мощность', short: 'Мощность', unit: 'л.с.', color: '#66b5ff', side: 'left' },
  { key: 'torque', name: 'Крутящий момент', short: 'Момент', unit: 'Н·м', color: '#f2ae66', side: 'left' },
  { key: 'fuel', name: 'Расход топлива', short: 'Расход', unit: 'л/ч', color: '#c28bfa', side: 'right' },
  { key: 'rpm', name: 'Обороты', short: 'Обороты', unit: 'об/мин', color: '#f27c96', side: 'left' },
  { key: 'speed', name: 'Скорость', short: 'Скорость', unit: 'км/ч', color: '#65d3c8', side: 'right' },
  { key: 'gear', name: 'Передача', short: 'Передача', unit: '', color: '#e7d36d', side: 'right' },
  { key: 'boost', name: 'Давление наддува', short: 'Наддув', unit: 'бар', color: '#e6a9d4', side: 'right' },
] as const;
export type SeriesKey = typeof series[number]['key'];
export type ChartMode = 'time' | 'rpm';
export function wheelPixels(delta: number, mode: number, viewportHeight: number): number {
  return delta * (mode === 1 ? 16 : mode === 2 ? viewportHeight : 1);
}

/** Time zoom stays live at the right edge; RPM zoom stays anchored under the pointer. */
export class HorizontalScale {
  timeWindow = 30;
  private timeEnd: number | null = null;
  rpmStart = 0;
  rpmEnd = 1;
  get followingLive() { return this.timeEnd === null; }
  followLive() { this.timeEnd = null; }
  /** Positive movement advances the viewport; dragging the drawing right passes a negative delta. */
  pan(mode: ChartMode, fraction: number, time: number) {
    if (!Number.isFinite(fraction)) return;
    if (mode === 'time') {
      const current = this.range('time', time, 1);
      const latestStart = Math.max(0, time - this.timeWindow);
      const start = Math.max(0, Math.min(latestStart, current.start + fraction * this.timeWindow));
      this.timeEnd = start >= latestStart - 1e-7 ? null : start + this.timeWindow;
    } else {
      const span = this.rpmEnd - this.rpmStart;
      this.rpmStart = Math.max(0, Math.min(1 - span, this.rpmStart + fraction * span));
      this.rpmEnd = this.rpmStart + span;
    }
  }
  zoom(mode: ChartMode, delta: number, anchor = .5) {
    if (!Number.isFinite(delta) || delta === 0) return;
    const factor = Math.exp(Math.max(-240, Math.min(240, delta)) * .002);
    if (mode === 'time') {
      this.timeWindow = Math.max(2, Math.min(300, this.timeWindow * factor));
    } else {
      const span = this.rpmEnd - this.rpmStart;
      const width = Math.max(.08, Math.min(1, span * factor));
      const fraction = Math.max(0, Math.min(1, anchor));
      const center = this.rpmStart + fraction * span;
      this.rpmStart = Math.max(0, Math.min(1 - width, center - fraction * width));
      this.rpmEnd = this.rpmStart + width;
    }
  }
  range(mode: ChartMode, time: number, redline: number) {
    return mode === 'time'
      ? { start: Math.max(0, Math.min(this.timeEnd ?? time, time) - this.timeWindow), end: Math.max(this.timeWindow, Math.min(this.timeEnd ?? time, time)) }
      : { start: this.rpmStart * redline, end: this.rpmEnd * redline };
  }
  reset(mode?: ChartMode) {
    if (!mode || mode === 'time') { this.timeWindow = 30; this.timeEnd = null; }
    if (!mode || mode === 'rpm') { this.rpmStart = 0; this.rpmEnd = 1; }
  }
}
export function supportsMode(key: SeriesKey, mode: ChartMode, engine?: Engine): boolean {
  return (mode === 'time' || key === 'power' || key === 'torque') && (key !== 'boost' || !engine || !!engine.turbo);
}
export function seriesMaxima(engine: Engine): Record<SeriesKey, number> {
  return {
    power: Math.ceil(engine.power * 1.15 / 50) * 50,
    torque: Math.ceil(engine.torque * 1.1 / 100) * 100,
    fuel: Math.ceil(engine.power * .4 / 20) * 20,
    rpm: Math.ceil((engine.redline + 130) / 1000) * 1000,
    speed: 400,
    gear: engine.gears.length,
    boost: 1.2,
  };
}
export function axesLayout(width: number, enabled: ReadonlySet<string>, mode: ChartMode, engine?: Engine) {
  const active = series.filter(s => enabled.has(s.key) && supportsMode(s.key, mode, engine));
  const laneWidth = width < 400 ? (active.length > 6 ? 25 : 29) : width < 700 ? 41 : 54;
  const left = active.filter(s => s.side === 'left');
  const right = active.filter(s => s.side === 'right');
  const pad = { l: 8 + left.length * laneWidth, r: 8 + right.length * laneWidth, t: 52, b: 32 };
  const axes = [
    ...left.map((s, i) => ({ ...s, x: 4 + i * laneWidth, width: laneWidth })),
    ...right.map((s, i) => ({ ...s, x: width - 4 - (right.length - i) * laneWidth, width: laneWidth })),
  ];
  return { pad, axes };
}

export interface PlotPoint { x: number; y: number; }
export interface CurveSegment { from: PlotPoint; c1: PlotPoint; c2: PlotPoint; to: PlotPoint; }

/** Shape-preserving Hermite curves: pass through measurements without inventing overshoot. */
export function smoothSegments(points: PlotPoint[]): CurveSegment[] {
  if (points.length < 2) return [];
  const slopes = points.slice(1).map((p, i) => (p.y - points[i].y) / Math.max(1e-9, p.x - points[i].x));
  const tangents = points.map((_, i) => {
    if (i === 0) return slopes[0];
    if (i === points.length - 1) return slopes[slopes.length - 1];
    const before = slopes[i - 1], after = slopes[i];
    return before * after <= 0 ? 0 : 2 / (1 / before + 1 / after);
  });
  return points.slice(1).map((to, i) => {
    const from = points[i], dx = Math.max(0, to.x - from.x);
    const low = Math.min(from.y, to.y), high = Math.max(from.y, to.y);
    const clamp = (value: number) => Math.max(low, Math.min(high, value));
    return { from, c1: { x: from.x + dx / 3, y: clamp(from.y + tangents[i] * dx / 3) }, c2: { x: to.x - dx / 3, y: clamp(to.y - tangents[i + 1] * dx / 3) }, to };
  });
}

/** Inspect exactly the displayed curve at X; step lines hold their last discrete value. */
export function curveYAtX(points: PlotPoint[], x: number, step = false): number | undefined {
  if (!points.length || !Number.isFinite(x) || x < points[0].x || x > points[points.length - 1].x) return undefined;
  let low = 0, high = points.length - 1;
  while (low < high) {
    const mid = Math.ceil((low + high) / 2);
    if (points[mid].x <= x) low = mid; else high = mid - 1;
  }
  if (step || low === points.length - 1 || points[low].x === x) return points[low].y;
  const segment = smoothSegments(points)[low];
  const fraction = (x - segment.from.x) / (segment.to.x - segment.from.x);
  const inverse = 1 - fraction;
  return inverse ** 3 * segment.from.y + 3 * inverse ** 2 * fraction * segment.c1.y + 3 * inverse * fraction ** 2 * segment.c2.y + fraction ** 3 * segment.to.y;
}
/** Hold the last gear until the next sample: no invented intermediate gears. */
export function tracePoints(samples: Sample[], key: SeriesKey, start: number, maximum: number, x: number, y: number, width: number, height: number, duration = 30): PlotPoint[] {
  let first = samples.findIndex(p => p.time >= start);
  if (first < 0) return [];
  // Include the predecessor so the line reaches the left edge of a sliding window.
  first = Math.max(0, first - 1);
  const points: PlotPoint[] = [];
  for (let i = first; i < samples.length; i++) {
    const sample = samples[i];
    const px = x + (sample.time - start) / duration * width;
    const py = y + height * (1 - sample[key] / maximum);
    if (key === 'gear' && points.length) points.push({ x: px, y: points[points.length - 1].y });
    points.push({ x: px, y: py });
    // Keep one successor for interpolation at the right edge, not the entire future history.
    if (sample.time > start + duration) break;
  }
  return points;
}
