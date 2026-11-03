import './style.css';
import { Simulation, engines, type Sample } from './engine';
import { Chart, series } from './chart';
import { axesLayout, seriesMaxima, supportsMode, type SeriesKey } from './chart-data';
import { bindTranslations, getLanguage, getLocale, setLanguage, t, type Language } from './i18n';

const icons: Record<string, string> = {
  download: '<path d="M12 3v12m-5-5 5 5 5-5M4 16v5h16v-5"/>',
  reset: '<path d="M3 10a9 9 0 1 1 1 8M3 3v7h7"/>',
  play: '<path d="m8 5 12 7-12 7z"/>',
  pause: '<path d="M8 5v14M16 5v14"/>',
  info: '<circle cx="12" cy="12" r="9"/><path d="M12 11v6m0-10v1"/>',
  close: '<path d="m6 6 12 12M18 6 6 18"/>',
  settings: '<path d="M4 7h16M4 17h16M8 4v6M16 14v6"/>',
  book: '<path d="M4 3h16v18H4zM8 7h8M8 11h8M8 15h5"/>',
  expand: '<path d="M8 3H3v5M16 3h5v5M3 16v5h5M21 16v5h-5"/>',
};
const icon = (name: string) => `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${icons[name]}</svg>`;
const $ = <T extends HTMLElement = HTMLElement>(s: string) => document.querySelector<T>(s)!;
type Measurement = Sample & { engineName: string };
const sim = new Simulation();
let running = false;
let samples: Sample[] = [];
let records: Measurement[] = [];
let lastSample = 0;
let lastPaint = 0;
const format = (n: number, digits = 0) => n.toLocaleString(getLocale(), { minimumFractionDigits: digits, maximumFractionDigits: digits });

