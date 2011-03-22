Require.modules["app/loader"] = function(exports, require) {
  exports.init = function init(moduleExports, options) {
    var cache;
    if ("cache" in options)
      cache = options.cache;
    else 
      cache = require("cache/html5").create(
        "bugzilla-dashboard-cache",
        options.window.sessionStorage
      );

    var bugzilla = require("app/bugzilla-auth").create(options.Bugzilla);

    moduleExports.bugzilla = bugzilla;
    moduleExports.cache = cache;
    moduleExports.window = options.window;
    moduleExports.jQuery = options.jQuery;

    require("app/ui").init(options.window.document);
  };
};

Require.modules["app/login"] = function(exports) {
  var callbacks = [];
  var username;
  var password;
  var passwordProvider;

  exports.setPasswordProvider = function setPasswordProvider(pp) {
    passwordProvider = pp;
  };

  exports.whenChanged = function whenChanged(cb) {
    callbacks.push(cb);
  };

  exports.get = function get() {
    var isLoggedIn = (username && username != "");
    var isAuthenticated = (isLoggedIn && password && password != "");

    return {
      username: username,
      password: password,
      isLoggedIn: isLoggedIn,
      isAuthenticated: isAuthenticated
    };
  };

  exports.set = function set(newUsername, newPassword) {
    if ((newUsername && newUsername != "") &&
        (!newPassword || newPassword == "") &&
        (passwordProvider))
      newPassword = passwordProvider(newUsername);

    if (newUsername == username && newPassword == password)
      return;

    username = newUsername;
    password = newPassword;

    var info = exports.get();

    callbacks.forEach(function(cb) { cb(info); });
  };
};

Require.modules["app/errors"] = function(exports, require) {
  var $ = require("jQuery");

  var errors = $("#errors");
  var messages = $("#templates .errors");
  var lastError = null;

  exports.log = function log(name) {
    var message = messages.find("." + name);
    if (!message.length) {
      exports.log("unknown-error");
      return;
    }
    if (lastError == message.get(0))
      return;
    lastError = message.get(0);

    message = message.clone();
    errors.append(message);
    if (errors.children().length == 1)
      errors.fadeIn();
    else
      message.fadeIn();
  };
};

Require.modules["app/bugzilla-auth"] = function(exports, require) {
  function onError(event) {
    var xhr = event.target;
    require("app/errors").log("bugzilla-api-error");
  }

  function onLoad(event) {
    var xhr = event.target;
    var response = JSON.parse(xhr.responseText);
    if (response.error)
      require("app/errors").log("bugzilla-api-error");
  }

  exports.create = function(Bugzilla) {
    function AuthenticatedBugzilla() {
      this.ajax = function ajax(options) {
        var user = require("app/login").get();

        if (user.isAuthenticated) {
          if (!options.data)
            options.data = {};
          options.data.username = user.username;
          options.data.password = user.password;
        }

        var xhr = Bugzilla.ajax.call(this, options);

        xhr.addEventListener("load", onLoad, false);
        xhr.addEventListener("error", onError, false);

        return xhr;
      };
    }

    AuthenticatedBugzilla.prototype = Bugzilla;

    return new AuthenticatedBugzilla();
  };
};

Require.modules["app/commands"] = function(exports, require) {
  var commands = {};

  exports.get = function get(name) {
    if (!(name in commands))
      throw new Error("command not found: " + name);
    return commands[name];
  };

  exports.register = function(options) {
    if (options.name in commands)
      throw new Error("command already registered: " + options.name);
    commands[options.name] = options;
  };
};

