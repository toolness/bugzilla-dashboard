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

Require.modules["app/ui"] = function(exports, require) {
  var $ = require("jQuery");

  require("app/login").whenChanged(
    function changeUI(user) {
      if (user.isLoggedIn) {
        $(".requires-no-login").hide();
        $(".requires-login").show();
        if (user.isAuthenticated) {
          $(".requires-auth-login").show();
        } else {
          $(".requires-auth-login").hide();
        }
      } else {
        $(".requires-no-login").show();
        $(".requires-login").hide();
        $(".requires-auth-login").hide();
      }
    });

  $("#header .menu li").click(
    function openDialog(event) {
      var dialog = $("#" + this.title);
      if (dialog.length == 0)
        throw new Error("dialog not found: " + this.title);
      dialog.fadeIn();
    });

  $(".dialog").click(
    function dismissDialogOnOutsideClick(event) {
      if (event.target == this)
        $(this).fadeOut();
    });

  function setupDocumentTitleChanger(document) {
    const BASE_TITLE = document.title;

    require("app/login").whenChanged(
      function changeTitle(user) {
        var title = BASE_TITLE;

        if (user.isLoggedIn)
          title = user.username + "'s " + BASE_TITLE;

        if (document.title != title) {
          document.title = title;
          $("#header .title").text(title);
        }
      });
  };

  exports.init = function init(document) {
    setupDocumentTitleChanger(document);

    $("#login form").submit(
      function(event) {
        event.preventDefault();
        require("app/login").set($("#login .username").val(),
                                 $("#login .password").val());
        $("#login").fadeOut();
      });

    require("app/login").set($("#login .username").val(),
                             $("#login .password").val());
    if (!require("app/login").isLoggedIn())
      $("#login").fadeIn();
  };
};
