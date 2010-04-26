Require.modules["cache"] = function(exports, require) {
  var window = require("window");
  var cache = window.localStorage.getItem("cache");

  if (cache)
    cache = JSON.parse(cache);
  else
    cache = {};

  exports.set = function set(key, value) {
    cache[key] = value;

    // Remove the key first, to get around a strange iPad
    // issue: http://stackoverflow.com/questions/2603682/is-anyone-else-receiving-a-quota-exceeded-err-on-their-ipad-when-accessing-locals
    window.localStorage.removeItem("cache");

    // TODO: We should really catch QUOTA_EXCEEDED_ERR here,
    // which could be thrown if the user is in private
    // browsing mode.
    window.localStorage.setItem("cache", JSON.stringify(cache));
  };
  exports.get = function get(key) {
    return cache[key];
  };
};
