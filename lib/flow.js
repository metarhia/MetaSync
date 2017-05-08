'use strict';

module.exports = (api) => {

  api.metasync.flow = (
    // Create a composed function from flow syntax
    fns // array of functions
    // data - incoming data
    // callback(data)
    //   data - outgoing data
  ) => (
    data, // pass data structure to flow
    done // on done function(err, result)
  ) => {
    const finish = result => done(null, result);
    if (fns.length === 1) api.metasync.parallel(fns[0], finish, data);
    else api.metasync.sequential(fns, finish, data);
  };

  api.metasync.composition = (
    // Create a composed function from flow syntax
    // it's deprecated, use metasync.flow instead
    fns, // array of function([data,] callback)
    // data - incoming data
    // callback(data)
    //   data - outgoing data
    done, // callback(data)
    // data - hash with of functions results
    data // incoming data
  ) => {
    if (fns.length === 1) api.metasync.parallel(fns[0], done, data);
    else api.metasync.sequential(fns, done, data);
  };

  api.metasync.parallel = (
    // Parallel execution
    fns, // array of function([data,] callback)
    // data - incoming data
    // callback - function(data)
    //   data - outgoing data
    done, // on done callback(data)
    // data - hash with of functions results
    data = {} // incoming data
  ) => {
    const len = fns.length;
    let counter = 0;
    let finished = false;
    done = api.metasync.cb(done);

    if (len < 1) return done(data);
    fns.forEach((fn) => {
      const finish = (result) => {
        if (fn.name && result) data[fn.name] = result;
        if (result instanceof Error) {
          if (!finished) done(result);
          finished = true;
        } else if (++counter >= len) {
          done(data);
        }
      };
      // fn may be array of function
      if (Array.isArray(fn)) api.metasync.composition(fn, finish, data);
      else if (fn.length === 2) fn(data, finish);
      else fn(finish);
    });
  };

  api.metasync.sequential = (
    // Sequential execution
    fns, // array of function([data,] callback)
    // data - incoming data
    // callback - function(data)
    //   data - outgoing data
    done, // on done callback(data)
    // data - hash with of functions results
    data = {} // incoming data
  ) => {
    let i = -1;
    const len = fns.length;
    done = api.metasync.cb(done);

    function next() {
      let fn = null;
      const finish = (result) => {
        if (fn.name && result) data[fn.name] = result;
        if (result instanceof Error) return done(result);
        next();
      };
      if (++i >= len) return done(data);
      fn = fns[i];
      if (Array.isArray(fn)) api.metasync.composition(fn, finish, data);
      else if (fn.length === 2) fn(data, finish);
      else fn(finish);
    }

    if (len > 0) next();
    else done(data);
  };

};
