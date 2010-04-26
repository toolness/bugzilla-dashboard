Require.modules["xhr/queue"] = function(exports, require) {
  function XMLHttpRequestQueue() {
    const EVENTS = ["abort", "error", "load"];

    var active = null;
    var queue = [];

    function activateNextInQueue() {
      if (queue.length) {
        var cb = queue.splice(0, 1)[0];
        var xhr = cb();
        if (!xhr)
          throw new Error("enqueued callback did not return xhr");
        EVENTS.forEach(function(name) {
          xhr.addEventListener(name, onDone, false);
        });
        active = xhr;
      }
    }

    function onDone(event) {
      var xhr = event.target;
      EVENTS.forEach(function(name) {
        xhr.removeEventListener(name, onDone, false);
      });
      if (xhr == active) {
        active = null;
        activateNextInQueue();
      }
    };

    this.enqueue = function enqueue(cb) {
      queue.push(cb);
      if (!active)
        activateNextInQueue();
    };

    this.clear = function clear() {
      queue.splice(0);
      if (active) {
        active.abort();
        active = null;
      }
    };
  }

  exports.create = function create() {
    return new XMLHttpRequestQueue();
  };
};
