// Really simple JSON cache that uses a form field as
// a back-end.
function buildCache(selector) {
  var data = {};
  var json = $(selector).val();
  if (json.length)
    data = JSON.parse(json);

  return {
    set: function set(key, value) {
      data[key] = value;
      $(selector).val(JSON.stringify(data));
    },
    get: function get(key) {
      return data[key];
    }
  };
}