Require.modules["app/ui/login-form"] = function(exports, require) {
  var $ = require("jQuery");
  var cachedUsername = $("#login .username").val();
  var cachedPassword = $("#login .password").val();

  $("#login form").submit(
    function(event) {
      event.preventDefault();
      require("app/login").set($("#login .username").val(),
                               $("#login .password").val());
      $("#login").fadeOut();
    });

  require("app/login").whenChanged(
    function maybeChangeUsernameField(user) {
      var usernameField = $("#login .username");
      if (user.isLoggedIn && usernameField.val() != user.username)
        usernameField.val(user.username);
    });

  require("app/login").setPasswordProvider(
    function maybeGetCachedPasswordFromForm(username) {
      if (cachedUsername == username)
        return cachedPassword;
      return "";
    });

  exports.init = function init() {
  };
};

Require.modules["app/ui/file-bug"] = function(exports, require) {
  const EM_DASH = "\u2014";

  var $ = require("jQuery");
  var cache = require("cache");
  var bugzilla = require("bugzilla");
  var window = require("window");
  var config = cache.get("configuration");
  var needToFetchConfig = config ? false : true;
  var categories;
  var queuedRespond;

  function buildCategories() {
    categories = [];
    for (product in config.product)
      for (component in config.product[product].component)
        categories.push(product + EM_DASH + component);
  }

  function fetchConfig() {
    bugzilla.ajax({url: "/configuration",
                   data: {flags: 0},
                   success: function(result) {
                     config = result;
                     cache.set("configuration", result);
                     if (queuedRespond)
                       queuedRespond();
                   }});
  }

  var categoryOptions = {
    minLength: 2,
    source: function(request, response) {
      function respond() {
        queuedRespond = null;

        var suggs = [];
        var terms = request.term.split(" ");

        if (!categories)
          buildCategories();

        categories.forEach(
          function(category) {
            for (var i = 0; i < terms.length; i++)
              if (!category.match(terms[i], "i"))
                return;
            suggs.push(category);
          });

        response(suggs);
      };

      if (!config) {
        queuedRespond = respond;
        if (needToFetchConfig) {
          needToFetchConfig = false;
          fetchConfig();
        }
      } else
        respond();
    }
  };

  $("#file-bug .category").autocomplete(categoryOptions);
  $("#file-bug").submit(
    function(event) {
      event.preventDefault();
      var parts = $("#file-bug .category").val().split(EM_DASH);
      window.open(bugzilla.BASE_UI_URL + "/enter_bug.cgi?" +
                  "product=" + escape(parts[0]) + "&" +
                  "component=" + escape(parts[1]));
    });

  exports.init = function init() {
  };
};

Require.modules["app/ui/repair"] = function(exports, require) {
  var $ = require("jQuery");

  $("#repair form").submit(
    function() {
      var phrase = $("#repair .phrase").val();
      var response;
      if (phrase == "repair my dashboard") {
        require("cache").clear();
        response = $("#templates .repair-success").clone();
      } else
        response = $("#templates .repair-failure").clone();
      $("#repair .result").empty().append(response);
      $("#repair .result").hide().slideDown();
    });

  exports.init = function init() {
  };
};

Require.modules["app/ui/find-user"] = function(exports, require) {
  var $ = require("jQuery");
  var bugzilla = require("bugzilla");
  var window = require("window");
  var currReq;

  var options = {
    minLength: 2,
    delay: 1000,
    source: function(request, response) {
      function success(result) {
        currReq = null;
        var suggs = [];
        result.users.forEach(
          function(user) {
            suggs.push({label: user.real_name + " (" + user.name + ")",
                        value: user.name});
          });
        response(suggs);
      }
      if (currReq)
        currReq.abort();
      currReq = bugzilla.ajax({url: "/user",
                               data: {match: request.term},
                               success: success});
    }
  };

  $("#find-user .query").autocomplete(options);
  $("#find-user form").submit(
    function(event) {
      event.preventDefault();
      var username = $("#find-user .query").val();
      var url = require("app/ui/hash").usernameToHash(username);
      window.open(url);
    });

  exports.init = function init() {
  };
};

