function testLoginWithCorrectPassword($) {
  return [
    function() { $("#login .username").val("john@doe.com");
                 $("#login .password").val("test"); },
    function() { $("#login form").submit(); }
  ];
}

function testLoginWithNoPassword($) {
  return [
    function() { $("#login .username").val("john@doe.com");
                 $("#login .password").val(""); },
    function() { $("#login form").submit(); }
  ];
}

function testLoginWithIncorrectPassword($) {
  return [
    function() { $("#login .username").val("john@doe.com");
                 $("#login .password").val("wrong"); },
    function() { $("#login form").submit(); }
  ];
}

function setDashboardLoaded(delegate, window) {
  window.onDashboardLoaded = function onDashboardLoaded(dashboard, options) {
    $(dashboard).error(
      function(event) {
        if (window.console)
          window.console.warn("An error occurred in the dashboard iframe.");
      });

    delegate("blackBox.onDashboardLoaded", [dashboard, options]);

    var require = Require.build(Require.modules, {window: window});

    var moduleExports = {};
    var dbrequire = dashboard.Require.build(dashboard.Require.modules,
                                            moduleExports);

    // Get rid of any form values cached by the browser.
    options.jQuery("input[type=text], input[type=password]").val("");

    var ajaxImpl = require("mocks/bugzilla/trivial").makeAjaxImpl();
    options.cache = require("mocks/cache").create(delegate);
    options.Bugzilla = require("mocks/bugzilla").create(options.Bugzilla,
                                                        ajaxImpl,
                                                        delegate);
    dbrequire("date-utils").now = function() {
      return new Date("Tue Apr 27 2010 09:00:00 GMT");
    };

    delegate("blackBox.beforeInit", []);
    dbrequire("app/loader").init(moduleExports, options);
    delegate("blackBox.afterInit", []);
  };
}

function resetDashboard(delegate) {
  setDashboardLoaded(delegate, window);
  var iframe = $("#dashboard").get(0);
  iframe.src = "index.html?testing=1";
}

function initialize() {
  $(".test-button").click(
    function() {
      var testButton = this;
      var testFunc = window[testButton.id];
      var cmds = [];
      const COMMAND_DELAY = 500;

      function queueNextCommand() {
        if (cmds.length)
          window.setTimeout(nextCommand, COMMAND_DELAY);
        else {
          $(testButton).removeClass("running");
        }
      }

      function nextCommand() {
        var cmd = cmds.shift();
        cmd();
        queueNextCommand();
      }

      $(testButton).addClass("running");
      
      resetDashboard(
        function(method, args) {
          switch (method) {
          case "blackBox.onDashboardLoaded":
            var dashboard = args[0];
            var options = args[1];
            cmds = testFunc(options.jQuery);
            break;
          case "blackBox.afterInit":
            queueNextCommand();
            break;
          }
        });
    });

  resetDashboard(function() {});
}

$(window).ready(
  function() {
    if (!('JSON' in window))
      Require.preload(document, ["js/json2.js"], initialize);
    else
      initialize();
  });
