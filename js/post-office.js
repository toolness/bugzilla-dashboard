var PostOffice = {
  latestID: 1,
  poBoxes: {},
  exposedMethods: {},
  send: function send(command, arg, window, cb) {
    var msg = {
      command: command,
      arg: arg,
      id: this.latestID++
    };
    if (cb)
      this.poBoxes[msg.id] = cb;
    window.postMessage(JSON.stringify(msg), "*");
  },
  receive: function receive(event) {
    var msg = JSON.parse(event.data);
    if (msg.command) {
      if (msg.command in this.exposedMethods) {
        function callback(arg) {
          event.source.postMessage(
            JSON.stringify({id: msg.id, arg: arg}),
            "*"
          );
        }
        this.exposedMethods[msg.command](msg.arg, callback, event);
      } else
        throw new Error("unknown method: " + msg.command);
    } else if (msg.id) {
      if (msg.id in this.poBoxes) {
        var cb = this.poBoxes[msg.id];
        delete this.poBoxes[msg.id];
        cb(msg.arg);
      } else
        throw new Error("no callback registered for msg id " +
                        msg.id);
    } else
      throw new Error("unknown message: " + event.data);
  }
};

window.addEventListener(
  "message",
  function(event) { PostOffice.receive(event); },
  false
);
