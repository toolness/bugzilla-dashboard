Require.modules["mocks"] = function(exports, require) {
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

  exports.xhr = function xhr(delegate) {
    return new MockXMLHttpRequest(delegate);
  };
};
