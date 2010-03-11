$(window).ready(
  function() {
    var cache = buildCache("#form-cache .data");

    function sortByLastChanged(bugs) {
      var lctimes = {};

      bugs.forEach(
        function(bug) {
          lctimes[bug.id] = dateFromISO8601(bug.last_change_time);
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
          $(this).text(prettyDate(lcTime));
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
              window.open(Bugzilla.getShowBugURL(bug.id));
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

      Bugzilla.search(newTerms,
                      function(response) {
                        cache.set(selector, response.bugs);
                        showBugs($(selector), response.bugs);
                        $(selector).find("h2").removeClass("loading");
                      });
    }

    function timeAgo(ms) {
      var now = new Date();
      var then = new Date(now - ms);
      return dateToISO8601(then);
    }

    const MS_PER_HOUR = 1000 * 60 * 60;
    const MS_PER_DAY =  MS_PER_HOUR * 24;
    const MS_PER_WEEK = MS_PER_DAY * 7;

    var defaults = {
      changed_after: timeAgo(MS_PER_WEEK * 14)
    };

    report("#assigned-bugs",
           {status: ["NEW", "UNCONFIRMED", "ASSIGNED", "REOPENED"],
            email1: "avarma@mozilla.com",
            email1_type: "equals",
            email1_assigned_to: 1});

    report("#fixed-bugs",
           {resolution: ["FIXED"],
            changed_after: timeAgo(MS_PER_WEEK),
            email1: "avarma@mozilla.com",
            email1_type: "equals",
            email1_assigned_to: 1,
            email1_reporter: 1,
            email1_cc: 1});

    report("#code-reviews",
           {status: ["NEW", "UNCONFIRMED", "ASSIGNED", "REOPENED"],
            flag_DOT_requestee: "avarma@mozilla.com"});

    report("#reported-bugs",
           {status: ["NEW", "UNCONFIRMED", "ASSIGNED", "REOPENED"],
            email1: "avarma@mozilla.com",
            email1_type: "equals",
            email1_reporter: 1,
            email2: "avarma@mozilla.com",
            email2_type: "not_equals",
            email2_assigned_to: 1});

    report("#cc-bugs",
           {status: ["NEW", "UNCONFIRMED", "ASSIGNED", "REOPENED"],
            email1: "avarma@mozilla.com",
            email1_type: "equals",
            email1_cc: 1,
            email2: "avarma@mozilla.com",
            email2_type: "not_equals",
            email2_assigned_to: 1,
            email2_reporter: 1});
  });
