Require.modules["mocks/cache"] = function(exports, require) {
  function copy(obj) {
    return JSON.parse(JSON.stringify(obj));
  }

  function MockCache() {
    this.cache = {};
  };

  MockCache.prototype = {
    get: function get(key) {
      console.log("cache get", key);
      if (key in this.cache)
        return copy(this.cache[key]);
      return null;
    },
    set: function set(key, value) {
      console.log("cache set", key);
      this.cache[key] = copy(value);
    },
    clear: function clear(key, value) {
      this.cache = {};
    }
  };

  exports.create = function create() {
    return new MockCache();
  };
};

Require.modules["mocks/bugzilla"] = function(exports, require) {
  exports.create = function create(Bugzilla) {
    function MockBugzilla() {
      this.ajax = function ajax(options) {
        console.log(options);
        throw new Error("MockBugzilla.ajax() not implemented");
      };
    };

    MockBugzilla.prototype = Bugzilla;

    return new MockBugzilla();
  };
};

Require.modules["mocks/xhr"] = function(exports, require) {
  function MockXMLHttpRequest(delegate) {
    var self = this;

    var listeners = {
      "load": [],
      "progress": [],
      "error": [],
      "abort": []
    };

    function verifyEventType(eventType) {
      if (!(eventType in listeners))
        throw new Error("unknown event type: " + eventType);
    }

    self.addEventListener = function(eventType, handler, useCapture) {
      verifyEventType(eventType);
      listeners[eventType].push(handler);
      delegate("addEventListener", [eventType, handler, useCapture]);
    };

    self.removeEventListener = function(eventType, handler, useCapture) {
      verifyEventType(eventType);
      var index = listeners[eventType].indexOf(handler);
      if (index == -1)
        throw new Error("handler not registered for event: " + eventType);
      listeners[eventType].splice(index, 1);
      delegate("removeEventListener", [eventType, handler, useCapture]);
    };

    self.setRequestHeader = function(header, value) {
      delegate("setRequestHeader", [header, value]);
    };

    self.send = function(data) {
      delegate("send", [data]);
    };

    self.open = function open(method, url) {
      delegate("open", [method, url]);
    };

    self.mockTriggerEvent = function(event) {
      verifyEventType(event.type);
      listeners.forEach(
        function(listener) {
          listener(event);
        });
    };
  }

  exports.create = function create(delegate) {
    return new MockXMLHttpRequest(delegate);
  };
};
