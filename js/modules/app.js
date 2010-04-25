Require.modules["app/login"] = function(exports) {
  var callbacks = [];
  var username;
  var password;

  exports.whenChanged = function whenChanged(cb) {
    callbacks.push(cb);
  };

  exports.isLoggedIn = function isLoggedIn() {
    return (username && username != "");
  };

  exports.set = function set(newUsername, newPassword) {
    if (newUsername == username && newPassword == password)
      return;

    username = newUsername;
    password = newPassword;

    var isLoggedIn = (username && username != "");
    var isAuthenticated = (isLoggedIn && password && password != "");

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

    require("app/ui/dashboard").init();
    require("app/login").set($("#login .username").val(),
                             $("#login .password").val());
    if (!require("app/login").isLoggedIn())
      $("#login").fadeIn();
  };
};

Require.modules["app/ui/dashboard"] = function(exports, require) {
  var $ = require("jQuery");
  var cache = require("cache");
  var dateUtils = require("date-utils");
  var bugzilla = require("bugzilla");
  var window = require("window");

  function sortByLastChanged(bugs) {
    var lctimes = {};

    bugs.forEach(
      function(bug) {
        lctimes[bug.id] = dateUtils.dateFromISO8601(bug.last_change_time);
      });

    function compare(a, b) {
      var alc = lctimes[a.id];
      var blc = lctimes[b.id];

      if (alc < blc)
        return -1;
      if (alc > blc)
        return 1;
      return 0;
    }

    bugs.sort(compare);
  }

  function updatePrettyDates(query) {
    query.find(".last-changed").each(
      function() {
        var lcTime = $(this).attr("data-last-change");
        $(this).text(dateUtils.prettyDate(lcTime));
      });
  }

  const PRETTY_DATE_UPDATE_INTERVAL = 1000 * 60;

  window.setInterval(function() { updatePrettyDates($("#reports")); },
                     PRETTY_DATE_UPDATE_INTERVAL);

  function showBugs(query, bugs) {
    var table = $("#templates .bugs").clone();
    var rowTemplate = table.find(".bug-row").remove();
    sortByLastChanged(bugs);
    bugs.reverse();
    bugs.forEach(
      function(bug) {
        var row = rowTemplate.clone();
        row.attr("id", "bug-id-" + bug.id);
        row.find(".summary").text(bug.summary);
        row.addClass("status-" + bug.status);
        if (bug.priority != "--") {
          row.addClass(bug.priority);
          row.addClass(bug.severity);
        }
        row.find(".last-changed").attr("data-last-change",
                                       bug.last_change_time);

        row.click(
          function onClick() {
            window.open(bugzilla.getShowBugURL(bug.id));
          });

        row.hover(
          function onIn() {
            var tooltip = $("#templates .bug-tooltip").clone();
            tooltip.find(".priority").text(bug.priority);
            // TODO: Show more information in tooltip.
            $(this).append(tooltip);
          },
          function onOut() {
            $(this).find(".bug-tooltip").remove();
          });

        table.append(row);
      });
    updatePrettyDates(table);
    query.find(".bugs").remove();
    query.append(table);
    table.hide();
    removeDuplicateBugs();
    table.fadeIn();
  }

  // Remove duplicate bugs, preferring the first listing of a bug in
  // the DOM to later ones. This is b/c the reports further down the
  // page are the less "interesting" ones, and we want to capture
  // the most "interesting" part of each bug.
  function removeDuplicateBugs() {
    var visited = {};
    $("#reports .bug-row").each(
      function() {
        var id = $(this).attr("id");
        if (id in visited)
          $(this).remove();
        else
          visited[id] = true;
      });
  }

  function report(selector, searchTerms) {
    var newTerms = {__proto__: defaults};
    for (name in searchTerms)
      newTerms[name.replace(/_DOT_/g, ".")] = searchTerms[name];

    var cached = cache.get(selector);
    if (cached)
      showBugs($(selector), cached);
    
    $(selector).find("h2").addClass("loading");
    
    bugzilla.search(newTerms,
                    function(response) {
                      cache.set(selector, response.bugs);
                      showBugs($(selector), response.bugs);
                      $(selector).find("h2").removeClass("loading");
                    });
  }

  function timeAgo(ms) {
    var now = new Date();
    var then = new Date(now - ms);
    return dateUtils.dateToISO8601(then);
  }

  const MS_PER_HOUR = 1000 * 60 * 60;
  const MS_PER_DAY =  MS_PER_HOUR * 24;
  const MS_PER_WEEK = MS_PER_DAY * 7;

  var defaults = {
    changed_after: timeAgo(MS_PER_WEEK * 14)
  };

  function update(myUsername) {
    report("#assigned-bugs",
           {status: ["NEW", "UNCONFIRMED", "ASSIGNED", "REOPENED"],
            email1: myUsername,
            email1_type: "equals",
            email1_assigned_to: 1});

    report("#fixed-bugs",
           {resolution: ["FIXED"],
            changed_after: timeAgo(MS_PER_WEEK),
            email1: myUsername,
            email1_type: "equals",
            email1_assigned_to: 1,
            email1_reporter: 1,
            email1_cc: 1});

    report("#code-reviews",
           {status: ["NEW", "UNCONFIRMED", "ASSIGNED", "REOPENED"],
            flag_DOT_requestee: myUsername});

    report("#reported-bugs",
           {status: ["NEW", "UNCONFIRMED", "ASSIGNED", "REOPENED"],
            email1: myUsername,
            email1_type: "equals",
            email1_reporter: 1,
            email2: myUsername,
            email2_type: "not_equals",
            email2_assigned_to: 1});

    report("#cc-bugs",
           {status: ["NEW", "UNCONFIRMED", "ASSIGNED", "REOPENED"],
            email1: myUsername,
            email1_type: "equals",
            email1_cc: 1,
            email2: myUsername,
            email2_type: "not_equals",
            email2_assigned_to: 1,
            email2_reporter: 1});
  };

  exports.init = function init() {
    require("app/login").whenChanged(
      function changeSearchCriteria(user) {
        if (user.isLoggedIn) {
          update(user.username);
        }
      });
  };
};
