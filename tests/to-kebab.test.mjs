import test from 'ava';

import { toKebab } from '../scripts/lib/to-kebab.mjs';

test('toKebab', (t) => {
  t.is(toKebab('BaseElement'), 'base-element', 'incorrectly converts simple PascalCase');
  t.is(toKebab('Element'), 'element', 'incorrectly converts simple one-word PascalCase');

  t.is(toKebab('baseElement'), 'base-element', 'incorrectly converts simple one-word camelCase');
  t.is(toKebab('baseElement'), 'base-element', 'incorrectly converts simple one-word camelCase');

  t.is(toKebab('base-element'), 'base-element', 'butchers the kebab-case');
  t.is(toKebab('Base-Element'), 'base-element', 'butchers the upper Kebab-Case');
});