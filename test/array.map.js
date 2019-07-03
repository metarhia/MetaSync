'use strict';

const metasync = require('..');
const metatests = require('metatests');

metatests.test('successful map', test => {
  const arr = [1, 2, 3];
  const expectedArr = [1, 4, 9];

  metasync.map(
    arr,
    (x, callback) => process.nextTick(() => callback(null, x * x)),
    (err, res) => {
      test.error(err);
      test.strictSame(res, expectedArr);
      test.end();
    }
  );
});

metatests.test('map with empty array', test => {
  const arr = [];
  const expectedArr = [];

  metasync.map(
    arr,
    (x, callback) => process.nextTick(() => callback(null, x * x)),
    (err, res) => {
      test.error(err);
      test.strictSame(res, expectedArr);
      test.end();
    }
  );
});

metatests.test('successful map with another iterable', test => {
  const set = new Set([1, 2, 3]);
  const expectedSet = new Set([1, 4, 9]);

  metasync.map(
    set,
    (x, callback) => process.nextTick(() => callback(null, x * x)),
    (err, res) => {
      test.error(err);
      test.strictSame([...res], [...expectedSet]);
      test.end();
    }
  );
});

metatests.test('map with error', test => {
  const arr = [1, 2, 3];
  const mapError = new Error('Map error');
  let count = 0;

  metasync.map(
    arr,
    (x, callback) =>
      process.nextTick(() => {
        count++;
        if (count === 2) {
          callback(mapError);
          return;
        }
        callback(null, x * x);
      }),
    (err, res) => {
      test.isError(err, mapError);
      test.strictSame(res, undefined);
      test.end();
    }
  );
});

metatests.test('map with not iterable', test => {
  const obj = { a: '1', b: '2', c: '3' };

  test.throws(
    () => metasync.map(obj, test.mustNotCall(), test.mustNotCall()),
    new TypeError('Base is not Iterable')
  );

  test.end();
});
