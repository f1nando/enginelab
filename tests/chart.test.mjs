import test from 'node:test';
import assert from 'node:assert/strict';
import { engines } from '../src/engine.ts';
import { axesLayout, series, seriesMaxima, supportsMode, tracePoints, smoothSegments, curveYAtX, HorizontalScale, wheelPixels } from '../src/chart-data.ts';

test('seven series have unique colors and valid independent scales', () => {
  assert.equal(series.length, 7);
  assert.equal(new Set(series.map(s => s.color)).size, 7);
  for (const e of engines) {
    const max = seriesMaxima(e);
    assert.equal(max.gear, e.gears.length);
    assert.ok(max.rpm > e.redline);
    for (const s of series) assert.ok(max[s.key] > 0);
  }
});

test('all seven side axes fit a narrow phone and a desktop without covering the plot', () => {
  for (const width of [292, 320, 390, 600, 1000]) {
    const layout = axesLayout(width, new Set(series.map(s => s.key)), 'time');
    assert.equal(layout.axes.length, 7);
    assert.ok(width - layout.pad.l - layout.pad.r > 100);
    for (const a of layout.axes) {
      assert.ok(a.x >= 0);
      assert.ok(a.x + a.width <= width);
      assert.ok(a.side === 'left' ? a.x + a.width <= layout.pad.l : a.x >= width - layout.pad.r);
    }
  }
});

test('reference curves allow only power and torque without losing the time selection', () => {
  const enabled = new Set(series.map(s => s.key));
  assert.deepEqual(axesLayout(800, enabled, 'rpm').axes.map(a => a.key), ['power', 'torque']);
  assert.equal(enabled.size, 7);
  assert.equal(supportsMode('gear', 'rpm'), false);
  assert.equal(axesLayout(800, enabled, 'time').axes.length, 7);
});

test('boost pressure is available only for turbo engines in time mode',()=>{
  const enabled=new Set(['boost']);
  const atmo=engines.find(e=>!e.turbo),turbo=engines.find(e=>e.turbo);
  assert.equal(axesLayout(390,enabled,'time',atmo).axes.length,0);
  assert.equal(axesLayout(390,enabled,'time',turbo).axes[0].key,'boost');
  assert.equal(axesLayout(390,enabled,'rpm',turbo).axes.length,0);
  assert.equal(enabled.has('boost'),true);
  assert.ok(seriesMaxima(turbo).boost>=.9);
});

test('hidden series have no axis and all can be disabled', () => {
  const enabled = new Set(['gear']);
  assert.equal(axesLayout(390, enabled, 'time').axes[0].key, 'gear');
  enabled.delete('gear');
  assert.equal(axesLayout(390, enabled, 'time').axes.length, 0);
});

test('gear trace holds gear and jumps vertically instead of interpolating', () => {
  const data = [0, 1, 3, 2, 0].map((gear, time) => ({ gear, time }));
  const points = tracePoints(data, 'gear', 0, 6, 0, 0, 300, 60);
  assert.equal(points.length, 9);
  for (let i = 1; i < points.length; i++) {
    assert.ok(points[i].x === points[i - 1].x || points[i].y === points[i - 1].y);
  }
  assert.equal(points[0].y, 60);
  assert.equal(points[points.length - 1].y, 60);
});

test('sliding window includes the previous sample to avoid a gap on the left', () => {
  const points = tracePoints([{ time: 1, power: 10 }, { time: 2, power: 20 }], 'power', 1.5, 100, 0, 0, 300, 100);
  assert.ok(points[0].x < 0);
  assert.ok(points[1].x > 0);
});

test('smooth curves retain every measured point and keep control points inside each segment range',()=>{
  const points=[{x:0,y:0},{x:1,y:10},{x:2,y:3},{x:3,y:3},{x:4,y:20},{x:5,y:0}];
  const segments=smoothSegments(points);
  assert.equal(segments.length,points.length-1);
  for(let i=0;i<segments.length;i++){
    const s=segments[i];assert.deepEqual(s.from,points[i]);assert.deepEqual(s.to,points[i+1]);
    for(const c of [s.c1,s.c2]){
      assert.ok(c.x>=s.from.x&&c.x<=s.to.x);
      assert.ok(c.y>=Math.min(s.from.y,s.to.y)&&c.y<=Math.max(s.from.y,s.to.y));
    }
  }
  assert.deepEqual(smoothSegments([]),[]);
  assert.deepEqual(smoothSegments([{x:0,y:0}]),[]);
});

test('wheel zoom adjusts the time window and stays live at the right edge',()=>{
  const view=new HorizontalScale();
  assert.deepEqual(view.range('time',100,6600),{start:70,end:100});
  view.zoom('time',-100);assert.ok(view.timeWindow<30);
  assert.equal(view.range('time',100,6600).end,100);
  view.zoom('time',100);assert.ok(Math.abs(view.timeWindow-30)<1e-10);
  assert.ok(view.range('time',0,6600).start>=0);
  for(let i=0;i<100;i++)view.zoom('time',-240);
  assert.equal(view.timeWindow,2);
  for(let i=0;i<100;i++)view.zoom('time',240);
  assert.equal(view.timeWindow,300);
});