$('#app').innerHTML = `
  <header class="toolbar">
    <h1>enginelab</h1>
    <div class="stand-status"><span id="run-dot" class="status-dot"></span><span id="run-label">Стенд готов</span><time id="elapsed">00:00.0</time></div>
    <div class="toolbar-actions">
      <button class="button" id="nav-records">${icon('book')}<span>Журнал</span><span id="record-count">0</span></button>
      <button class="button" id="export">${icon('download')}<span>CSV</span></button>
      <button class="button" id="config-toggle" aria-expanded="true" aria-controls="configuration">${icon('settings')}<span>Параметры</span></button>
      <select id="language-select" aria-label="Язык" title="Язык"><option value="en">EN</option><option value="uk">УК</option></select>
      <button class="button icon-button" id="help-button" title="Справка" aria-label="Справка">${icon('info')}</button>
    </div>
  </header>
  <div class="workspace">
    <main>
      <section class="readouts" aria-label="Текущие показания">
        <div class="readout" role="button" tabindex="0" data-series="power"><span>Мощность</span><div><strong id="power">0,0</strong><small>л.с.</small></div><span id="power-kw">0,0 кВт</span></div>
        <div class="readout" role="button" tabindex="0" data-series="torque"><span>Момент</span><div><strong id="torque">0</strong><small>Н·м</small></div><span id="torque-percent">0% от максимума</span></div>
        <div class="readout" role="button" tabindex="0" data-series="fuel"><span>Расход</span><div><strong id="fuel">1,7</strong><small>л/ч</small></div><span id="fuel-distance">— л/100 км</span></div>
        <div class="readout" role="button" tabindex="0" data-series="rpm"><span>Обороты</span><div><strong id="rpm">750</strong><small>об/мин</small></div><span id="rpm-status">Холостой ход</span></div>
        <div class="readout" role="button" tabindex="0" data-series="speed"><span>Скорость</span><div><strong id="speed">0</strong><small>км/ч</small></div><span id="gear-label">Нейтральная передача</span></div>
        <div class="readout" role="button" tabindex="0" data-series="gear"><span>Передача</span><div><strong id="gear-value">N</strong><small id="gear-ratio">—</small></div><span id="gear-caption">6-ступ. МКПП</span></div>
        <div class="readout" role="button" tabindex="0" data-series="boost" hidden><span>Наддув</span><div><strong id="boost-pressure">0,00</strong><small>бар</small></div><span>Избыточное давление</span></div>
      </section>
      <section class="chart-panel" aria-label="График двигателя">
        <div class="chart-toolbar">
          <div class="legend">${series.map(s => `<button class="legend-item" data-series="${s.key}" style="--series:${s.color}" aria-pressed="true"><i></i>${s.name}<span>${s.unit}</span></button>`).join('')}</div>
          <div class="chart-actions"><button class="button icon-button" id="chart-live" aria-label="К последним данным" title="К последним данным" hidden>${icon('play')}</button><div class="segmented"><button class="selected" data-chart="time" aria-pressed="true">Время</button><button data-chart="rpm" aria-pressed="false">Обороты</button></div><button class="button" id="chart-png" title="Сохранить график в PNG" aria-label="Сохранить график в PNG">${icon('download')} PNG</button><button class="button icon-button" id="chart-zoom-reset" aria-label="Сбросить масштаб" title="Сбросить масштаб">${icon('reset')}</button><button class="button icon-button" id="chart-expand" aria-label="Только график" title="Только график" aria-pressed="false">${icon('expand')}</button></div>
        </div>
        <div class="canvas-container"><canvas id="chart" role="img" aria-label="График параметров двигателя и передач"></canvas><div id="axis-legends">${series.map(s => `<button class="axis-legend" data-series="${s.key}" style="--series:${s.color}" hidden><span class="axis-name">${s.short}</span><span class="axis-symbol">${({power:'P',torque:'M',fuel:'Q',rpm:'n',speed:'v',gear:'G',boost:'p'})[s.key]}</span><small>${s.unit || 'N / 1–6'}</small></button>`).join('')}</div><div id="chart-tooltip" class="chart-tooltip" hidden></div></div>
      </section>
    </main>
    <button id="config-backdrop" aria-label="Закрыть параметры" tabindex="-1" hidden></button>
    <aside id="configuration" aria-label="Параметры стенда">
      <div class="config-heading"><h2>Параметры</h2><button class="button icon-button" id="config-close" aria-label="Скрыть параметры" title="Скрыть параметры">${icon('close')}</button></div>
      <section class="config-section">
        <label for="engine-select">Двигатель</label>
        <select id="engine-select">${engines.map(e => `<option value="${e.id}">${e.brand} ${e.name}</option>`).join('')}</select>
        <div class="engine-caption"><span id="engine-car">Corvette C6 · 6.2 л</span><button id="engine-about" class="link-button">Характеристики</button></div>
        <dl class="engine-specs"><div><dt>Конфигурация</dt><dd id="spec-layout">V8 · OHV</dd></div><div><dt>Мощность</dt><dd id="spec-power">436 л.с.</dd></div><div><dt>Момент</dt><dd id="spec-torque">575 Н·м</dd></div><div><dt>Отсечка</dt><dd id="spec-redline">6 600 об/мин</dd></div></dl>
      </section>
      <section class="config-section">
        <div class="control-label"><label for="throttle">Открытие дросселя</label><output id="throttle-value" for="throttle">0%</output></div>
        <input id="throttle" type="range" min="0" max="100" value="0" step="1" style="--value:0%"/>
        <div class="throttle-presets" role="group" aria-label="Фиксированное открытие дросселя">${[0,25,50,75,100].map(value => `<button class="${value === 0 ? 'selected' : ''}" data-throttle="${value}" aria-pressed="${value === 0}">${value}%</button>`).join('')}</div>
        <div class="control-label gear-heading"><span>Передача</span><span class="muted" id="gearbox-type">6-ступ. МКПП</span></div><div class="gears" id="gears"></div>
        <div class="control-label load-heading"><label for="load">Нагрузка стенда</label><output id="load-value" for="load">${sim.load}%</output></div>
        <input id="load" type="range" min="0" max="100" value="${sim.load}" step="1" style="--value:${sim.load}%" title="Дополнительное сопротивление движению. На нейтрали нагрузка не действует."/>
        <div class="range-labels"><span>0%</span><span>100%</span></div>
        <button class="button brake-button" id="brake" aria-pressed="false" title="Удерживайте для торможения">◉ <span>Тормоз</span><small>Удерживать</small></button>
        <div class="run-buttons"><button class="button primary" id="run">${icon('play')}<span>Запустить</span></button><button class="button icon-button" id="reset" title="Сбросить эксперимент" aria-label="Сбросить эксперимент">${icon('reset')}</button></div>
      </section>
      <section class="config-section measurement-actions"><button class="button" id="capture">+ Записать измерение</button><p class="keyboard-hint">↑ ↓ дроссель · ← → передачи<br>Пробел — пуск / пауза</p></section>
      <p class="model-note">Упрощённая учебная модель.</p>
    </aside>
  </div>
  <dialog id="modal"><div class="modal-heading"><h2 id="modal-title"></h2><button id="modal-close" class="button icon-button" aria-label="Закрыть">${icon('close')}</button></div><div id="modal-content"></div></dialog><div id="toast" role="status"></div>
`;

