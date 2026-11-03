import test from 'node:test';
import assert from 'node:assert/strict';
import { getLanguage, getLocale, setLanguage, t } from '../src/i18n.ts';

test('Ukrainian and English translate labels, units, status and help', () => {
  for (const [language, power, rpm, idle, locale] of [
    ['uk', 'Потужність', 'об/хв', 'Холостий хід', 'uk-UA'],
    ['en', 'Power', 'rpm', 'Idle', 'en-GB'],
  ]) {
    setLanguage(language);
    assert.equal(getLanguage(), language);
    assert.equal(getLocale(), locale);
    assert.equal(t('Мощность'), power);
    assert.equal(t('об/мин'), rpm);
    assert.equal(t('Холостой ход'), idle);
    assert.notEqual(t('Нет данных для экспорта'), 'Нет данных для экспорта');
    assert.notEqual(t('Выберите двигатель и нажмите «Запустить».'), 'Выберите двигатель и нажмите «Запустить».');
  }
});

test('repeated language changes use the original keys', () => {
  for (let i = 0; i < 3; i++) {
    setLanguage('en'); assert.equal(t('Параметры'), 'Settings');
    setLanguage('uk'); assert.equal(t('Параметры'), 'Параметри');
  }
});

test('metric horsepower is labeled PS, not imperial horsepower', () => {
  setLanguage('en'); assert.equal(t('л.с.'), 'PS');
  setLanguage('uk'); assert.equal(t('л.с.'), 'к.с.');
});

test('technical names not in the dictionary remain unchanged', () => {
  setLanguage('en'); assert.equal(t('Chevrolet LS3'), 'Chevrolet LS3');
  assert.equal(t('ZAZ MeMZ-245'), 'ZAZ MeMZ-245');
  setLanguage('uk'); assert.equal(t('ZAZ MeMZ-245'), 'ЗАЗ МеМЗ-245');
  assert.equal(t('Tavria 1102'), 'Таврія 1102');
  setLanguage('uk'); assert.equal(t('2 ротора · Turbo'), '2 ротори · Turbo');
});

test('adjustable load explanation is translated in both languages', () => {
  const source='Нагрузка 0–100% задаёт дополнительное сопротивление движению. На нейтрали не действует.';
  setLanguage('en'); assert.ok(t(source).startsWith('Load from 0–100%'));
  setLanguage('uk'); assert.ok(t(source).startsWith('Навантаження 0–100%'));
});

test('brake and throttle presets have English and Ukrainian labels',()=>{
  setLanguage('en');assert.equal(t('Тормоз'),'Brake');assert.equal(t('Удерживать'),'Hold');
  setLanguage('uk');assert.equal(t('Тормоз'),'Гальмо');assert.equal(t('Удерживать'),'Утримувати');
  assert.equal(t('Фиксированное открытие дросселя'),'Фіксоване відкриття дроселя');
});

test('boost pressure and gauge pressure labels are localized',()=>{
  setLanguage('en');assert.equal(t('Давление наддува'),'Boost pressure');assert.equal(t('бар'),'bar');
  setLanguage('uk');assert.equal(t('Давление наддува'),'Тиск наддуву');assert.equal(t('Избыточное давление'),'Надлишковий тиск');
});
