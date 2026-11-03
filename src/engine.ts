export interface Engine {
  id: string; brand: string; name: string; car: string; volume: string; layout: string;
  power: number; torque: number; redline: number; idle: number; mass: number;
  gears: number[]; final: number; turbo?: boolean; vtec?: number; fuelType?: 'petrol' | 'diesel'; color: string;
  points: [number, number][]; description: string;
}

export const engines: Engine[] = [
  { id: 'ls3', brand: 'CHEVROLET', name: 'LS3', car: 'Corvette C6', volume: '6.2', layout: 'V8 · OHV', power: 436, torque: 575, redline: 6600, idle: 750, mass: 1500, gears: [2.66, 1.78, 1.3, 1, .74, .5], final: 3.42, color: '#c7f477', points: [[750,310],[2000,450],[3000,510],[4600,575],[5900,519],[6600,440]], description: 'Атмосферный V8 с большим моментом на низких оборотах. Классическая американская школа.' },
  { id: 'lanos', brand: 'DAEWOO', name: 'A15SMS', car: 'Lanos', volume: '1.5', layout: 'R4 · SOHC', power: 86, torque: 130, redline: 6500, idle: 850, mass: 1050, gears: [3.55, 1.95, 1.28, .97, .76], final: 4.18, color: '#9ac7f3', points: [[850,70],[2000,105],[3400,130],[4500,124],[5800,104],[6500,83]], description: 'Простой атмосферный мотор. Хорошая отправная точка для изучения внешней скоростной характеристики.' },
  { id: 'golf', brand: 'VOLKSWAGEN', name: 'EA888', car: 'Golf GTI', volume: '2.0', layout: 'R4 · TSI', power: 220, torque: 350, redline: 6800, idle: 800, mass: 1380, gears: [3.36, 2.09, 1.48, 1.09, 1.1, .91], final: 3.24, turbo: true, color: '#a7b4ff', points: [[800,120],[1500,250],[1800,350],[4200,350],[5500,281],[6800,205]], description: 'Турбомотор с широкой полкой момента. Изучите отклик турбины и тягу на средних оборотах.' },
  { id: 'tavria', brand: 'ZAZ', name: 'MeMZ-245', car: 'Tavria 1102', volume: '1.1', layout: 'R4 · SOHC', power: 53, torque: 80, redline: 5800, idle: 850, mass: 745, gears: [3.454, 2.056, 1.333, .969, .828], final: 3.875, color: '#efc482', points: [[850,42],[1800,65],[2500,76],[3200,80],[4200,78],[5200,71.6],[5800,59]], description: 'Мелітопольський карбюраторний двигун «Таврії». Легкий автомобіль, невелика потужність і п’ятиступенева коробка.' },
  { id: 'slavuta', brand: 'ZAZ', name: 'MeMZ-307', car: 'Slavuta 1103', volume: '1.3', layout: 'R4 · SOHC · EFI', power: 70, torque: 108, redline: 6200, idle: 850, mass: 890, gears: [3.454, 2.056, 1.333, .969, .828], final: 3.875, color: '#c9c1ee', points: [[850,52],[1800,82],[2800,106],[3300,108],[4300,103],[5500,89.4],[6200,72]], description: 'Український інжекторний МеМЗ об’ємом 1,3 л. Для порівняння з карбюраторною «Таврією».' },
  { id: 'zaporozhets', brand: 'ZAZ', name: 'MeMZ-968', car: 'Zaporozhets 968M', volume: '1.2', layout: 'V4 · OHV · Air-cooled', power: 40, torque: 74, redline: 5000, idle: 900, mass: 840, gears: [3.8, 2.12, 1.409, .964], final: 4.125, color: '#e8d59f', points: [[900,38],[1800,60],[2700,74],[3300,72],[4000,68],[4400,63.8],[5000,45]], description: 'Задньомоторний «Запорожець»: V4 повітряного охолодження та чотириступенева коробка. Відсічка в симуляторі — умовний навчальний захист.' },
  { id: 'honda', brand: 'HONDA', name: 'K20A Type R', car: 'Integra Type R', volume: '2.0', layout: 'R4 · VTEC', power: 220, torque: 206, redline: 8500, idle: 900, mass: 1180, gears: [3.27, 2.13, 1.52, 1.21, .97, .78], final: 4.76, vtec: 5800, color: '#f59b91', points: [[900,90],[2500,140],[4500,172],[5600,170],[6000,195],[7000,206],[8000,193],[8500,175]], description: 'Высокооборотный атмосферный двигатель. После 5800 об/мин включается спортивный профиль VTEC.' },
  { id: '2jz', brand: 'TOYOTA', name: '2JZ-GTE', car: 'Supra A80', volume: '3.0', layout: 'R6 · Twin Turbo', power: 280, torque: 432, redline: 6800, idle: 800, mass: 1570, gears: [3.83, 2.36, 1.69, 1.31, 1, .79], final: 3.27, turbo: true, color: '#9ae2d1', points: [[800,140],[1800,230],[3000,390],[3600,432],[4600,420],[5600,351],[6800,270]], description: 'Рядная «шестёрка» с последовательным двойным наддувом. Культовый японский турбомотор.' },
  { id: 'bmw', brand: 'BMW', name: 'M54B30', car: '330i E46', volume: '3.0', layout: 'R6 · DOHC', power: 231, torque: 300, redline: 6500, idle: 750, mass: 1430, gears: [4.21, 2.49, 1.66, 1.24, 1], final: 2.93, color: '#aac9fc', points: [[750,140],[2000,255],[3500,300],[4500,296],[5900,275],[6500,235]], description: 'Атмосферная рядная «шестёрка» с ровной тягой и изменяемыми фазами газораспределения.' },
  { id: 'subaru', brand: 'SUBARU', name: 'EJ257', car: 'Impreza WRX STI', volume: '2.5', layout: 'H4 · Turbo', power: 300, torque: 407, redline: 6700, idle: 850, mass: 1505, gears: [3.64, 2.38, 1.76, 1.35, 1.06, .84], final: 3.9, turbo: true, color: '#89b5f9', points: [[850,120],[2000,210],[3000,340],[4000,407],[6000,351],[6700,290]], description: 'Оппозитный турбомотор. Заметный выход на наддув и мощная середина диапазона.' },
  { id: 'diesel', brand: 'VOLKSWAGEN', name: '1.9 TDI ALH', car: 'Golf IV', volume: '1.9', layout: 'R4 · Diesel', power: 90, torque: 210, redline: 4800, idle: 900, mass: 1250, gears: [3.78, 2.12, 1.36, .97, .76], final: 3.39, turbo: true, fuelType: 'diesel', color: '#d3bd88', points: [[900,90],[1500,180],[1900,210],[2500,205],[3750,169],[4800,100]], description: 'Экономичный турбодизель. Высокий момент внизу и узкий рабочий диапазон оборотов.' },
  { id: 'mazda', brand: 'MAZDA', name: '13B-REW', car: 'RX-7 FD', volume: '1.3', layout: '2 ротора · Turbo', power: 280, torque: 314, redline: 8000, idle: 900, mass: 1280, gears: [3.48, 2.02, 1.39, 1, .72], final: 4.1, turbo: true, color: '#e0a6e8', points: [[900,90],[2000,150],[3500,260],[5000,314],[6500,303],[7500,260],[8000,220]], description: 'Роторный двигатель Ванкеля с наддувом. Высокие обороты и повышенный расход топлива.' },
  { id: 'coyote', brand: 'FORD', name: 'Coyote 5.0', car: 'Mustang GT', volume: '5.0', layout: 'V8 · DOHC', power: 450, torque: 529, redline: 7500, idle: 750, mass: 1720, gears: [3.66, 2.43, 1.69, 1.31, 1, .65], final: 3.55, color: '#8fb9e8', points: [[750,250],[2000,380],[3500,490],[4600,529],[5500,520],[6500,486],[7500,395]], description: 'Атмосферний американський V8 із чотирма розподільними валами. Поєднує великий момент і високі робочі оберти.' },
  { id: 'rb26', brand: 'NISSAN', name: 'RB26DETT', car: 'Skyline GT-R R34', volume: '2.6', layout: 'R6 · Twin Turbo', power: 280, torque: 392, redline: 8000, idle: 900, mass: 1560, gears: [3.827, 2.36, 1.685, 1.312, 1, .793], final: 3.545, turbo: true, color: '#abc5e4', points: [[900,110],[2000,180],[3200,310],[4400,392],[5500,351],[6800,289.2],[8000,235]], description: 'Рядна шестициліндрова «Годзілла» з двома турбінами. Модель орієнтована на заводську версію, без тюнінгу.' },
  { id: '4g63', brand: 'MITSUBISHI', name: '4G63T', car: 'Lancer Evolution VIII', volume: '2.0', layout: 'R4 · Turbo', power: 280, torque: 392, redline: 7600, idle: 850, mass: 1410, gears: [2.928, 1.95, 1.407, 1.031, .72], final: 4.529, turbo: true, color: '#e1a5a5', points: [[850,95],[2000,170],[3000,310],[3500,392],[4500,375],[5500,340],[6500,302.5],[7600,230]], description: 'Ралійний турбомотор із вираженим виходом на наддув і великим моментом у середині діапазону.' },
  { id: 'f20c', brand: 'HONDA', name: 'F20C', car: 'S2000 AP1', volume: '2.0', layout: 'R4 · VTEC', power: 240, torque: 208, redline: 9000, idle: 900, mass: 1260, gears: [3.133, 2.045, 1.481, 1.161, .97, .81], final: 4.1, vtec: 6000, color: '#e7bbb0', points: [[900,80],[2500,125],[4500,160],[5800,165],[6200,187],[7500,208],[8300,203.1],[9000,175]], description: 'Дволітровий атмосферний мотор із відсічкою на 9000 об/хв. VTEC і коротка коробка заохочують працювати на високих обертах.' },
  { id: 's85', brand: 'BMW', name: 'S85B50', car: 'M5 E60', volume: '5.0', layout: 'V10 · DOHC', power: 507, torque: 520, redline: 8250, idle: 850, mass: 1830, gears: [3.985, 2.652, 1.806, 1.392, 1.159, 1, .833], final: 3.62, color: '#c6adeb', points: [[850,220],[2500,360],[4000,440],[6100,520],[7000,499],[7750,459.5],[8250,425]], description: 'Атмосферний V10 із сімома передачами. Характеристика розкривається ближче до верхньої межі обертів.' },
  { id: 'om606', brand: 'MERCEDES-BENZ', name: 'OM606 Turbo', car: 'E 300 Turbodiesel W210', volume: '3.0', layout: 'R6 · Diesel · Turbo', power: 177, torque: 330, redline: 5400, idle: 750, mass: 1640, gears: [3.59, 2.19, 1.41, 1, .83], final: 2.87, turbo: true, fuelType: 'diesel', color: '#c7c8bd', points: [[750,110],[1500,230],[2000,300],[2800,330],[3600,325],[4400,282.5],[5400,190]], description: 'Рядний шестициліндровий турбодизель. Для порівняння моменту та витрати пального з бензиновими моторами.' },
  { id: 'gt3', brand: 'PORSCHE', name: '4.0 GT3', car: '911 GT3 991.2', volume: '4.0', layout: 'H6 · DOHC', power: 500, torque: 460, redline: 9000, idle: 900, mass: 1430, gears: [3.75, 2.38, 1.72, 1.34, 1.11, .96], final: 3.97, color: '#e3d8b2', points: [[900,180],[2500,300],[4500,395],[6000,460],[7500,450],[8250,425.7],[9000,380]], description: 'Високообертовий опозитний шестициліндровий двигун без турбонаддуву. Широкий діапазон і майже лінійне наростання потужності.' },
  { id: 'vr6', brand: 'VOLKSWAGEN', name: 'AAA VR6', car: 'Golf III VR6', volume: '2.8', layout: 'VR6 · SOHC', power: 174, torque: 235, redline: 6500, idle: 800, mass: 1280, gears: [3.3, 1.94, 1.31, 1.03, .84], final: 3.39, color: '#a8cabc', points: [[800,110],[2000,185],[3200,220],[4200,235],[5000,228],[5800,210.7],[6500,175]], description: 'Компактна шестициліндрова конструкція з малим кутом між рядами циліндрів. Рівний момент атмосферного мотора.' },
];