const translateStatic = bindTranslations($('#app'));
const chart = new Chart($('#chart'), $('#chart-tooltip'), () => paint());
$('#chart-zoom-reset').onclick = () => chart.resetZoom();
$('#chart-live').onclick = () => { chart.view.followLive(); paint(); };
$('#chart-png').onclick = async () => {
  const button = $<HTMLButtonElement>('#chart-png');
  const id = sim.engine.id;
  button.disabled = true;
  try {
    const blob = await chart.createPNG(samples, sim.engine, sim.time);
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url; link.download = `enginelab-${id}-${new Date().toISOString().replace(/[:.]/g, '-')}.png`; link.click();
    window.setTimeout(() => URL.revokeObjectURL(url), 1000);
    toast(t('График сохранён в PNG'));
  } catch {
    toast(t('Не удалось сохранить PNG'));
  } finally { button.disabled = false; }
};
let refreshModal: (() => void) | null = null;
function toast(text: string) {
  $('#toast').textContent = text;
  $('#toast').classList.add('visible');
  window.setTimeout(() => $('#toast').classList.remove('visible'), 3000);
}
function modal(title: string, content: string) {
  releaseBrake();
  $('#modal-title').textContent = t(title);
  $('#modal-content').innerHTML = content;
  bindTranslations($('#modal-content'));
  if (!$<HTMLDialogElement>('#modal').open) $<HTMLDialogElement>('#modal').showModal();
}
$('#modal-close').onclick = () => $<HTMLDialogElement>('#modal').close();
$('#modal').onclick = e => { if (e.target === $('#modal')) $<HTMLDialogElement>('#modal').close(); };

