Require.modules["app/login"] = function(exports) {
  var callbacks = [];
  var username;
  var password;

  exports.whenChanged = function whenChanged(cb) {
    callbacks.push(cb);
  };

  exports.isLoggedIn = function isLoggedIn() {
    return (username != "");
  };

  exports.set = function set(newUsername, newPassword) {
    if (newUsername == username && newPassword == password)
      return;

    username = newUsername;
    password = newPassword;

    var isLoggedIn = (username != "");
    var isAuthenticated = (username != "" && password != "");

    callbacks.forEach(
      function(cb) {
        cb({username: username,
            password: password,
            isLoggedIn: isLoggedIn,
            isAuthenticated: isAuthenticated});
      });
  };
};