Require.modules["app/ui"] = function(exports, require) {
  var $ = require("jQuery");

  require("app/login").whenChanged(
    function changeUI(user) {
      var show = {
        "no-login": false,
        "login": false,
        "auth-login": false,
        "no-auth": false,
        "no-auth-login": false
      };

      if (user.isLoggedIn) {
        show["login"] = true;
        if (user.isAuthenticated)
          show["auth-login"] = true;
        else {
          show["no-auth"] = true;
          show["no-auth-login"] = true;
        }
      } else {
        show["no-login"] = true;
        show["no-auth"] = true;
      }

      for (classSuffix in show) {
        var query = $(".requires-" + classSuffix);
        if (show[classSuffix])
          query.show();
        else
          query.hide();
      }
    });

  $("#header .menu li").click(
    function onMenuItemClick(event) {
      if (this.hasAttribute("data-command")) {
        var cmdName = this.getAttribute("data-command");
        require("app/commands").get(cmdName).execute();
      } else
        openDialog(this.getAttribute("data-dialog"));
    });

  $(".dialog").click(
    function dismissDialogOnOutsideClick(event) {
      if (event.target == this)
        $(this).fadeOut();
    });

  function dismissDialogOnEscape(event) {
    if (event.keyCode == 27)
      $(this).fadeOut();
  }

  // For Safari.
  $(".dialog").keyup(dismissDialogOnEscape);
  // For Firefox.
  $(".dialog").keypress(dismissDialogOnEscape);

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

  function openDialog(name) {
    var dialog = $("#" + name);
    if (dialog.length == 0)
      throw new Error("dialog not found: " + name);
    dialog.fadeIn(
      function() {
        dialog.find("input:first").focus();
      });
  };

  exports.init = function init(document) {
    setupDocumentTitleChanger(document);

    require("app/ui/repair").init();
    require("app/ui/dashboard").init();
    require("app/ui/login-form").init();
    require("app/ui/find-user").init();
    require("app/ui/file-bug").init();
    require("app/ui/hash").init(document);

    if (!require("app/login").get().isLoggedIn)
      openDialog("login");
  };
};