function drawGears() {
  $('#gears').innerHTML = Array.from({ length: sim.engine.gears.length + 1 }, (_, i) => `<button class="gear ${sim.gear === i ? 'selected' : ''}" data-gear="${i}" aria-label="${i === 0 ? t('Нейтральная передача') : `${t('Передача')} ${i}`}" aria-pressed="${sim.gear === i}">${i === 0 ? 'N' : i}</button>`).join('');
  document.querySelectorAll<HTMLButtonElement>('[data-gear]').forEach(b => b.onclick = () => { sim.shift(Number(b.dataset.gear)); drawGears(); paint(); });
}
function setRunning(value: boolean) {
  running = value;
  if (!running) releaseBrake();
  $('#run').innerHTML = icon(running ? 'pause' : 'play') + `<span>${t(running ? 'Пауза' : 'Запустить')}</span>`;
  $('#run-label').textContent = t(running ? 'Стенд работает' : sim.time > 0 ? 'Пауза' : 'Стенд готов');
  $('#run-dot').classList.toggle('running', running);
}
function setThrottle(value: number) {
  sim.throttle = Math.min(100, Math.max(0, value));
  const input = $<HTMLInputElement>('#throttle');
  input.value = String(sim.throttle);
  input.style.setProperty('--value', `${sim.throttle}%`);
  $('#throttle-value').textContent = `${sim.throttle}%`;
  document.querySelectorAll<HTMLButtonElement>('[data-throttle]').forEach(button => {
    const selected = Number(button.dataset.throttle) === sim.throttle;
    button.classList.toggle('selected', selected);
    button.setAttribute('aria-pressed', String(selected));
  });
}
function reset() { setRunning(false); sim.reset(); chart.view.reset(); samples = []; lastSample = 0; setThrottle(0); drawGears(); paint(); }
function selectEngine() {
  sim.engine = engines.find(e => e.id === $<HTMLSelectElement>('#engine-select').value)!;
  reset();
  renderEngineSpecs();
  paint();
}
function engineName(engine = sim.engine) { return `${t(engine.brand)} ${t(engine.name)}`; }
function renderEngineSpecs() {
  const e = sim.engine;
  $('#engine-car').textContent = `${t(e.car)} · ${format(Number(e.volume), 1)} ${t('л')}`;
  $('#spec-layout').textContent = t(e.layout);
  $('#spec-power').textContent = `${format(e.power)} ${t('л.с.')}`;
  $('#spec-torque').textContent = `${format(e.torque)} ${t('Н·м')}`;
  $('#spec-redline').textContent = `${format(e.redline)} ${t('об/мин')}`;
  $('#gearbox-type').textContent = `${e.gears.length}-${t('ступ.')} ${t('МКПП')}`;
  for (const option of $<HTMLSelectElement>('#engine-select').options) {
    const engine = engines.find(e => e.id === option.value)!;
    option.textContent = `${engineName(engine)} · ${t(engine.car)}`;
  }
}
function paint() {
  const history = chart.mode === 'time' && !chart.view.followingLive;
  $('#chart-live').hidden = !history;
  const { axes } = axesLayout($('#chart').clientWidth, chart.enabled, chart.mode, sim.engine);
  $('.readouts').classList.toggle('has-boost', !!sim.engine.turbo);
  for (const s of series) {
    const supported = supportsMode(s.key, chart.mode, sim.engine);
    const selected = chart.enabled.has(s.key);
    for (const control of document.querySelectorAll<HTMLElement>(`[data-series="${s.key}"]`)) {
      if (s.key === 'boost' && !control.classList.contains('axis-legend')) control.hidden = !sim.engine.turbo;
      control.style.setProperty('--series', s.color);
      control.classList.toggle('series-off', !selected);
      control.classList.toggle('unavailable', !supported);
      control.setAttribute('aria-pressed', String(selected && supported));
      control.setAttribute('aria-disabled', String(!supported));
      control.title = supported ? `${t(selected ? 'Скрыть на графике' : 'Показать на графике')}: ${t(s.name)}` : t('Доступно в режиме «Время»');
      if (control instanceof HTMLButtonElement) control.disabled = !supported;
      if (control.classList.contains('readout')) control.tabIndex = supported ? 0 : -1;
    }
    const label = $<HTMLButtonElement>(`.axis-legend[data-series="${s.key}"]`);
    const axis = axes.find(a => a.key === s.key);
    label.hidden = !axis;
    if (axis) {
      label.style.left = `${axis.x}px`; label.style.width = `${axis.width}px`;
      label.querySelector('.axis-name')!.textContent = t(s.short);
      label.querySelector('small')!.textContent = s.key === 'gear' ? `N / 1–${sim.engine.gears.length}` : t(s.unit);
      label.title += ` · 0–${seriesMaxima(sim.engine)[s.key]} ${t(s.unit)}`;
    }
  }
  $('#power').textContent = format(sim.power, 1);
  $('#torque').textContent = format(sim.torque);
  $('#fuel').textContent = format(sim.fuel, 1);
  $('#speed').textContent = format(sim.speed);
  $('#rpm').textContent = format(sim.rpm);
  $('#boost-pressure').textContent = format(sim.boostPressure, 2);
  $('#gear-value').textContent = sim.gear === 0 ? 'N' : String(sim.gear);
  $('#gear-ratio').textContent = sim.gear ? `i=${format(sim.engine.gears[sim.gear - 1], 2)}` : '—';
  $('#gear-caption').textContent = $('#gearbox-type').textContent;
  $('#power-kw').textContent = `${format(sim.power * .7355, 1)} ${t('кВт')}`;
  $('#torque-percent').textContent = `${format(sim.torque / sim.engine.torque * 100)}${t('% от максимума')}`;
  $('#fuel-distance').textContent = `${sim.speed > 5 ? format(sim.fuel / sim.speed * 100, 1) : '—'} ${t('л/100 км')}`;
  $('#gear-label').textContent = sim.gear === 0 ? t('Нейтральная передача') : `${t('Передача')} ${sim.gear} · ${format(sim.engine.gears[sim.gear - 1], 2)}`;
  $('#elapsed').textContent = `${String(Math.floor(sim.time / 60)).padStart(2, '0')}:${(sim.time % 60).toFixed(1).padStart(4, '0')}`;
  $('#rpm-status').textContent = sim.limiter ? t('Предел оборотов') : sim.engine.vtec && sim.rpm >= sim.engine.vtec ? t('VTEC активен') : sim.engine.turbo && sim.boost > .45 ? `${t('Наддув')} · ${format(sim.boostPressure, 2)} ${t('бар')}` : t(sim.rpm < sim.engine.idle + 100 ? 'Холостой ход' : 'Рабочий режим');
  $('#rpm-status').classList.toggle('limiting', sim.limiter);
  chart.draw(samples, sim.engine, sim.time);
}

