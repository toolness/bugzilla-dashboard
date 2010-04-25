Require.modules["cache"] = function(exports) {
  var cache = {};

  exports.set = function set(key, value) {
    cache[key] = value;
  };
  exports.get = function get(key) {
    return cache[key];
  };
};
