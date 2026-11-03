export type Language = 'en' | 'uk';

// Source strings are also used as keys when binding the static HTML template.
const messages: Record<string, readonly [string, string]> = {
  'Стенд готов': ['Stand ready', 'Стенд готовий'],
  'Стенд работает': ['Running', 'Стенд працює'],
  'Пауза': ['Pause', 'Пауза'],
  'Запустить': ['Start', 'Запустити'],
  'Запись': ['Recording', 'Запис'],
  'Запись приостановлена': ['Recording paused', 'Запис призупинено'],
  'Ожидание запуска': ['Waiting to start', 'Очікування запуску'],
  'Журнал': ['Log', 'Журнал'],
  'Параметры': ['Settings', 'Параметри'],
  'Справка': ['Help', 'Довідка'],
  'Текущие показания': ['Live readings', 'Поточні показники'],
  'Мощность': ['Power', 'Потужність'],
  'Момент': ['Torque', 'Момент'],
  'Крутящий момент': ['Torque', 'Крутний момент'],
  'Расход': ['Fuel use', 'Витрата'],
  'Расход топлива': ['Fuel consumption', 'Витрата пального'],
  'Обороты': ['RPM', 'Оберти'],
  'Скорость': ['Speed', 'Швидкість'],
  'л.с.': ['PS', 'к.с.'],
  'кВт': ['kW', 'кВт'],
  'Н·м': ['N·m', 'Н·м'],
  'л/ч': ['L/h', 'л/год'],
  'л/100 км': ['L/100 km', 'л/100 км'],
  'об/мин': ['rpm', 'об/хв'],
  'км/ч': ['km/h', 'км/год'],
  'бар': ['bar', 'бар'],
  'кг': ['kg', 'кг'],
  'л': ['L', 'л'],
  'с': ['s', 'с'],
  '% от максимума': ['% of maximum', '% від максимуму'],
  'Нейтральная передача': ['Neutral', 'Нейтральна передача'],
  'Передача': ['Gear', 'Передача'],
  'Предел оборотов': ['Rev limit', 'Межа обертів'],
  'Значения на линии · интерполяция': ['Values on curve · interpolated', 'Значення на лінії · інтерполяція'],
  'VTEC активен': ['VTEC active', 'VTEC активний'],
  'Наддув': ['Boost', 'Наддув'],
  'Давление наддува': ['Boost pressure', 'Тиск наддуву'],
  'Избыточное давление': ['Gauge pressure', 'Надлишковий тиск'],
  'Холостой ход': ['Idle', 'Холостий хід'],
  'Рабочий режим': ['Under load', 'Робочий режим'],
  'График двигателя': ['Engine chart', 'Графік двигуна'],
  'График параметров двигателя и передач': ['Engine readings and gear chart', 'Графік параметрів двигуна та передач'],
  'Цветные шкалы по бокам': ['Color-coded side scales', 'Кольорові шкали з боків'],
  'У каждой линии своя цветная шкала по бокам графика.': ['Each line has its own matching color scale beside the chart.', 'Кожна лінія має власну шкалу відповідного кольору збоку графіка.'],
  'Скрыть на графике': ['Hide on chart', 'Приховати на графіку'],
  'Показать на графике': ['Show on chart', 'Показати на графіку'],
  'Доступно в режиме «Время»': ['Available in Time mode', 'Доступно в режимі «Час»'],
  'Время': ['Time', 'Час'],
  'Только график': ['Chart only', 'Лише графік'],
  'Вернуть панели': ['Restore panels', 'Повернути панелі'],
  'График мощности, крутящего момента и расхода топлива': ['Power, torque and fuel consumption chart', 'Графік потужності, крутного моменту та витрати пального'],
  'Последние 30 с': ['Last 30 s', 'Останні 30 с'],
  'Интервал': ['Window', 'Інтервал'],
  'Диапазон': ['Range', 'Діапазон'],
  'Сбросить масштаб': ['Reset zoom', 'Скинути масштаб'],
  'Колёсико — масштаб по горизонтали. Двойной щелчок — сброс.': ['Drag to pan. Scroll to zoom horizontally. Double-click to reset.', 'Перетягуйте для переміщення. Коліщатко — горизонтальний масштаб. Подвійне клацання — скидання.'],
  'К последним данным': ['Back to live data', 'До останніх даних'],
  'История': ['History', 'Історія'],
  'Сохранить график в PNG': ['Save chart as PNG', 'Зберегти графік у PNG'],
  'График сохранён в PNG': ['Chart saved as PNG', 'Графік збережено у PNG'],
  'Не удалось сохранить PNG': ['Could not save PNG', 'Не вдалося зберегти PNG'],
  'Полный дроссель · установившийся наддув': ['Full throttle · steady-state boost', 'Повний дросель · сталий наддув'],
  'У каждой серии свой масштаб. Ось Y относится к первой включённой серии. Для чтения одной серии отключите остальные.': ['Each series has its own scale. The Y axis refers to the first enabled series. Hide the others to read a single series.', 'Кожна серія має власний масштаб. Вісь Y відповідає першій увімкненій серії. Щоб прочитати одну серію, вимкніть решту.'],
  'Независимые шкалы · Y:': ['Independent scales · Y:', 'Незалежні шкали · Y:'],
  'Серии скрыты': ['All series hidden', 'Серії приховано'],
  'Нет данных': ['No data', 'Немає даних'],
  'Расход доступен в режиме «Время»': ['Fuel consumption is available in Time mode', 'Витрата доступна в режимі «Час»'],
  'Показать / скрыть расход': ['Show / hide fuel consumption', 'Показати / приховати витрату'],
  'Закрыть параметры': ['Close settings', 'Закрити параметри'],
  'Параметры стенда': ['Stand settings', 'Параметри стенда'],
  'Скрыть параметры': ['Hide settings', 'Приховати параметри'],
  'Двигатель': ['Engine', 'Двигун'],
  'Характеристики': ['Specifications', 'Характеристики'],
  'Конфигурация': ['Configuration', 'Конфігурація'],
  'Отсечка': ['Rev limit', 'Відсічка'],
  'Открытие дросселя': ['Throttle opening', 'Відкриття дроселя'],
  'Фиксированное открытие дросселя': ['Throttle presets', 'Фіксоване відкриття дроселя'],
  'Тормоз': ['Brake', 'Гальмо'],
  'Удерживать': ['Hold', 'Утримувати'],
  'Удерживайте для торможения': ['Hold to brake', 'Утримуйте для гальмування'],
  'Нагрузка стенда': ['Stand load', 'Навантаження стенда'],
  'Дополнительное сопротивление движению. На нейтрали нагрузка не действует.': ['Additional driving resistance. No load is applied in neutral.', 'Додатковий опір руху. На нейтральній передачі навантаження не діє.'],
  'Сбросить эксперимент': ['Reset experiment', 'Скинути експеримент'],
  'Эксперимент сброшен': ['Experiment reset', 'Експеримент скинуто'],
  '+ Записать измерение': ['+ Record measurement', '+ Записати вимірювання'],
  '↑ ↓ дроссель · ← → передачи': ['↑ ↓ throttle · ← → gears', '↑ ↓ дросель · ← → передачі'],
  'Пробел — пуск / пауза': ['Space — start / pause', 'Пробіл — пуск / пауза'],
  'Упрощённая учебная модель.': ['Simplified educational model.', 'Спрощена навчальна модель.'],
  'Закрыть': ['Close', 'Закрити'],
  'Автомобиль': ['Vehicle', 'Автомобіль'],
  'Рабочий объём': ['Displacement', 'Робочий об’єм'],
  'Условная масса автомобиля': ['Assumed vehicle mass', 'Умовна маса автомобіля'],
  'Главная передача': ['Final drive', 'Головна передача'],
  'Паспортные показатели и передаточные числа — учебные ориентиры. Характеристики конкретных модификаций могут отличаться.': ['Specifications and gear ratios are educational approximations. Individual variants may differ.', 'Паспортні показники та передатні числа — навчальні орієнтири. Характеристики конкретних модифікацій можуть відрізнятися.'],
  'Выберите двигатель и нажмите «Запустить».': ['Select an engine and press Start.', 'Виберіть двигун і натисніть «Запустити».'],
  'Выставьте дроссель и передачу. На нейтрали двигатель вращается без нагрузки автомобиля.': ['Set the throttle and gear. In neutral, the engine runs without vehicle load.', 'Установіть дросель і передачу. На нейтралі двигун обертається без навантаження автомобіля.'],
  'Нагрузка 0–100% задаёт дополнительное сопротивление движению. На нейтрали не действует.': ['Load from 0–100% sets additional driving resistance. It does not apply in neutral.', 'Навантаження 0–100% задає додатковий опір руху. На нейтралі не діє.'],
  '«Время» — текущие измерения за 30 секунд. «Обороты» — справочная характеристика при полном дросселе.': ['Time shows live measurements over 30 seconds. RPM shows the reference curve at full throttle.', '«Час» — поточні вимірювання за 30 секунд. «Оберти» — довідкова характеристика за повного дроселя.'],
  'У кривых независимые шкалы. Ось Y относится к первой включённой серии. Для чтения одной серии отключите остальные.': ['Click a reading or legend to show or hide its line. Each line has its own color-coded side scale. Gear is shown as a step line: N means neutral. RPM, speed, fuel use and gear are available in Time mode only.', 'Натисніть показник або легенду, щоб показати чи приховати лінію. Кожна лінія має власну кольорову шкалу збоку. Передача відображається сходинками, N — нейтраль. Оберти, швидкість, витрата й передача доступні лише в режимі «Час».'],
  '«Записать измерение» сохраняет показания в журнал. CSV в верхней панели выгружает всю телеметрию текущего опыта.': ['Record measurement saves the current readings to the log. CSV in the toolbar exports all telemetry from the current experiment.', '«Записати вимірювання» зберігає показники в журналі. CSV у верхній панелі експортує всю телеметрію поточного досліду.'],
  'Кнопка в правом углу графика скрывает панели. «Параметры» возвращает настройки.': ['The button in the chart corner hides the panels. Settings restores the controls.', 'Кнопка в куті графіка приховує панелі. «Параметри» повертає налаштування.'],
  'Ограничения модели': ['Model limitations', 'Обмеження моделі'],
  'Момент интерполируется по опорной характеристике. Мощность рассчитывается из момента и оборотов. Расход оценивается через удельный расход топлива. Наддув, сцепление и отсечка упрощены. Нет моделирования температур, детонации, сцепления шин и износа. Данные не предназначены для инженерных расчётов.': ['Torque is interpolated from a reference curve. Power is calculated from torque and RPM. Fuel use is estimated using specific fuel consumption. Boost, clutch and rev limiting are simplified. Temperature, knock, tire grip and wear are not modeled. Data is not intended for engineering calculations.', 'Момент інтерполюється за опорною характеристикою. Потужність розраховується з моменту й обертів. Витрата оцінюється через питому витрату пального. Наддув, зчеплення та відсічка спрощені. Температури, детонація, зчеплення шин і зношування не моделюються. Дані не призначені для інженерних розрахунків.'],
  'Измерение': ['Measurement', 'Вимірювання'],
  'записано': ['recorded', 'записано'],
  'Журнал измерений': ['Measurement log', 'Журнал вимірювань'],
  'Записи хранятся до перезагрузки страницы.': ['Records are kept until the page is reloaded.', 'Записи зберігаються до перезавантаження сторінки.'],
  'Время, с': ['Time, s', 'Час, с'],
  'Дроссель, %': ['Throttle, %', 'Дросель, %'],
  'Скачать CSV': ['Download CSV', 'Завантажити CSV'],
  'Очистить журнал': ['Clear log', 'Очистити журнал'],
  'Нет измерений. Для записи текущих показаний нажмите «Записать измерение» в панели параметров.': ['No measurements. Select Record measurement in Settings to save the current readings.', 'Немає вимірювань. Щоб зберегти поточні показники, натисніть «Записати вимірювання» в панелі параметрів.'],
  'Нет данных для экспорта': ['No data to export', 'Немає даних для експорту'],
  'CSV-файл экспортирован': ['CSV file exported', 'CSV-файл експортовано'],
  'Дроссель': ['Throttle', 'Дросель'],
  'МКПП': ['manual', 'МКПП'],
  'ступ.': ['speed', 'ступ.'],
  'Язык': ['Language', 'Мова'],
  'ZAZ': ['ZAZ', 'ЗАЗ'],
  'MeMZ-245': ['MeMZ-245', 'МеМЗ-245'],
  'MeMZ-307': ['MeMZ-307', 'МеМЗ-307'],
  'MeMZ-968': ['MeMZ-968', 'МеМЗ-968'],
  'ZAZ MeMZ-245': ['ZAZ MeMZ-245', 'ЗАЗ МеМЗ-245'],
  'ZAZ MeMZ-307': ['ZAZ MeMZ-307', 'ЗАЗ МеМЗ-307'],
  'ZAZ MeMZ-968': ['ZAZ MeMZ-968', 'ЗАЗ МеМЗ-968'],
  'Tavria 1102': ['Tavria 1102', 'Таврія 1102'],
  'Slavuta 1103': ['Slavuta 1103', 'Славута 1103'],
  'Zaporozhets 968M': ['Zaporozhets 968M', 'Запорожець 968М'],
  'V4 · OHV · Air-cooled': ['V4 · OHV · Air-cooled', 'V4 · OHV · Повітряне охолодження'],
  '2 ротора · Turbo': ['2 rotors · Turbo', '2 ротори · Turbo'],
};

