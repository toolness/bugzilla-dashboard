Require.modules["cache/html5"] = function(exports, require) {
  exports.create = function create(name, storage) {
    var cache = storage.getItem(name);

    if (cache)
      cache = JSON.parse(cache);
    else
      cache = {};

    return {
      set: function set(key, value) {
        cache[key] = value;

        // Remove the key first, to get around a strange iPad
        // issue: http://stackoverflow.com/questions/2603682/is-anyone-else-receiving-a-quota-exceeded-err-on-their-ipad-when-accessing-locals
        storage.removeItem(name);

        // TODO: We should really catch QUOTA_EXCEEDED_ERR here,
        // which could be thrown if the user is in private
        // browsing mode.
        storage.setItem(name, JSON.stringify(cache));
      },

      get: function get(key) {
        return cache[key];
      },

      clear: function clear() {
        storage.removeItem(name);
        cache = {};
      }
    };
  };
};