export function torqueAt(e: Engine, rpm: number): number {
  const p = e.points;
  if (rpm <= p[0][0]) return p[0][1];
  for (let i = 1; i < p.length; i++) {
    if (rpm <= p[i][0]) { const t = (rpm - p[i - 1][0]) / (p[i][0] - p[i - 1][0]); return p[i - 1][1] + t * (p[i][1] - p[i - 1][1]); }
  }
  return p[p.length - 1][1];
}

export interface Sample { time: number; rpm: number; power: number; torque: number; fuel: number; speed: number; gear: number; throttle: number; boost: number; limiter?: number; brake?: number; }

export class Simulation {
  engine = engines[0]; rpm = 750; speed = 0; gear = 0; throttle = 0; load = 25; brake = false;
  time = 0; power = 0; torque = 0; fuel = 1.2; boost = 0; limiter = false; shiftTime = 0;
  /** Approximate gauge pressure in bar; boost itself remains a normalized induction state. */
  get boostPressure(): number { return this.engine.turbo ? this.boost * .9 : 0; }
  reset() { this.rpm = this.engine.idle; this.speed = 0; this.gear = 0; this.time = 0; this.power = 0; this.torque = 0; this.throttle = 0; this.boost = 0; this.limiter = false; this.brake = false; this.fuel = Number(this.engine.volume) * .2 + .5; this.shiftTime = 0; }
  shift(gear: number) { if (gear < 0 || gear > this.engine.gears.length || gear === this.gear) return; this.gear = gear; this.shiftTime = .23; }
  step(dt: number) {
    const e = this.engine; this.time += dt; this.shiftTime = Math.max(0, this.shiftTime - dt);
    this.rpm = Math.max(e.idle, Math.min(e.redline, this.rpm));
    const pedal = this.throttle / 100;
    const targetBoost = e.turbo ? Math.min(1, Math.max(0, (this.rpm - 1300) / 1800)) * pedal : 0;
    this.boost += (targetBoost - this.boost) * Math.min(1, dt * 2.4);
    // Educational limiter: cap rotational speed, without cutting indicated engine output.
    // This is intentionally not a combustion-cycle or energy-conserving ECU model.
    const cut = this.shiftTime > 0;
    const induction = e.turbo ? .55 + .45 * this.boost / Math.max(.01, Math.min(1, Math.max(0, (this.rpm - 1300) / 1800))) : 1;
    const available = torqueAt(e, this.rpm) * Math.min(1, induction);
    this.torque = cut ? 0 : available * pedal;
    const loss = 12 + this.rpm * .003;
    const net = this.torque - loss * (1 - pedal * .6);
    if (this.gear === 0) {
      this.rpm = Math.max(e.idle, this.rpm + (net / (Number(e.volume) * .075 + .13)) * 9.5493 * dt);
      this.speed = Math.max(0, this.speed - dt * (this.brake ? 7 * 3.6 : 1.5));
    } else {
      const ratio = e.gears[this.gear - 1] * e.final;
      const v = this.speed / 3.6;
      const clutchRpm = e.idle + pedal * 1250;
      const force = net * ratio * .88 / .32;
      const resistance = 140 + .42 * v * v + this.load / 100 * (400 + v * 32);
      // Simplified brake priority: cancel positive drive force and add 7 m/s² deceleration.
      const brakingForce = this.brake ? Math.max(0, force) + e.mass * 7 : 0;
      const speedLimit = e.redline / ratio / 60 * (.32 * 2 * Math.PI) * 3.6;
      this.speed = Math.max(0, Math.min(speedLimit, this.speed + (force - resistance - brakingForce) / e.mass * dt * 3.6));
      const wheelRpm = this.speed / 3.6 / (.32 * 2 * Math.PI) * 60 * ratio;
      const target = Math.max(clutchRpm, wheelRpm);
      if (target >= e.redline - 1e-6) this.rpm = e.redline;
      else this.rpm += (target - this.rpm) * Math.min(1, dt * (this.shiftTime > 0 ? 9 : 18));
    }
    this.rpm = Math.max(e.idle, Math.min(e.redline, this.rpm));
    this.limiter = pedal > 0 && this.rpm >= e.redline - 1e-6;
    // All reported values use the same final RPM and the unmodified reference curve.
    this.torque = cut ? 0 : torqueAt(e, this.rpm) * Math.min(1, induction) * pedal;
    this.power = this.torque * this.rpm / 7023.5;
    const diesel = e.fuelType === 'diesel';
    const idleFuel = Number(e.volume) * .2 + .5;
    const bsfc = (diesel ? .235 : e.id === 'mazda' ? .39 : .29) * (1 + .22 * Math.pow(this.rpm / e.redline, 2) + .3 * (1 - pedal));
    this.fuel = cut || (pedal === 0 && this.rpm > e.idle + 400) ? 0 : idleFuel + this.power * .7355 * bsfc / (diesel ? .835 : .745);
  }
  sample(): Sample { return { time: this.time, rpm: this.rpm, power: this.power, torque: this.torque, fuel: this.fuel, speed: this.speed, gear: this.gear, throttle: this.throttle, boost: this.boostPressure, limiter: this.limiter ? 1 : 0, brake: this.brake ? 100 : 0 }; }
}