$('#run').onclick = () => setRunning(!running);
$('#reset').onclick = () => { reset(); toast(t('Эксперимент сброшен')); };
$<HTMLSelectElement>('#engine-select').onchange = selectEngine;
$<HTMLInputElement>('#throttle').oninput = e => setThrottle(Number((e.target as HTMLInputElement).value));
document.querySelectorAll<HTMLButtonElement>('[data-throttle]').forEach(button => {
  button.onclick = () => setThrottle(Number(button.dataset.throttle));
});
const brakeButton = $<HTMLButtonElement>('#brake');
let brakePointer: number | null = null;
function setBrake(active: boolean) {
  sim.brake = active;
  $('#brake').setAttribute('aria-pressed', String(active));
  $('#brake').classList.toggle('pressed', active);
}
function releaseBrake() {
  const pointer = brakePointer;
  brakePointer = null;
  setBrake(false);
  const button = $<HTMLButtonElement>('#brake');
  if (pointer !== null && button.hasPointerCapture(pointer)) button.releasePointerCapture(pointer);
}
brakeButton.onpointerdown = e => {
  if (e.button !== 0) return;
  e.preventDefault();
  brakeButton.focus({ preventScroll: true });
  brakePointer = e.pointerId;
  brakeButton.setPointerCapture(e.pointerId);
  setBrake(true);
};
brakeButton.onpointerup = releaseBrake;
brakeButton.onpointercancel = releaseBrake;
brakeButton.onlostpointercapture = releaseBrake;
brakeButton.onblur = releaseBrake;
brakeButton.onkeydown = e => {
  if (e.key === ' ' || e.key === 'Enter') {
    e.preventDefault(); e.stopPropagation(); setBrake(true);
  }
};
brakeButton.onkeyup = e => {
  if (e.key === ' ' || e.key === 'Enter') {
    e.preventDefault(); e.stopPropagation(); releaseBrake();
  }
};
window.addEventListener('blur', releaseBrake);
document.addEventListener('visibilitychange', () => { if (document.hidden) releaseBrake(); });
$<HTMLInputElement>('#load').oninput = e => {
  sim.load = Number((e.target as HTMLInputElement).value);
  $('#load-value').textContent = `${sim.load}%`;
  $('#load').style.setProperty('--value', `${sim.load}%`);
};
document.querySelectorAll<HTMLButtonElement>('[data-chart]').forEach(b => b.onclick = () => {
  chart.mode = b.dataset.chart as 'time' | 'rpm';
  document.querySelectorAll<HTMLButtonElement>('[data-chart]').forEach(x => { x.classList.toggle('selected', x === b); x.setAttribute('aria-pressed', String(x === b)); });
  paint();
});
document.querySelectorAll<HTMLElement>('[data-series]').forEach(control => {
  const toggle = () => {
    const key = control.dataset.series as SeriesKey;
    if (!supportsMode(key, chart.mode, sim.engine)) return;
    if (chart.enabled.has(key)) chart.enabled.delete(key); else chart.enabled.add(key);
    paint();
  };
  control.onclick = toggle;
  if (control.classList.contains('readout')) control.onkeydown = e => {
    if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); e.stopPropagation(); toggle(); }
  };
});
const drawerMedia = window.matchMedia('(max-width: 800px), (max-width: 1000px) and (max-height: 500px)');
function updateDrawer() {
  const mobile = drawerMedia.matches;
  const open = mobile && $('#app').classList.contains('menu-open');
  const configuration = $('#configuration');
  configuration.inert = mobile ? !open : $('#app').classList.contains('config-hidden');
  $('#config-backdrop').hidden = !open;
  $('main').inert = open;
  $('.toolbar').inert = open;
  if (open) {
    configuration.setAttribute('role', 'dialog');
    configuration.setAttribute('aria-modal', 'true');
  } else {
    configuration.removeAttribute('role');
    configuration.removeAttribute('aria-modal');
  }
  $('#config-toggle').setAttribute('aria-expanded', String(mobile ? open : !$('#app').classList.contains('config-hidden')));
}
function showConfiguration(show: boolean) {
  if (!show) releaseBrake();
  if (drawerMedia.matches) $('#app').classList.toggle('menu-open', show);
  else $('#app').classList.toggle('config-hidden', !show);
  $('#config-toggle').setAttribute('aria-expanded', String(show));
  if (show) {
    $('#app').classList.remove('chart-only');
    $('#chart-expand').setAttribute('aria-pressed', 'false');
    $('#chart-expand').setAttribute('aria-label', t('Только график'));
    $('#chart-expand').title = t('Только график');
  }
  updateDrawer();
  if (drawerMedia.matches) {
    if (show) $('#config-close').focus({ preventScroll: true });
    else $('#config-toggle').focus({ preventScroll: true });
  }
  paint();
}
$('#config-toggle').onclick = () => {
  showConfiguration(drawerMedia.matches ? !$('#app').classList.contains('menu-open') : $('#app').classList.contains('config-hidden'));
};
$('#config-close').onclick = () => showConfiguration(false);
$('#config-backdrop').onclick = () => showConfiguration(false);
drawerMedia.addEventListener('change', () => {
  const focusedInDrawer = $('#configuration').contains(document.activeElement);
  $('#app').classList.remove('menu-open');
  updateDrawer();
  if (focusedInDrawer && drawerMedia.matches) $('#config-toggle').focus({ preventScroll: true });
});
document.addEventListener('keydown', e => {
  if (!drawerMedia.matches || !$('#app').classList.contains('menu-open') || $<HTMLDialogElement>('#modal').open) return;
  if (e.key === 'Escape') { e.preventDefault(); showConfiguration(false); }
  if (e.key === 'Tab') {
    const controls = [...$('#configuration').querySelectorAll<HTMLElement>('button:not(:disabled), select, input')].filter(el => el.getClientRects().length);
    const first = controls[0], last = controls[controls.length - 1];
    if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
    else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
  }
});
updateDrawer();
$('#chart-expand').onclick = () => {
  const expand = !$('#app').classList.contains('chart-only');
  showConfiguration(!expand);
  $('#app').classList.toggle('chart-only', expand);
  $('#chart-expand').setAttribute('aria-pressed', String(expand));
  $('#chart-expand').setAttribute('aria-label', t(expand ? 'Вернуть панели' : 'Только график'));
  $('#chart-expand').title = t(expand ? 'Вернуть панели' : 'Только график');
  paint();
};
// ResizeObserver also catches panel toggles without a window resize.
new ResizeObserver(() => paint()).observe($('.canvas-container'));

