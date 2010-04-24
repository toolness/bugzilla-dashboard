function raises(error, func, message) {
  if (!message)
    message = "function raises error: " + error;

  try {
    func();
    ok(false, message + " (no error was raised)");
  } catch (e) {
    equals(e.message, error, message);
  }
}

$(window).ready(function runTests() {
  for (name in window) {
    if (name.match(/^test.+/) &&
        name != "testDone" &&
        name != "testStart" &&
        typeof(window[name]) == "function") {
      test(name, window[name]);
    }
  }
});
