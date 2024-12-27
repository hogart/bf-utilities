import test from 'ava';

import {
  _totalInCopper,
  _exchangeCoppers,
  divideCurencyWithExchange,
  divideCurrencyInWilderness,
  reduceCoins,
  _actorReceivedCoinageString,
  spendCoinage,
  NotEnoughMoneyError,
} from '../scripts/lib/currency.mjs';

test('_totalInCopper', (t) => {
  t.is(_totalInCopper(1, 2, 3, 4), 1234, 'incorrectly counts with no overflow');
  t.is(_totalInCopper(0, 13, 24, 42), 1300 + 240 + 42, 'does not correctly accounts for overflow');
});

test('_exchangeCoppers', (t) => {
  t.deepEqual(_exchangeCoppers(1234), {pp: 1, gp: 2, sp: 3, cp: 4}, 'incorrectly splits the sum with all denominations');
  t.deepEqual(_exchangeCoppers(3000), {pp: 3, gp: 0, sp: 0, cp: 0}, 'incorrectly counts for platinum');
  t.deepEqual(_exchangeCoppers(320), {pp: 0, gp: 3, sp: 2, cp: 0}, 'incorrectly counts gold + silver');
  t.deepEqual(_exchangeCoppers(43), {pp: 0, gp: 0, sp: 4, cp: 3}, 'incorrectly counts silver+copper');
});

test('divideCurencyWithExchange', (t) => {
  t.deepEqual(
    divideCurencyWithExchange(10, 10, 10, 41, 3),
    [
      {pp: 3, gp: 7, sp: 1, cp: 4},
      {pp: 3, gp: 7, sp: 1, cp: 4},
      {pp: 3, gp: 7, sp: 1, cp: 3},
    ],
    'incorrectly divides an uneven sum',
  );

  t.deepEqual(
    divideCurencyWithExchange(0, 0, 0, 4, 3),
    [
      {pp: 0, gp: 0, sp: 0, cp: 2},
      {pp: 0, gp: 0, sp: 0, cp: 1},
      {pp: 0, gp: 0, sp: 0, cp: 1},
    ],
    'cannot even divide a measly 4 coppers',
  );

  t.deepEqual(
    divideCurencyWithExchange(3, 3, 3, 3, 3),
    [
      {pp: 1, gp: 1, sp: 1, cp: 1},
      {pp: 1, gp: 1, sp: 1, cp: 1},
      {pp: 1, gp: 1, sp: 1, cp: 1},
    ],
    'incorrectly divides an even sum',
  );

  t.deepEqual(
    divideCurencyWithExchange(4, 0, 0, 0, 3),
    [
      {pp: 1, gp: 3, sp: 3, cp: 4},
      {pp: 1, gp: 3, sp: 3, cp: 3},
      {pp: 1, gp: 3, sp: 3, cp: 3},
    ],
    'incorrectly divides platinum',
  );

  t.deepEqual(
    divideCurencyWithExchange(0, 4, 0, 0, 3),
    [
      {pp: 0, gp: 1, sp: 3, cp: 4},
      {pp: 0, gp: 1, sp: 3, cp: 3},
      {pp: 0, gp: 1, sp: 3, cp: 3},
    ],
    'incorrectly divides gold',
  );

  t.deepEqual(
    divideCurencyWithExchange(0, 0, 4, 0, 3),
    [
      {pp: 0, gp: 0, sp: 1, cp: 4},
      {pp: 0, gp: 0, sp: 1, cp: 3},
      {pp: 0, gp: 0, sp: 1, cp: 3},
    ],
    'incorrectly divides silver',
  );

  t.deepEqual(
    divideCurencyWithExchange(0, 30, 300, 3000, 3),
    [
      {pp: 3, gp: 0, sp: 0, cp: 0},
      {pp: 3, gp: 0, sp: 0, cp: 0},
      {pp: 3, gp: 0, sp: 0, cp: 0},
    ],
    'incorrectly exchanges copper, silver and gold into platinum',
  );
});