function showEngineAbout() {
  refreshModal = showEngineAbout;
  const e = sim.engine;
  modal(engineName(), `<div class="about-specs"><span>Автомобиль<b>${t(e.car)}</b></span><span>Рабочий объём<b>${format(Number(e.volume), 1)} ${t('л')}</b></span><span>Условная масса автомобиля<b>${format(e.mass)} ${t('кг')}</b></span><span>Главная передача<b>${format(e.final, 2)}</b></span></div><p class="modal-note">Паспортные показатели и передаточные числа — учебные ориентиры. Характеристики конкретных модификаций могут отличаться.</p>`);
}
$('#engine-about').onclick = () => showEngineAbout();
function showHelp() {
  refreshModal = showHelp;
  modal('Справка', `<ol class="help-list"><li>Выберите двигатель и нажмите «Запустить».</li><li>Выставьте дроссель и передачу. На нейтрали двигатель вращается без нагрузки автомобиля.</li><li>Нагрузка 0–100% задаёт дополнительное сопротивление движению. На нейтрали не действует.</li><li>«Время» — текущие измерения за 30 секунд. «Обороты» — справочная характеристика при полном дросселе.</li><li>У кривых независимые шкалы. Ось Y относится к первой включённой серии. Для чтения одной серии отключите остальные.</li><li>«Записать измерение» сохраняет показания в журнал. CSV в верхней панели выгружает всю телеметрию текущего опыта.</li><li>Кнопка в правом углу графика скрывает панели. «Параметры» возвращает настройки.</li></ol><h3>Ограничения модели</h3><p>Момент интерполируется по опорной характеристике. Мощность рассчитывается из момента и оборотов. Расход оценивается через удельный расход топлива. Наддув, сцепление и отсечка упрощены. Нет моделирования температур, детонации, сцепления шин и износа. Данные не предназначены для инженерных расчётов.</p>`);
}
$('#help-button').onclick = () => showHelp();
$('#capture').onclick = () => {
  records.push({ ...sim.sample(), engineName: `${sim.engine.brand} ${sim.engine.name}` });
  $('#record-count').textContent = String(records.length);
  toast(`${t('Измерение')} №${records.length} ${t('записано')}`);
};
$('#nav-records').onclick = () => showRecords();
function showRecords() {
  refreshModal = showRecords;
  modal('Журнал измерений', records.length ? `<p>Записи хранятся до перезагрузки страницы.</p><div class="table-scroll"><table><thead><tr><th>№</th><th>Двигатель</th><th>Время, с</th><th>Передача</th><th>Дроссель, %</th><th>об/мин</th><th>л.с.</th><th>Н·м</th><th>л/ч</th><th>км/ч</th></tr></thead><tbody>${records.map((r, i) => `<tr><td>${i + 1}</td><td>${t(r.engineName)}</td><td>${format(r.time, 1)}</td><td>${r.gear || 'N'}</td><td>${r.throttle}</td><td>${format(r.rpm)}</td><td>${format(r.power, 1)}</td><td>${format(r.torque)}</td><td>${format(r.fuel, 1)}</td><td>${format(r.speed, 1)}</td></tr>`).join('')}</tbody></table></div><div class="modal-actions"><button class="button" id="export-records">${icon('download')} Скачать CSV</button><button class="link-button" id="clear-records">Очистить журнал</button></div>` : '<p class="empty-state">Нет измерений. Для записи текущих показаний нажмите «Записать измерение» в панели параметров.</p>');
  if (records.length) {
    $('#export-records').onclick = () => download(records, 'measurements');
    $('#clear-records').onclick = () => { records = []; $('#record-count').textContent = '0'; showRecords(); };
  }
}
function download(data: (Sample | Measurement)[], name: string) {
  if (!data.length) { toast(t('Нет данных для экспорта')); return; }
  const header = [t('Двигатель'), `${t('Время')} (${t('с')})`, `${t('Обороты')} (${t('об/мин')})`, `${t('Мощность')} (${t('л.с.')})`, `${t('Момент')} (${t('Н·м')})`, `${t('Расход')} (${t('л/ч')})`, `${t('Скорость')} (${t('км/ч')})`, t('Передача'), `${t('Дроссель')} (%)`, `${t('Тормоз')} (%)`, `${t('Давление наддува')} (${t('бар')})`].join(';');
  const rows = data.map(r => ['engineName' in r ? t(r.engineName) : engineName(), r.time.toFixed(2), r.rpm.toFixed(0), r.power.toFixed(2), r.torque.toFixed(2), r.fuel.toFixed(2), r.speed.toFixed(2), r.gear, r.throttle, r.brake ?? 0, r.boost.toFixed(2)].join(';'));
  const url = URL.createObjectURL(new Blob(['\ufeff' + [header, ...rows].join('\r\n')], { type: 'text/csv;charset=utf-8;' }));
  const a = document.createElement('a');
  a.href = url; a.download = `enginelab-${sim.engine.id}-${name}.csv`; a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
  toast(t('CSV-файл экспортирован'));
}
$('#export').onclick = () => download(samples, 'telemetry');
document.addEventListener('keydown', e => {
  if ($<HTMLDialogElement>('#modal').open || ['INPUT', 'SELECT', 'TEXTAREA', 'BUTTON'].includes((e.target as HTMLElement).tagName)) return;
  if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', ' '].includes(e.key)) e.preventDefault();
  if (e.key === 'ArrowUp') setThrottle(sim.throttle + 5);
  if (e.key === 'ArrowDown') setThrottle(sim.throttle - 5);
  if (e.key === 'ArrowRight') { sim.shift(sim.gear + 1); drawGears(); }
  if (e.key === 'ArrowLeft') { sim.shift(sim.gear - 1); drawGears(); }
  if (e.key === ' ') setRunning(!running);
  paint();
});
window.addEventListener('resize', () => paint());
let previous = performance.now();
let accumulator = 0;
function frame(now: number) {
  const delta = Math.min(.1, (now - previous) / 1000);
  previous = now;
  if (running) {
    accumulator += delta;
    while (accumulator >= .01) {
      sim.step(.01); accumulator -= .01;
      if (sim.time - lastSample >= .1) { samples.push(sim.sample()); lastSample = sim.time; }
    }
  } else accumulator = 0;
  if (now - lastPaint > 50) { paint(); lastPaint = now; }
  requestAnimationFrame(frame);
}
function applyLanguage() {
  document.documentElement.lang = getLanguage();
  document.querySelector('meta[name="description"]')?.setAttribute('content', getLanguage() === 'en' ? 'enginelab — educational engine test stand.' : 'enginelab — навчальний стенд двигунів.');
  $<HTMLSelectElement>('#language-select').value = getLanguage();
  translateStatic();
  renderEngineSpecs();
  setRunning(running);
  drawGears();
  $('#chart-expand').title = t($('#app').classList.contains('chart-only') ? 'Вернуть панели' : 'Только график');
  $('#chart-expand').setAttribute('aria-label', $('#chart-expand').title);
  $('#toast').classList.remove('visible');
  if ($<HTMLDialogElement>('#modal').open) refreshModal?.();
  paint();
}
$<HTMLSelectElement>('#language-select').onchange = e => {
  const value = (e.target as HTMLSelectElement).value;
  if (value === 'en' || value === 'uk') { setLanguage(value as Language); applyLanguage(); }
};
applyLanguage(); requestAnimationFrame(frame);
