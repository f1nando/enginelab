import test from 'node:test';
import assert from 'node:assert/strict';
import { Simulation, engines, torqueAt } from '../src/engine.ts';

function advance(sim, seconds) { for (let i=0;i<seconds*100;i++) sim.step(.01); }

test('20 unique engines with ordered torque curves and positive gears', () => {
  assert.equal(engines.length, 20);
  assert.equal(new Set(engines.map(e=>e.id)).size, 20);
  for (const e of engines) {
    assert.ok(e.gears.length >= 4 && e.gears.length <= 7);
    assert.ok(e.gears.every(g=>g>0));
    assert.ok(e.points.every((p,i)=>!i||p[0]>e.points[i-1][0]));
    assert.equal(torqueAt(e,e.points[0][0]), e.points[0][1]);
  }
});

test('Ukrainian engines replace the removed entry and cover 4/5-speed gearboxes', () => {
  assert.ok(!engines.some(e => e.id === 'vaz' || e.brand === 'LADA'));
  assert.equal(engines.filter(e => e.brand === 'ZAZ').length, 3);
  assert.equal(engines.find(e => e.id === 'zaporozhets').gears.length, 4);
  assert.equal(engines.find(e => e.id === 'tavria').gears.length, 5);
  assert.equal(engines.find(e => e.id === 's85').gears.length, 7);
});

test('all diesel engines select the diesel consumption model', () => {
  assert.deepEqual(engines.filter(e => e.fuelType === 'diesel').map(e => e.id).sort(), ['diesel', 'om606']);
  const source = engines.find(e => e.id === 'om606');
  const diesel = new Simulation(), petrol = new Simulation();
  diesel.engine = source; petrol.engine = { ...source, fuelType: 'petrol' };
  for (const s of [diesel, petrol]) { s.reset(); s.rpm = 3000; s.throttle = 80; s.step(.01); }
  assert.ok(diesel.fuel < petrol.fuel);
});

for (const engine of engines) {
  test(`${engine.id}: idle, free revving, limiter, and recovery`, () => {
    const s=new Simulation();s.engine=engine;s.reset();advance(s,3);
    assert.equal(s.rpm,engine.idle);assert.equal(s.power,0);assert.ok(s.fuel>0);
    s.throttle=100;let interventions=0;let maxRpm=0;const tail=[];
    for(let i=0;i<1500;i++){
      s.step(.01);if(s.limiter)interventions++;
      maxRpm=Math.max(maxRpm,s.rpm);
      if(i>1200){tail.push(s.rpm);assert.ok(s.fuel>0);assert.ok(s.power>0);}
    }
    assert.ok(interventions>0,'RPM limit must engage');
    assert.equal(maxRpm,engine.redline);
    assert.equal(s.rpm,engine.redline);
    assert.equal(Math.max(...tail)-Math.min(...tail),0,'RPM must stay exactly at the limit');
    assert.ok(Math.abs(s.torque-torqueAt(engine,engine.redline))<1e-6,'limiter must not reduce torque');
    assert.ok(Math.abs(s.power-torqueAt(engine,engine.redline)*engine.redline/7023.5)<1e-6);
    s.throttle=0;advance(s,20);assert.equal(s.rpm,engine.idle);assert.equal(s.speed,0);
  });
  test(`${engine.id}: acceleration and power identity`, () => {
    const s=new Simulation();s.engine=engine;s.reset();s.throttle=70;s.shift(1);advance(s,4);
    assert.ok(s.speed>5);assert.ok(s.rpm>=engine.idle);assert.ok(s.fuel>=0);
    assert.ok(Math.abs(s.power-s.torque*s.rpm/7023.5)<1e-8);
    assert.ok(Object.values(s.sample()).every(Number.isFinite));
  });
}

test('upshift reduces engine RPM at the same road speed',()=>{
  const s=new Simulation();s.throttle=60;s.shift(1);advance(s,3);const before=s.rpm;s.shift(2);advance(s,.4);assert.ok(s.rpm<before);
});
test('load defaults to 25%, is adjustable and survives experiment resets',()=>{
  const s=new Simulation();assert.equal(s.load,25);
  s.load=75;s.reset();assert.equal(s.load,75);
});
test('increased stand load reduces acceleration but does not affect neutral revving',()=>{
  const a=new Simulation(),b=new Simulation();
  a.load=0;b.load=100;
  for(const s of [a,b]){s.throttle=60;s.shift(2);}
  advance(a,6);advance(b,6);assert.ok(a.speed>b.speed);
  for(const s of [a,b]){s.reset();s.throttle=30;}
  advance(a,1);advance(b,1);assert.equal(a.rpm,b.rpm);
});
test('invalid gear selections are ignored and reset restores idle',()=>{
  const s=new Simulation();s.shift(-1);assert.equal(s.gear,0);s.shift(20);assert.equal(s.gear,0);s.throttle=100;advance(s,1);s.reset();assert.equal(s.time,0);assert.equal(s.rpm,s.engine.idle);assert.equal(s.throttle,0);assert.equal(s.limiter,false);
});

test('reference torque is preserved below, at, and above an externally supplied RPM limit',()=>{
  for(const e of engines){
    for(const offset of [-350,-100,0,100]){
      const s=new Simulation();s.engine=e;s.reset();s.throttle=100;s.boost=1;s.rpm=e.redline+offset;
      s.step(.01);
      assert.ok(s.rpm<=e.redline);
      assert.ok(Math.abs(s.torque-torqueAt(e,s.rpm))<1e-8);
      assert.ok(s.fuel>0&&s.power>0);
    }
  }
});

