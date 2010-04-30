function Automator(window, jQuery, onDone, onFail) {
  this.jQuery = jQuery;
  this.onDone = onDone;
  this.onFail = onFail;
  this.queue = [];
  this.window = window;
}

Automator.prototype = {
  COMMAND_DELAY: 500,
  queueNextCommand: function queueNextCommand() {
    var self = this;
    function nextCommand() {
      var cmd = self.queue.shift();
      cmd.call(self);
      self.queueNextCommand();
    }

    if (this.queue.length)
      this.window.setTimeout(nextCommand, this.COMMAND_DELAY);
    else
      this.onDone();
  },
  _$: function _$(sel) {
    var query = this.jQuery(sel);

    if (query.length == 0)
      this.onFail("selector yields no results: " + sel);
    if (query.length > 1)
      this.onFail("selector yields " + query.length +
                  " results instead of 1: " + sel);

    return query;
  },
  verifyVisible: function verifyVisible(field) {
    this.queue.push(
      function() {
        var query = this.jQuery(field + ":visible");

        if (query.length == 0)
          this.onFail("selector not visible: " + field);
      });
  },
  type: function type(field, value) {
    this.queue.push(function() { this._$(field).val(value); });
  },
  submit: function submit(form) {
    this.queue.push(function() { this._$(form).submit(); });
  }
};

function testLoginWithNoPassword(auto) {
  auto.type("#login .username", "john@doe.com");
  auto.type("#login .password", "");
  auto.submit("#login form");
  auto.verifyVisible("#header .requires-login");
}

function testLoginWithCorrectPassword(auto) {
  auto.type("#login .username", "john@doe.com");
  auto.type("#login .password", "test");
  auto.submit("#login form");
  auto.verifyVisible("#header .requires-login");
  auto.verifyVisible("#header .requires-auth-login");
}

function testLoginWithIncorrectPassword(auto) {
  auto.type("#login .username", "john@doe.com");
  auto.type("#login .password", "u");
  auto.submit("#login form");
  auto.verifyVisible("#errors .bugzilla-api-error");
}

function setDashboardLoaded(delegate, window) {
  window.onDashboardLoaded = function onDashboardLoaded(dashboard, options) {
    $(dashboard).error(
      function(event) {
        addFailMsg("An error occurred in the dashboard iframe.");
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

function addFailMsg(msg) {
  var msgElem = $('<p class="fail"></p>').text(msg);
  msgElem.hide();
  $("#messages").append(msgElem);
  msgElem.slideDown();
}

function initialize() {
  $(".test-button").click(
    function() {
      var testButton = this;
      var testFunc = window[testButton.id];
      var auto;

      $(testButton).addClass("running");
      function onFail(reason) {
        $(testButton).addClass("fail");
        addFailMsg("Failure in " + $(testButton).text() + ": " + 
                   reason);
      }
      function onDone() {
        $(testButton).removeClass("running");
        if (!$(testButton).hasClass("fail"))
          $(testButton).addClass("success");
      }

      resetDashboard(
        function(method, args) {
          switch (method) {
          case "blackBox.onDashboardLoaded":
            var dashboard = args[0];
            var options = args[1];
            auto = new Automator(window, options.jQuery, onDone,
                                 onFail);
            testFunc(auto);
            break;
          case "blackBox.afterInit":
            auto.queueNextCommand();
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
