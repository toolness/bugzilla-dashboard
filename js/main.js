$(window).ready(
  function() {
    const BASE_TITLE = document.title;

    var require = Require.build();

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

    $("#login-form").submit(
      function(event) {
        event.preventDefault();
        require("app/login").set($("#login-username").val(),
                                 $("#login-password").val());
        $("#login").fadeOut();
      });

    require("app/login").set($("#login-username").val(),
                             $("#login-password").val());
    if (!require("app/login").isLoggedIn())
      $("#login").fadeIn();
  });