let language: Language = 'en';
try {
  const saved = localStorage.getItem('enginelab-language');
  if (saved === 'en' || saved === 'uk') language = saved;
} catch { /* Storage may be disabled. Switching still works in memory. */ }

export function getLanguage(): Language { return language; }
export function getLocale(): string { return language === 'en' ? 'en-GB' : 'uk-UA'; }
export function t(source: string): string { return messages[source]?.[language === 'en' ? 0 : 1] ?? source; }
export function setLanguage(value: Language) {
  language = value;
  try { localStorage.setItem('enginelab-language', value); } catch { /* Optional persistence. */ }
}

/** Capture original static strings once, so repeated switches never translate translations. */
export function bindTranslations(root: HTMLElement): () => void {
  const textBindings: { node: Text; source: string }[] = [];
  const attributeBindings: { element: Element; name: string; source: string }[] = [];
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
  let node: Node | null;
  while ((node = walker.nextNode())) {
    const source = node.textContent ?? '';
    if (messages[source.trim()]) textBindings.push({ node: node as Text, source });
  }
  for (const element of [root, ...root.querySelectorAll('*')]) {
    for (const name of ['title', 'aria-label']) {
      const source = element.getAttribute(name);
      if (source && messages[source]) attributeBindings.push({ element, name, source });
    }
  }
  const refresh = () => {
    for (const { node, source } of textBindings) node.textContent = source.replace(source.trim(), t(source.trim()));
    for (const { element, name, source } of attributeBindings) element.setAttribute(name, t(source));
  };
  refresh();
  return refresh;
}
