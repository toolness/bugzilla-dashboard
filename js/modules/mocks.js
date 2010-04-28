Require.modules["mocks/cache"] = function(exports, require) {
  function copy(obj) {
    if (typeof(obj) == "function")
      throw new Error("can't store functions");
    if (typeof(obj) == "object")
      return JSON.parse(JSON.stringify(obj));
    return obj;
  }

  function MockCache(delegate) {
    this.delegate = delegate;
    this.cache = {};
  };

  MockCache.prototype = {
    get: function get(key) {
      this.delegate("get", [key]);
      if (key in this.cache)
        return copy(this.cache[key]);
      return null;
    },
    set: function set(key, value) {
      this.delegate("set", [key, value]);
      this.cache[key] = copy(value);
    },
    clear: function clear() {
      this.delegate("clear", []);
      this.cache = {};
    }
  };

  exports.create = function create(delegate) {
    return new MockCache(delegate);
  };
};

Require.modules["mocks/bugzilla/trivial"] = function(exports, require) {
  var bug = {
    'summary': 'Application destroys computer on startup',
    'last_change_time': '2010-04-13T18:02:00Z',
    'status': 'NEW',
    'priority': 'P1',
    'severity': 'blocker',
    'id': '558680'
  };

  var user = {
    'email': 'john@doe.com',
    'real_name': 'John Doe',
    'name': 'john@doe.com'
    };

  var config = {
    product: {
      foo: {
        component: {
          caching: {},
          passwords: {}
        }
      },
      bar: {
        component: {
          "help system": {},
          "curmudgeonry": {}
        }
      }
    }
  };

  exports.makeAjaxImpl = function makeAjaxImpl(delegate, setTimeout) {
    return function ajaxImpl(options) {
      var authenticated = false;
      if (options.data && options.data.username) {
        if (!(options.data.username == 'john@doe.com' &&
              options.data.password == 'test'))
          return {error: true, message: "wrong password, yo!"};
        authenticated = true;
      }
      switch (options.url) {
      case "/bug":
        if (!('resolution' in options.data))
          return {bugs: [bug]};
        return {bugs: []};
      case "/configuration":
        return config;
      case "/user":
        if (!authenticated)
          return {error: true, message: "needs login, yo!"};
        if (user.email.indexOf(options.data.match) != -1 ||
            user.real_name.indexOf(options.data.match) != -1)
          return {users: [user]};
        return {users: []};
      default:
        throw new Error("unexpected url: " + options.url);
      }
    };
  };
};

Require.modules["mocks/bugzilla"] = function(exports, require) {
  const DEFAULT_RESPONSE_TIME = 500;

  function response(delegate, obj, time) {
    if (time === undefined)
      time = DEFAULT_RESPONSE_TIME;

    function xhrDelegate(method, args) {
      delegate("xhr." + method, args);
    }

    var req = require("mocks/xhr").create(xhrDelegate);

    require("window").setTimeout(
      function() {
        req.responseText = JSON.stringify(obj);
        req.status = 200;
        req.statusText = "OK";
        req.mockTriggerEvent({type: "load", target: req});
      },
      time
    );
    return req;
  }

  exports.create = function create(Bugzilla, ajaxImpl, delegate) {
    function MockBugzilla() {
      this.ajax = function ajax(options) {
        var obj = ajaxImpl(options, exports);
        var req = response(delegate, obj);
        req.addEventListener(
          "load",
          function onLoad() {
            var response = JSON.parse(req.responseText);
            if (!response.error)
              options.success(response);
          },
          false
        );
        return req;
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
      listeners[event.type].forEach(
        function(listener) {
          listener(event);
        });
    };
  }

  exports.create = function create(delegate) {
    return new MockXMLHttpRequest(delegate);
  };
};
