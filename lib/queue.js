'use strict';

const metasync = {};
module.exports = metasync;

metasync.ConcurrentQueue = function(
  // ConcurrentQueue
  concurrency, // number of simultaneous and asynchronously executing tasks
  timeout // process timeout (optional), for single item
) {
  this.isOnPause = false;
  this.concurrency = concurrency;
  this.timeout = timeout;
  this.count = 0;
  this.items = [];
  this.events = {
    error: null,
    timeout: null,
    empty: null,
    process: null,
    task: null,
    pause: null,
    resume: null,
    stop: null
  };
};

metasync.ConcurrentQueue.prototype.add = function(
  item // add item to queue
) {
  if (!this.isOnPause) {
    if (this.count < this.concurrency) {
      this.next(item);
    } else {
      this.items.push(item);
    }
  }
  return this;
};

metasync.ConcurrentQueue.prototype.next = function(
  item // process next item from queue
) {
  const queue = this;
  let timer;
  if (queue.isOnPause) return this;
  queue.count++;
  if (queue.timeout) {
    timer = setTimeout(() => {
      const err = new Error('ConcurrentQueue timed out');
      queue.emit('timeout', err);
    }, queue.timeout);
  }
  const stub = (item, callback) => callback();
  const fn = queue.events.process || stub;
  fn(item, result => {
    queue.count--;
    queue.emit('task', result);
    if (queue.timeout) {
      clearTimeout(timer);
    }
    if (queue.items.length > 0) {
      if (!queue.isOnPause) {
        const item = queue.items.shift();
        queue.next(item);
      }
    } else if (queue.count === 0) {
      queue.emit('empty');
    }
  });
  return this;
};

metasync.ConcurrentQueue.prototype.on = function(
  // ConcurrentQueue events:
  eventName,
  fn
  // on('error', function(err))
  // on('empty', function()) - no more items in queue
  // on('process', function(item, callback)) - process item function
  // on('timeout', function(err, data))
  // on('task', function(result)) - task is done
  // on('pause', function()) - queue is paused
  // on('resume', function()) - queue resumes execution process
  // on('stop', function()) - queue is stopped
) {
  if (!this.isOnPause && eventName in this.events) {
    this.events[eventName] = fn;
  }
  return this;
};

metasync.ConcurrentQueue.prototype.emit = function(
  eventName, // event name
  err, // instance of Error
  data // attached data
) {
  if (!this.isOnPause) {
    const event = this.events[eventName];
    if (event) event(err, data);
  }
  return this;
};

metasync.ConcurrentQueue.prototype.pause = function() {
  this.isOnPause = true;
  return this.emit('pause');
};

metasync.ConcurrentQueue.prototype.resume = function() {
  this.isOnPause = false;
  this.emit('resume');
  while (this.count < this.concurrency) {
    const item = this.items.shift();
    if (!item) return this;
    this.next(item);
  }
  return this;
};

metasync.ConcurrentQueue.prototype.stop = function() {
  this.isOnPause = false;
  this.concurrency = null;
  this.timeout = null;
  this.count = 0;
  this.items = [];
  this.events = {
    error: null,
    timeout: null,
    empty: null,
    process: null,
    task: null,
    pause: null,
    resume: null,
    stop: null
  };
  return this.emit('stop');
};