Require.modules["app/ui/hash"] = function(exports, require) {
  function usernameFromHash(location) {
    if (location.hash) {
      var match = location.hash.match(/#username=(.*)/);
      if (match)
        return unescape(match[1]);
    }
    return "";
  }

  function setLoginFromHash(location) {
    var username = usernameFromHash(location);

    var user = require("app/login").get();
    if (user.username != username)
      require("app/login").set(username);
  }

  exports.usernameToHash = function usernameToHash(username) {
    return "#username=" + escape(username);
  };

  exports.init = function init(document) {
    require("app/login").whenChanged(
      function(user) {
        if (user.isLoggedIn) {
          var hash = exports.usernameToHash(user.username);
          if (document.location.hash != hash)
            document.location.hash = hash;
        } else
          document.location.hash = "";
      });

    var window = document.defaultView;

    function onHashChange() {
      setLoginFromHash(document.location);
    }

    if ("onhashchange" in window)
      window.addEventListener("hashchange", onHashChange, false);
    else
      window.setInterval(onHashChange, 1000);

    onHashChange();
  };
};

Require.modules["app/ui/dashboard"] = function(exports, require) {
  var $ = require("jQuery");
  var cache = require("cache");
  var dateUtils = require("date-utils");
  var bugzilla = require("bugzilla");
  var window = require("window");
  var xhrQueue = require("xhr/queue").create();

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

  const BUGS_TO_SHOW = 10;

  function showBugs(query, bugs) {
    var table = $("#templates .bugs").clone();
    var rowTemplate = table.find(".bug-row").remove();

    function appendRowForBug(bug) {
      var row = rowTemplate.clone();
      row.attr("href", bugzilla.getShowBugURL(bug.id));
      row.attr("id", "bug-id-" + bug.id);
      row.attr("target", row.attr("id"));
      row.find(".summary").text(bug.summary);
      row.addClass("status-" + bug.status);
      if (bug.priority != "--") {
        row.addClass(bug.priority);
        row.addClass(bug.severity);
      }
      row.find(".last-changed").attr("data-last-change",
                                     bug.last_change_time);      
      table.append(row);
    }

    sortByLastChanged(bugs);
    bugs.reverse();

    var extraBugs = bugs.slice(BUGS_TO_SHOW);
    bugs = bugs.slice(0, BUGS_TO_SHOW);

    bugs.forEach(appendRowForBug);

    updatePrettyDates(table);
    query.find(".bugs").remove();
    query.find(".more-link").remove();
    query.append(table);

    if (extraBugs.length) {
      var moreLink = $("#templates .more-link").clone();
      moreLink.find(".number").text(extraBugs.length);
      moreLink.click(
        function() {
          moreLink.remove();
          extraBugs.forEach(appendRowForBug);
          updatePrettyDates(table);
          removeDuplicateBugs();
        });
      query.append(moreLink);
    }

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

  function report(selector, key, forceUpdate, searchTerms) {
    var newTerms = {__proto__: defaults};
    for (name in searchTerms)
      newTerms[name.replace(/_DOT_/g, ".")] = searchTerms[name];

    var cacheKey = key + "/" + selector;
    var cached = cache.get(cacheKey);
    if (cached) {
      showBugs($(selector), cached);
      if (!forceUpdate)
        return;
    }

    $(selector).find("h2").addClass("loading");
    
    xhrQueue.enqueue(
      function() {
        return bugzilla.search(
          newTerms,
          function(response) {
            cache.set(cacheKey, response.bugs);
            showBugs($(selector), response.bugs);
            $(selector).find("h2").removeClass("loading");
          });
      });
  }

  const MS_PER_HOUR = 1000 * 60 * 60;
  const MS_PER_DAY =  MS_PER_HOUR * 24;
  const MS_PER_WEEK = MS_PER_DAY * 7;

  var defaults = {
    changed_after: dateUtils.timeAgo(MS_PER_WEEK * 14)
  };

  function update(myUsername, isAuthenticated, forceUpdate) {
    xhrQueue.clear();

    var key = myUsername + "_" + (isAuthenticated ? "PRIVATE" : "PUBLIC");

    report("#code-reviews", key, forceUpdate,
           {status: ["NEW", "UNCONFIRMED", "ASSIGNED", "REOPENED"],
            flag_DOT_requestee: myUsername});

    report("#assigned-bugs", key, forceUpdate,
           {status: ["NEW", "UNCONFIRMED", "ASSIGNED", "REOPENED"],
            email1: myUsername,
            email1_type: "equals",
            email1_assigned_to: 1});

    report("#reported-bugs", key, forceUpdate,
           {status: ["NEW", "UNCONFIRMED", "ASSIGNED", "REOPENED"],
            email1: myUsername,
            email1_type: "equals",
            email1_creator: 1,
            email2: myUsername,
            email2_type: "not_equals",
            email2_assigned_to: 1});

    report("#cc-bugs", key, forceUpdate,
           {status: ["NEW", "UNCONFIRMED", "ASSIGNED", "REOPENED"],
            email1: myUsername,
            email1_type: "equals",
            email1_cc: 1,
            email2: myUsername,
            email2_type: "not_equals",
            email2_assigned_to: 1,
            email2_creator: 1});

    report("#fixed-bugs", key, forceUpdate,
           {resolution: ["FIXED"],
            changed_after: dateUtils.timeAgo(MS_PER_WEEK),
            email1: myUsername,
            email1_type: "equals",
            email1_assigned_to: 1,
            email1_creator: 1,
            email1_cc: 1});
  };

  var refreshCommand = {
    name: "refresh-dashboard",
    execute: function execute() {
      var user = require("app/login").get();
      if (user.isLoggedIn)
        update(user.username, user.isAuthenticated, true);
    }
  };

  exports.init = function init() {
    require("app/commands").register(refreshCommand);
    require("app/login").whenChanged(
      function changeSearchCriteria(user) {
        if (user.isLoggedIn) {
          update(user.username, user.isAuthenticated, false);
        }
      });
  };
};
