'use strict';

const tap = require('tap');
const metasync = require('..');

tap.test('memoize', (test) => {
  const storage = {
    file1: Buffer.from('file1'),
    file2: Buffer.from('file2'),
  };

  const getData = (file, callback) => {
    process.nextTick(() => {
      const result = storage[file];
      if (result) callback(null, result);
      else callback(new Error('File not found'));
    });
  };

  const memoizedGetData = metasync.memoize(getData);

  memoizedGetData('file1', (err, data) => {
    test.error(err);
    test.strictSame(data, storage.file1);
    memoizedGetData('file2', (err, data) => {
      test.error(err);
      test.strictSame(data, storage.file2);
      memoizedGetData('file1', (err, data) => {
        test.error(err);
        test.strictSame(data, storage.file1);
        memoizedGetData('file2', (err, data) => {
          test.error(err);
          test.strictSame(data, storage.file2);
          test.end();
        });
      });
    });
  });
});

tap.test('memoize clear cache', (test) => {
  const storage = {
    file1: Buffer.from('file1'),
  };

  const getData = (file, callback) => {
    process.nextTick(() => {
      const result = storage[file];
      if (result) callback(null, result);
      else callback(new Error('File not found'));
    });
  };

  const memoizedGetData = metasync.memoize(getData);

  memoizedGetData('file1', (err, data) => {
    test.error(err);
    test.strictSame(data, storage.file1);
    storage.file1 = Buffer.from('changed');
    memoizedGetData.clear();
    memoizedGetData('file1', (err, data) => {
      test.error(err);
      test.strictSame(data, Buffer.from('changed'));
      test.end();
    });
  });
});

tap.test('memoize cache del', (test) => {
  const storage = {
    file1: Buffer.from('file1'),
  };

  const getData = (file, callback) => {
    process.nextTick(() => {
      const result = storage[file];
      if (result) callback(null, result);
      else callback(new Error('File not found'));
    });
  };

  const memoizedGetData = metasync.memoize(getData);

  memoizedGetData('file1', (err, data) => {
    test.error(err);
    test.strictSame(data, storage.file1);
    storage.file1 = Buffer.from('changed');
    memoizedGetData.del('file1');
    memoizedGetData('file1', (err, data) => {
      test.error(err);
      test.strictSame(data, Buffer.from('changed'));
      test.end();
    });
  });
});

tap.test('memoize cache add', (test) => {
  const getData = (file, callback) => {
    process.nextTick(() => {
      const result = Buffer.from('added');
      callback(null, result);
    });
  };

  const memoizedGetData = metasync.memoize(getData);

  const file1 = Buffer.from('added');
  memoizedGetData.add('file1', null, file1);
  memoizedGetData('file1', (err, data) => {
    test.error(err);
    test.strictSame(data, Buffer.from('added'));
    test.end();
  });
});

tap.test('memoize cache get', (test) => {
  const getData = (file, callback) => {
    process.nextTick(() => {
      const result = Buffer.from('added');
      callback(null, result);
    });
  };

  const memoizedGetData = metasync.memoize(getData);

  const file1 = Buffer.from('added');
  memoizedGetData.add('file1', null, file1);
  memoizedGetData.get('file1', (err, data) => {
    test.error(err);
    test.strictSame(data, Buffer.from('added'));
    test.end();
  });
});
