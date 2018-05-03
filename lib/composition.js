'use strict';

function Composition() {}

const compose = (
  // Asynchronous functions composition
  flow // array of functions, callback-last / err-first
  // Returns: function, composed callback-last / err-first
) => {
  const comp = (data, callback) => {
    if (!callback) {
      callback = data;
      data = {};
    }
    comp.done = callback;
    if (comp.canceled) {
      if (callback) {
        callback(new Error('Metasync: asynchronous composition canceled'));
      }
      return;
    }
    if (comp.timeout) {
      comp.timer = setTimeout(() => {
        comp.timer = null;
        if (callback) {
          callback(new Error('Metasync: asynchronous composition timed out'));
          comp.done = null;
        }
      }, comp.timeout);
    }
    comp.context = data;
    comp.arrayed = Array.isArray(comp.context);
    comp.paused = false;
    if (comp.len === 0) {
      comp.finalize();
      return;
    }
    if (comp.parallelize) comp.parallel();
    else comp.sequential();
  };
  const first = flow[0];
  const parallelize = Array.isArray(first);
  const fns = parallelize ? first : flow;
  comp.fns = fns;
  comp.parallelize = parallelize;
  comp.context = null;
  comp.timeout = 0;
  comp.timer = null;
  comp.len = fns.length;
  comp.canceled = false;
  comp.paused = true;
  comp.arrayed = false;
  comp.done = null;
  Object.setPrototypeOf(comp, Composition.prototype);
  return comp;
};

Composition.prototype.finalize = function(err) {
  if (this.canceled) return;
  if (this.timer) {
    clearTimeout(this.timer);
    this.timer = null;
  }
  const callback = this.done;
  if (callback) {
    this.done = null;
    callback(err, this.context);
  }
};

Composition.prototype.collect = function(err, result) {
  if (this.canceled) return;
  if (err) {
    const callback = this.done;
    if (callback) {
      this.done = null;
      callback(err);
    }
    return;
  }
  if (result !== this.context && result !== undefined) {
    if (this.arrayed) {
      this.context.push(result);
    } else if (typeof(result) === 'object') {
      Object.assign(this.context, result);
    }
  }
};

Composition.prototype.parallel = function() {
  let counter = 0;
  const next = (err, result) => {
    this.collect(err, result);
    if (++counter === this.len) this.finalize();
  };
  const fns = this.fns;
  const len = this.len;
  const context = this.context;
  let i, fn;
  for (i = 0; i < len; i++) {
    fn = fns[i];
    if (Array.isArray(fn)) compose(fn)(context, next);
    else fn(context, next);
  }
};

Composition.prototype.sequential = function() {
  let counter = -1;
  const fns = this.fns;
  const len = this.len;
  const context = this.context;
  const next = (err, result) => {
    if (err || result) this.collect(err, result);
    if (++counter === len) {
      this.finalize();
      return;
    }
    const fn = fns[counter];
    if (Array.isArray(fn)) compose(fn)(context, next);
    else fn(context, next);
  };
  next();
};

Composition.prototype.then = function(fulfill, reject) {
  if (this.canceled) {
    reject(new Error('Metasync: asynchronous composition canceled'));
    return;
  }
  this((err, result) => {
    if (err) reject(err);
    else fulfill(result);
  });
  return this;
};

Composition.prototype.clone = function() {
  const fns = this.fns.slice();
  const flow = this.parallelize ? [fns] : fns;
  return compose(flow);
};

Composition.prototype.pause = function() {
  if (this.canceled) return this;
  this.paused = true;
  return this;
};

Composition.prototype.resume = function() {
  if (this.canceled) return this;
  this.paused = false;
  return this;
};

Composition.prototype.timeout = function(msec) {
  this.timeout = msec;
  return this;
};

Composition.prototype.cancel = function() {
  if (this.canceled) return this;
  this.canceled = true;
  const callback = this.done;
  if (callback) {
    this.done = null;
    callback(new Error('Metasync: asynchronous composition canceled'));
  }
  return this;
};

module.exports = { compose };