test('externally supplied overrev is clamped without losing torque or power',()=>{
  const s=new Simulation();s.throttle=100;s.rpm=s.engine.redline+100;s.step(.01);
  assert.equal(s.rpm,s.engine.redline);assert.equal(s.limiter,true);assert.ok(s.fuel>0);
  assert.equal(s.torque,torqueAt(s.engine,s.engine.redline));
  s.rpm=s.engine.redline-1000;s.step(.01);
  assert.equal(s.limiter,false);assert.ok(s.power>0);
});

test('RPM limit plateau is exact at different integration timesteps',()=>{
  const rpms=[];
  for(const dt of [.005,.01,.02]){
    const s=new Simulation();s.throttle=100;
    for(let i=0;i<15/dt;i++)s.step(dt);
    rpms.push(s.rpm);
  }
  assert.ok(rpms.every(rpm=>rpm===engines[0].redline));
});

for(const id of ['ls3','f20c','diesel','zaporozhets']){
  test(`${id}: held first gear settles without repeated zero-power cuts`,()=>{
    const s=new Simulation();s.engine=engines.find(e=>e.id===id);s.reset();s.throttle=100;s.shift(1);
    const tail=[];
    for(let i=0;i<2500;i++){
      s.step(.01);
      if(i>2000){tail.push(s.power);assert.ok(s.fuel>0);assert.equal(s.rpm,s.engine.redline);}
    }
    assert.equal(s.limiter,true);
    const limit=s.engine.redline/(s.engine.gears[0]*s.engine.final)/60*(.32*2*Math.PI)*3.6;
    assert.ok(Math.abs(s.speed-limit)<1e-8);
    assert.ok(Math.abs(s.torque-torqueAt(s.engine,s.engine.redline))<1e-6);
    assert.ok(Math.min(...tail)>0);
    assert.ok(Math.max(...tail)-Math.min(...tail)<s.engine.power*.03);
  });
}

test('all gears cap road speed consistently with redline, including downshifts',()=>{
  for(const e of engines)for(let gear=1;gear<=e.gears.length;gear++){
    const limit=e.redline/(e.gears[gear-1]*e.final)/60*(.32*2*Math.PI)*3.6;
    const s=new Simulation();s.engine=e;s.reset();s.gear=gear;s.throttle=100;s.boost=1;
    s.rpm=e.redline+500;s.speed=limit*1.1;s.step(.01);
    assert.ok(s.rpm<=e.redline);assert.ok(s.speed<=limit+1e-8);assert.ok(s.power>0);
  }
});

test('upshifting at the RPM limit releases the cap and resumes acceleration',()=>{
  const s=new Simulation();s.throttle=100;s.shift(1);advance(s,15);
  assert.equal(s.limiter,true);
  const speed=s.speed;s.shift(2);advance(s,.6);
  assert.ok(s.rpm<s.engine.redline);assert.equal(s.limiter,false);assert.ok(s.speed>speed);assert.ok(s.power>0);
});

test('brake decelerates every engine even with full throttle and holds the vehicle stopped',()=>{
  for(const e of engines){
    const s=new Simulation();s.engine=e;s.reset();s.gear=1;s.throttle=100;s.boost=1;
    s.speed=e.redline/(e.gears[0]*e.final)/60*(.32*2*Math.PI)*3.6*.6;
    s.rpm=e.redline*.6;s.brake=true;
    for(let i=0;i<500;i++){
      const before=s.speed;s.step(.01);
      assert.ok(s.speed<=before,`${e.id}: brake must have priority over throttle`);
      assert.ok(s.speed>=0);
    }
    assert.equal(s.speed,0);assert.equal(s.sample().brake,100);
    advance(s,1);assert.equal(s.speed,0);
    s.brake=false;advance(s,1);assert.ok(s.speed>0);assert.equal(s.sample().brake,0);
    s.brake=true;s.reset();assert.equal(s.brake,false);
  }
});

test('brake slows neutral coasting without braking the disconnected engine',()=>{
  const a=new Simulation(),b=new Simulation();
  for(const s of [a,b]){s.speed=80;s.throttle=30;}
  a.brake=true;advance(a,1);advance(b,1);
  assert.ok(a.speed<b.speed);assert.equal(a.rpm,b.rpm);assert.equal(a.torque,b.torque);
});

test('turbo gauge pressure builds with lag, falls on throttle release and resets',()=>{
  for(const engine of engines.filter(e=>e.turbo)){
    const s=new Simulation();s.engine=engine;s.reset();s.rpm=3500;s.throttle=100;
    assert.equal(s.boostPressure,0);s.step(.01);
    assert.ok(s.boostPressure>0&&s.boostPressure<.1);
    advance(s,6);const pressure=s.boostPressure;
    assert.ok(pressure>.8&&pressure<=.9);
    assert.equal(s.sample().boost,pressure);
    s.throttle=0;advance(s,2);assert.ok(s.boostPressure<pressure*.05);
    s.reset();assert.equal(s.boostPressure,0);
  }
});

test('atmospheric engines never report boost pressure',()=>{
  for(const engine of engines.filter(e=>!e.turbo)){
    const s=new Simulation();s.engine=engine;s.boost=1;s.throttle=100;s.step(.01);
    assert.equal(s.boostPressure,0);assert.equal(s.sample().boost,0);
  }
});