test('divideCurrencyInWilderness', (t) => {
  t.deepEqual(
    divideCurrencyInWilderness(3, 9, 60, 1200, 3),
    [
      {pp: 1, gp: 3, sp: 20, cp: 400},
      {pp: 1, gp: 3, sp: 20, cp: 400},
      {pp: 1, gp: 3, sp: 20, cp: 400},
    ],
    'does not exchange coinage',
  );

  t.deepEqual(
    divideCurrencyInWilderness(3, 90, 60, 1202, 3),
    [
      {pp: 1, gp: 30, sp: 20, cp: 401},
      {pp: 1, gp: 30, sp: 20, cp: 401},
      {pp: 1, gp: 30, sp: 20, cp: 400},
    ],
    'overflow copper is not distributed properly',
  );

  t.deepEqual(
    divideCurrencyInWilderness(3, 90, 62, 1200, 3),
    [
      {pp: 1, gp: 30, sp: 20, cp: 407},
      {pp: 1, gp: 30, sp: 20, cp: 407},
      {pp: 1, gp: 30, sp: 20, cp: 406},
    ],
    'overflow silver is not exchanged properly',
  );

  t.deepEqual(
    divideCurrencyInWilderness(3, 92, 60, 1200, 3),
    [
      {pp: 1, gp: 30, sp: 26, cp: 407},
      {pp: 1, gp: 30, sp: 26, cp: 407},
      {pp: 1, gp: 30, sp: 26, cp: 406},
    ],
    'overflow gold is not exchanged properly',
  );

  t.deepEqual(
    divideCurrencyInWilderness(4, 90, 60, 1200, 3),
    [
      {pp: 1, gp: 33, sp: 23, cp: 404},
      {pp: 1, gp: 33, sp: 23, cp: 403},
      {pp: 1, gp: 33, sp: 23, cp: 403},
    ],
    'overflow platinum is no exchanged properly',
  );
});

test('reduceCoins', (t) => {
  t.deepEqual(
    reduceCoins(1, 13, 42, 69),
    {cp: 9, sp: 8, gp: 7, pp: 2},
    'incorrectly reduces mixed coinage with platinum',
  );
  t.deepEqual(
    reduceCoins(0, 42, 7, 15),
    {cp: 5, sp: 8, gp: 2, pp: 4},
    'incorrectly reduces mixed coinage with no platinum',
  );
  t.deepEqual(
    reduceCoins(0, 0, 753, 0),
    {cp: 0, sp: 3, gp: 5, pp: 7},
    'incorrectly reduces bunch of silver',
  );
  t.deepEqual(
    reduceCoins(0, 0, 0, 123),
    {cp: 3, sp: 2, gp: 1, pp: 0},
    'incorrectly reduces bunch of copper',
  );
});

test('_actorReceivedCoinageString', (t) => {
  t.is(
    _actorReceivedCoinageString('Your character', {pp: 1, gp: 2, sp: 4, cp: 4}),
    'Your character received 1 pp, 2 gp, 4 sp and 4 cp.',
    'breaks on 4 denominations',
  );
  t.is(
    _actorReceivedCoinageString('Your character', {pp: 11, gp: 2, sp: 4, cp: 0}),
    'Your character received 11 pp, 2 gp and 4 sp.',
    'breaks on 3 denominations',
  );
  t.is(
    _actorReceivedCoinageString('Your character', {pp: 10, gp: 0, sp: 0, cp: 2}),
    'Your character received 10 pp and 2 cp.',
    'breaks on 2 denominations',
  );
  t.is(
    _actorReceivedCoinageString('Your character', {pp: 0, gp: 0, sp: 0, cp: 3}),
    'Your character received 3 cp.',
    'breaks on a single denomination',
  );
});

test('spendCoinage', (t) => {
  t.deepEqual(
    spendCoinage(
      {pp: 1, gp: 0, sp: 0, cp: 0},
      {pp: 0, gp: 5, sp: 0, cp: 0},
    ),
    {pp: 0, gp: 5, sp: 0, cp: 0},
    'incorrectly spends when actor has more than toSpend',
  );

  t.throws(
    spendCoinage.bind(
      null,
      {pp: 1, gp: 0, sp: 0, cp: 0},
      {pp: 0, gp: 15, sp: 0, cp: 0},
    ),
    {instanceOf: NotEnoughMoneyError},
    'does not throw an error when actor tries to spend too much money',
  );
});