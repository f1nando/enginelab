import { type Sample, type Engine, torqueAt } from './engine';
import { getLocale, t } from './i18n';
import { axesLayout, curveYAtX, HorizontalScale, series, seriesMaxima, smoothSegments, tracePoints, wheelPixels, type ChartMode, type PlotPoint, type SeriesKey } from './chart-data';
export { series } from './chart-data';

export class Chart {
  mode: ChartMode = 'time';
  enabled = new Set<string>(['power', 'torque', 'fuel']);
  readonly view = new HorizontalScale();
  private pointer: { x: number; y: number } | null = null;
  private drag: { id: number; x: number; moved: boolean } | null = null;
  private lastTime = 0;
  private lastData: { samples: Sample[]; engine: Engine; time: number } | null = null;
  private hoverFrame = 0;
  private refreshHover() {
    if (this.hoverFrame) return;
    this.hoverFrame = requestAnimationFrame(() => {
      this.hoverFrame = 0;
      if (this.lastData) this.draw(this.lastData.samples, this.lastData.engine, this.lastData.time);
    });
  }
  constructor(public canvas: HTMLCanvasElement, private tooltip?: HTMLElement, private onViewChange?: () => void) {
    canvas.addEventListener('pointerdown', e => {
      if (e.button !== 0) return;
      const bounds = canvas.getBoundingClientRect();
      const { pad } = axesLayout(bounds.width, this.enabled, this.mode, this.lastData?.engine);
      const x = e.clientX - bounds.left, y = e.clientY - bounds.top;
      if (x < pad.l || x > bounds.width - pad.r || y < pad.t || y > bounds.height - pad.b) return;
      e.preventDefault();
      this.drag = { id: e.pointerId, x: e.clientX, moved: false };
      this.pointer = { x, y };
      this.refreshHover();
      canvas.setPointerCapture(e.pointerId);
      canvas.classList.add('dragging');
    });
    canvas.addEventListener('pointermove', e => {
      const bounds = canvas.getBoundingClientRect();
      if (this.drag?.id === e.pointerId) {
        const dx = e.clientX - this.drag.x;
        if (!this.drag.moved && Math.abs(dx) < 3) return;
        this.drag.moved = true;
        const { pad } = axesLayout(bounds.width, this.enabled, this.mode, this.lastData?.engine);
        this.view.pan(this.mode, -dx / Math.max(1, bounds.width - pad.l - pad.r), this.lastTime);
        this.drag.x = e.clientX;
        this.pointer = null;
        this.onViewChange?.();
        return;
      }
      this.pointer = { x: e.clientX - bounds.left, y: e.clientY - bounds.top };
      this.refreshHover();
    });
    const endDrag = (e: PointerEvent) => {
      if (this.drag?.id !== e.pointerId) return;
      this.drag = null;
      canvas.classList.remove('dragging');
      if (canvas.hasPointerCapture(e.pointerId)) canvas.releasePointerCapture(e.pointerId);
    };
    canvas.addEventListener('pointerup', endDrag);
    canvas.addEventListener('pointercancel', endDrag);
    canvas.addEventListener('lostpointercapture', endDrag);
    canvas.addEventListener('pointerleave', () => {
      if (this.drag) return;
      this.pointer = null;
      if (this.tooltip) this.tooltip.hidden = true;
      this.refreshHover();
    });
    canvas.parentElement!.addEventListener('wheel', e => {
      // Keep Ctrl/Cmd + wheel available for the browser's accessibility zoom.
      if (e.ctrlKey || e.metaKey || !e.deltaY || this.drag) return;
      const bounds = canvas.getBoundingClientRect();
      const { pad } = axesLayout(bounds.width, this.enabled, this.mode, this.lastData?.engine);
      const x = e.clientX - bounds.left, y = e.clientY - bounds.top;
      if (x < pad.l || x > bounds.width - pad.r || y < pad.t || y > bounds.height - pad.b) return;
      e.preventDefault();
      this.view.zoom(this.mode, wheelPixels(e.deltaY, e.deltaMode, bounds.height), (x - pad.l) / (bounds.width - pad.l - pad.r));
      this.pointer = { x, y };
      this.onViewChange?.();
    }, { passive: false });
    canvas.addEventListener('dblclick', () => this.resetZoom());
  }

  resetZoom() { this.view.reset(this.mode); this.onViewChange?.(); }

