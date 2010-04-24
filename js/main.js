$(window).ready(
  function() {
    const BASE_TITLE = document.title;

    function onLoginChange() {
      var username = $("#login-username").val();
      var password = $("#login-password").val();
      var title = BASE_TITLE;

      if (username) {
        $("#login").fadeOut();
        title = username + "'s " + BASE_TITLE;

        $(".requires-no-login").hide();
        $(".requires-login").show();
        if (password) {
          $(".requires-auth-login").show();
        } else {
          $(".requires-auth-login").hide();
        }
      } else {
        $("#login").fadeIn();
        $(".requires-no-login").show();
        $(".requires-login").hide();
        $(".requires-auth-login").hide();
      }

      if (document.title != title) {
        document.title = title;
        $("#header .title").text(title);
      }
    }

    $("#header .menu li").click(
      function(event) {
        var dialog = $("#" + this.title);
        if (dialog.length == 0)
          throw new Error("dialog not found: " + this.title);
        dialog.fadeIn();
      });

    $("#login-form").submit(
      function(event) {
        event.preventDefault();
        onLoginChange();
      });

    $(".dialog").click(
      function(event) {
        if (event.target == this)
          $(this).fadeOut();
      });
    onLoginChange();
  });