test('RPM zoom preserves the position under the pointer and stays inside the engine range',()=>{
  const view=new HorizontalScale(),anchor=.7;
  view.zoom('rpm',-100,anchor);
  assert.ok(Math.abs(view.rpmStart+anchor*(view.rpmEnd-view.rpmStart)-anchor)<1e-10);
  for(let i=0;i<100;i++)view.zoom('rpm',-240,.99);
  assert.ok(view.rpmStart>=0&&view.rpmEnd<=1);
  assert.ok(Math.abs(view.rpmEnd-view.rpmStart-.08)<1e-10);
  view.zoom('time',-100);
  view.reset('rpm');assert.equal(view.rpmStart,0);assert.equal(view.rpmEnd,1);assert.ok(view.timeWindow<30);
  view.reset();assert.equal(view.timeWindow,30);
});

test('wheel delta modes normalize pixels, lines and pages',()=>{
  assert.equal(wheelPixels(2,0,500),2);
  assert.equal(wheelPixels(2,1,500),32);
  assert.equal(wheelPixels(2,2,500),1000);
  const view=new HorizontalScale();view.zoom('time',NaN);assert.equal(view.timeWindow,30);
});

test('trace coordinates use the zoomed time window without modifying measurements',()=>{
  const samples=[{time:10,power:10},{time:15,power:20},{time:20,power:30}];
  const snapshot=JSON.stringify(samples);
  const points=tracePoints(samples,'power',10,100,0,0,300,100,10);
  assert.deepEqual(points.map(p=>p.x),[0,150,300]);
  assert.equal(JSON.stringify(samples),snapshot);
});

test('panning time freezes history while new measurements continue arriving',()=>{
  const view=new HorizontalScale();
  view.pan('time',-.5,100);
  assert.equal(view.followingLive,false);
  assert.deepEqual(view.range('time',100,6600),{start:55,end:85});
  assert.deepEqual(view.range('time',130,6600),{start:55,end:85});
  view.followLive();
  assert.equal(view.followingLive,true);
  assert.deepEqual(view.range('time',130,6600),{start:100,end:130});
  assert.equal(view.timeWindow,30);
});

test('panning is bounded by recorded history and resumes live mode at the newest data',()=>{
  const view=new HorizontalScale();
  view.pan('time',-100,100);assert.deepEqual(view.range('time',100,6600),{start:0,end:30});
  view.pan('time',100,100);assert.equal(view.followingLive,true);
  view.pan('time',-1,5);assert.equal(view.followingLive,true);
  assert.deepEqual(view.range('time',5,6600),{start:0,end:30});
  view.pan('time',-.5,100);view.reset();assert.equal(view.followingLive,true);
  const before=view.range('time',100,6600);view.pan('time',NaN,100);assert.deepEqual(view.range('time',100,6600),before);
});

test('RPM panning keeps the zoom level and cannot leave the engine range',()=>{
  const view=new HorizontalScale();view.zoom('rpm',-200);
  const span=view.rpmEnd-view.rpmStart;
  view.pan('rpm',100,0);assert.equal(view.rpmEnd,1);
  assert.ok(Math.abs(view.rpmEnd-view.rpmStart-span)<1e-10);
  view.pan('rpm',-100,0);assert.equal(view.rpmStart,0);
  assert.ok(Math.abs(view.rpmEnd-span)<1e-10);
});

test('history trace stops after the right-edge successor, leaving later measurements untouched',()=>{
  const samples=Array.from({length:101},(_,time)=>({time,power:time}));
  const points=tracePoints(samples,'power',10,100,0,0,300,100,10);
  assert.equal(points[0].x,-30);
  assert.equal(points[points.length-1].x,330);
  assert.equal(samples.length,101);
});

test('hover inspects the exact cursor position rather than snapping to a neighboring sample',()=>{
  const points=[{x:0,y:0},{x:10,y:100}];
  assert.equal(curveYAtX(points,5),50);
  assert.equal(curveYAtX(points,0),0);
  assert.equal(curveYAtX(points,10),100);
  assert.equal(curveYAtX(points,-1),undefined);
  assert.equal(curveYAtX(points,11),undefined);
  assert.equal(curveYAtX([],5),undefined);
});

test('hover markers lie exactly on the same cubic curve used to draw a line',()=>{
  const points=[{x:0,y:0},{x:10,y:100},{x:20,y:20},{x:30,y:40}];
  const snapshot=JSON.stringify(points);
  for(const s of smoothSegments(points)){
    for(const fraction of [.1,.3,.5,.9]){
      const inverse=1-fraction;
      const y=inverse**3*s.from.y+3*inverse**2*fraction*s.c1.y+3*inverse*fraction**2*s.c2.y+fraction**3*s.to.y;
      assert.ok(Math.abs(curveYAtX(points,s.from.x+(s.to.x-s.from.x)*fraction)-y)<1e-8);
    }
  }
  assert.equal(JSON.stringify(points),snapshot);
});

test('hover on a gear step never invents a fractional gear and uses the new gear at the transition',()=>{
  const points=[{x:0,y:0},{x:10,y:0},{x:10,y:3},{x:20,y:3}];
  assert.equal(curveYAtX(points,9.999,true),0);
  assert.equal(curveYAtX(points,10,true),3);
  assert.equal(curveYAtX(points,15,true),3);
});