  draw(samples: Sample[], engine: Engine, time: number) {
    this.lastTime = time;
    this.lastData = { samples, engine, time };
    const c = this.canvas;
    const w = c.clientWidth, h = c.clientHeight;
    if (!w || !h) return;
    const dpr = window.devicePixelRatio || 1;
    if (c.width !== Math.round(w * dpr) || c.height !== Math.round(h * dpr)) {
      c.width = Math.round(w * dpr); c.height = Math.round(h * dpr);
    }
    const ctx = c.getContext('2d')!;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, w, h);
    const { pad, axes } = axesLayout(w, this.enabled, this.mode, engine);
    const pw = w - pad.l - pad.r, ph = h - pad.t - pad.b;
    if (pw <= 0 || ph <= 0) return;
    const range = this.view.range(this.mode, time, engine.redline);
    const span = range.end - range.start;
    const maxima = seriesMaxima(engine);
    const rows = h > 400 ? 8 : 4;
    ctx.fillStyle = '#121212'; ctx.fillRect(pad.l, pad.t, pw, ph);
    // Subtle bands identify limiter intervention, rather than hiding it with cosmetic filtering.
    if (this.mode === 'time') {
      const start = range.start;
      ctx.fillStyle = '#ffffff06';
      ctx.strokeStyle = '#ffffff24'; ctx.lineWidth = 2;
      let bandStart: number | null = null;
      for (let i = 0; i <= samples.length; i++) {
        const sample = samples[i];
        const limited = sample && sample.time >= start && sample.time <= range.end && sample.limiter;
        if (limited && bandStart === null) bandStart = Math.max(start, i ? samples[i - 1].time : sample.time);
        if (!limited && bandStart !== null) {
          const end = Math.min(time, range.end, sample?.time ?? time);
          const x = pad.l + (bandStart - start) / span * pw, width = (end - bandStart) / span * pw;
          ctx.fillRect(x, pad.t, width, ph);
          ctx.beginPath(); ctx.moveTo(x, pad.t); ctx.lineTo(x + width, pad.t); ctx.stroke();
          bandStart = null;
        }
      }
    }
    ctx.font = `${w < 400 ? 8 : 10}px Arial, sans-serif`;
    ctx.lineWidth = 1;
    for (let i = 0; i <= rows; i++) {
      const y = pad.t + ph * i / rows;
      ctx.strokeStyle = i === rows ? '#414141' : i % 2 === 0 ? '#292929' : '#202020';
      ctx.setLineDash(i > 0 && i < rows ? [2, 5] : []);
      ctx.beginPath(); ctx.moveTo(pad.l, y); ctx.lineTo(w - pad.r, y); ctx.stroke();
    }
    ctx.setLineDash([]);
    for (const axis of axes) {
      const ticks = axis.key === 'gear' ? maxima.gear : rows;
      ctx.textAlign = 'center'; ctx.fillStyle = axis.color;
      for (let i = 0; i <= ticks; i++) {
        const value = maxima[axis.key] * (1 - i / ticks);
        const label = axis.key === 'boost' ? value.toLocaleString(getLocale(), { minimumFractionDigits: 1, maximumFractionDigits: 2 }) : String(Math.round(value));
        ctx.fillText(axis.key === 'gear' && value === 0 ? 'N' : label, axis.x + axis.width / 2, pad.t + ph * i / ticks + 3);
      }
      ctx.strokeStyle = `${axis.color}24`;
      const x = axis.side === 'left' ? axis.x + axis.width - 1 : axis.x;
      ctx.beginPath(); ctx.moveTo(x, pad.t); ctx.lineTo(x, h - pad.b); ctx.stroke();
    }
    const columns = pw < 250 ? 3 : 6;
    ctx.textAlign = 'center';
    for (let i = 0; i <= columns; i++) {
      const x = pad.l + pw * i / columns;
      ctx.strokeStyle = '#242424'; ctx.setLineDash([2, 5]); ctx.beginPath(); ctx.moveTo(x, pad.t); ctx.lineTo(x, h - pad.b); ctx.stroke(); ctx.setLineDash([]);
      ctx.fillStyle = '#808080';
      const value = range.start + span * i / columns;
      ctx.fillText(value.toLocaleString(getLocale(), { maximumFractionDigits: this.mode === 'time' && span < 12 ? 1 : 0 }), x, h - 12);
    }
    ctx.textAlign = 'right'; ctx.fillText(t(this.mode === 'time' ? 'с' : 'об/мин'), w - 2, h - 12);
    const traces = new Map<SeriesKey, PlotPoint[]>();
    for (const s of series) {
      if (!axes.some(a => a.key === s.key)) continue;
      let points: PlotPoint[];
      if (this.mode === 'time') {
        points = tracePoints(samples, s.key, range.start, maxima[s.key], pad.l, pad.t, pw, ph, span);
      } else {
        points = Array.from({ length: 121 }, (_, i) => {
          const rpm = engine.idle + (engine.redline - engine.idle) * i / 120;
          const torque = torqueAt(engine, rpm);
          const value = s.key === 'torque' ? torque : torque * rpm / 7023.5;
          return { x: pad.l + (rpm - range.start) / span * pw, y: pad.t + ph * (1 - value / maxima[s.key]) };
        });
      }
      if (!points.length) continue;
      traces.set(s.key, points);
      ctx.save(); ctx.beginPath(); ctx.rect(pad.l, pad.t - 1, pw, ph + 2); ctx.clip();
      ctx.beginPath(); ctx.moveTo(points[0].x, points[0].y);
      if (s.key === 'gear') points.slice(1).forEach(p => ctx.lineTo(p.x, p.y));
      else for (const segment of smoothSegments(points)) ctx.bezierCurveTo(segment.c1.x, segment.c1.y, segment.c2.x, segment.c2.y, segment.to.x, segment.to.y);
      ctx.strokeStyle = s.color; ctx.lineWidth = s.key === 'gear' ? 2.2 : 2;
      ctx.lineJoin = 'round'; ctx.lineCap = 'round'; ctx.shadowColor = `${s.color}55`; ctx.shadowBlur = 4; ctx.stroke();
      ctx.shadowBlur = 0;
      const last = points[points.length - 1];
      ctx.fillStyle = s.color; ctx.beginPath(); ctx.arc(last.x, last.y, 2.5, 0, 2 * Math.PI); ctx.fill();
      ctx.restore();
    }
    if (this.tooltip) this.tooltip.hidden = true;
    if (this.pointer && axes.length && this.pointer.x >= pad.l && this.pointer.x <= w - pad.r && this.pointer.y >= pad.t && this.pointer.y <= h - pad.b) {
      const x = this.pointer.x;
      const horizontalValue = range.start + (x - pad.l) / pw * span;
      const values = axes.flatMap(s => {
        const y = curveYAtX(traces.get(s.key) ?? [], x, s.key === 'gear');
        return y === undefined ? [] : [{ ...s, y, value: s.key === 'gear' ? Math.round((1 - (y - pad.t) / ph) * maxima[s.key]) : (1 - (y - pad.t) / ph) * maxima[s.key] }];
      });
      // Never show the last reading in blank future space, or invent points before data exists.
      if (values.length) {
        ctx.save(); ctx.beginPath(); ctx.rect(pad.l - 5, pad.t - 5, pw + 10, ph + 10); ctx.clip();
        ctx.strokeStyle = '#ffffff88'; ctx.setLineDash([3, 4]); ctx.lineWidth = 1;
        ctx.beginPath(); ctx.moveTo(x, pad.t); ctx.lineTo(x, h - pad.b); ctx.stroke(); ctx.setLineDash([]);
        for (const s of values) {
          ctx.fillStyle = `${s.color}25`; ctx.beginPath(); ctx.arc(x, s.y, 7, 0, 2 * Math.PI); ctx.fill();
          ctx.fillStyle = '#151515'; ctx.strokeStyle = s.color; ctx.lineWidth = 2;
          ctx.beginPath(); ctx.arc(x, s.y, 4, 0, 2 * Math.PI); ctx.fill(); ctx.stroke();
          ctx.fillStyle = s.color; ctx.beginPath(); ctx.arc(x, s.y, 1.3, 0, 2 * Math.PI); ctx.fill();
        }
        ctx.restore();
        if (this.tooltip) {
          const f = (v: number, digits = 1) => v.toLocaleString(getLocale(), { maximumFractionDigits: digits, minimumFractionDigits: digits });
          const heading = `${t(this.mode === 'time' ? 'Время' : 'Обороты')}: ${f(horizontalValue, this.mode === 'time' ? 2 : 0)} ${t(this.mode === 'time' ? 'с' : 'об/мин')}`;
          const nextIndex = this.mode === 'time' ? samples.findIndex(p => p.time > horizontalValue) : 0;
          const observed = samples[(nextIndex < 0 ? samples.length : nextIndex) - 1];
          this.tooltip.classList.toggle('compact', h < 300 && w > 480 && values.length > 3);
          this.tooltip.innerHTML = `<div class="tooltip-heading">${heading}${this.mode === 'time' && observed?.limiter ? ` · ${t('Предел оборотов')}` : ''}</div><div class="tooltip-values">${values.map(s => `<div class="tooltip-row"><span><i style="background:${s.color}"></i>${t(s.name)}</span><b>${s.key === 'gear' && s.value === 0 ? 'N' : f(Math.max(0, s.value), s.key === 'gear' || s.key === 'rpm' ? 0 : s.key === 'boost' ? 2 : 1)} <small>${t(s.unit)}</small></b></div>`).join('')}</div><div class="tooltip-note">${t('Значения на линии · интерполяция')}</div>`;
          this.tooltip.hidden = false;
          const left = x + 16 + this.tooltip.offsetWidth > w - 3 ? x - this.tooltip.offsetWidth - 16 : x + 16;
          this.tooltip.style.left = `${Math.max(3, Math.min(w - this.tooltip.offsetWidth - 3, left))}px`;
          this.tooltip.style.top = `${Math.max(pad.t, Math.min(h - this.tooltip.offsetHeight - pad.b, this.pointer.y - 16))}px`;
        }
      }
    }
    if (!axes.length || (this.mode === 'time' && !samples.length)) {
      ctx.fillStyle = '#777'; ctx.textAlign = 'center'; ctx.font = '11px Arial, sans-serif';
      ctx.fillText(t(axes.length ? 'Нет данных' : 'Серии скрыты'), pad.l + pw / 2, pad.t + ph / 2);
    }
  }

  /** Compose a clean, high-DPI snapshot with DOM axis headings reproduced in the image. */
  async createPNG(samples: Sample[], engine: Engine, time: number): Promise<Blob> {
    const pointer = this.pointer;
    let image: HTMLCanvasElement;
    try {
      this.pointer = null;
      this.draw(samples, engine, time);
      const w = this.canvas.clientWidth, h = this.canvas.clientHeight;
      if (!w || !h) throw new Error('Chart is not visible');
      const { axes } = axesLayout(w, this.enabled, this.mode, engine);
      const active = series.filter(s => axes.some(a => a.key === s.key));
      const columns = Math.max(1, Math.min(active.length || 1, Math.floor((w - 24) / 150)));
      const rows = Math.max(1, Math.ceil(active.length / columns));
      const top = 59 + rows * 23, bottom = 33;
      const dpr = this.canvas.width / w;
      image = document.createElement('canvas');
      image.width = Math.round(w * dpr); image.height = Math.round((h + top + bottom) * dpr);
      const ctx = image.getContext('2d')!;
      ctx.scale(dpr, dpr);
      ctx.fillStyle = '#101010'; ctx.fillRect(0, 0, w, h + top + bottom);
      ctx.fillStyle = '#eee'; ctx.font = 'bold 14px Arial, sans-serif'; ctx.fillText('enginelab', 12, 22);
      const fit = (text: string, width: number) => {
        let result = text;
        while (result.length && ctx.measureText(result).width > width) result = result.slice(0, -1);
        return result === text ? text : `${result.slice(0, -1)}…`;
      };
      ctx.font = '11px Arial, sans-serif'; ctx.fillStyle = '#bbb';
      ctx.fillText(fit(`${t(engine.brand)} ${t(engine.name)} · ${t(engine.car)}`, w - 24), 12, 43);
      const cell = (w - 24) / columns;
      active.forEach((s, i) => {
        const x = 12 + (i % columns) * cell, y = 62 + Math.floor(i / columns) * 23;
        ctx.strokeStyle = s.color; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(x, y - 3); ctx.lineTo(x + 14, y - 3); ctx.stroke();
        ctx.fillStyle = '#ddd'; ctx.font = '10px Arial, sans-serif';
        ctx.fillText(fit(`${t(s.name)}${s.unit ? ` (${t(s.unit)})` : ''}`, cell - 25), x + 21, y);
      });
      if (!active.length) { ctx.fillStyle = '#888'; ctx.fillText(t('Серии скрыты'), 12, 62); }
      ctx.drawImage(this.canvas, 0, top, w, h);
      for (const axis of axes) {
        const center = axis.x + axis.width / 2;
        ctx.textAlign = 'center'; ctx.fillStyle = axis.color; ctx.font = '9px Arial, sans-serif';
        ctx.fillText(fit(t(axis.short), axis.width - 2), center, top + 22);
        ctx.font = '8px Arial, sans-serif';
        ctx.fillText(axis.key === 'gear' ? `N / 1–${engine.gears.length}` : t(axis.unit), center, top + 36);
      }
      ctx.textAlign = 'left'; ctx.fillStyle = '#999'; ctx.font = '10px Arial, sans-serif';
      const range = this.view.range(this.mode, time, engine.redline);
      const f = (value: number) => value.toLocaleString(getLocale(), { maximumFractionDigits: this.mode === 'time' ? 1 : 0 });
      const caption = `${t(this.mode === 'time' ? 'Время' : 'Обороты')}: ${f(range.start)}–${f(range.end)} ${t(this.mode === 'time' ? 'с' : 'об/мин')}`;
      ctx.fillText(caption, 12, top + h + 20);
    } finally {
      this.pointer = pointer;
      this.draw(samples, engine, time);
    }
    return new Promise((resolve, reject) => image.toBlob(blob => blob ? resolve(blob) : reject(new Error('PNG encoding failed')), 'image/png'));
  }
}
