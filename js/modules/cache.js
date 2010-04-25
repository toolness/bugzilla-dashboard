Require.modules["cache"] = function(exports, require) {
  var window = require("window");
  var cache;

  if (window.localStorage["cache"]) {
    cache = JSON.parse(window.localStorage["cache"]);
  } else
    cache = {};

  exports.set = function set(key, value) {
    cache[key] = value;
    window.localStorage["cache"] = JSON.stringify(cache);
  };
  exports.get = function get(key) {
    return cache[key];
  };
};
