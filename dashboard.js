$(window).ready(
  function() {
    var reportsLeft = 0;

    function sortByLastChanged(bugs) {
      bugs.forEach(
        function(bug) {
          var parseableTime = bug.last_change_time.replace(/-/g,"/");
          parseableTime = parseableTime.replace(/[TZ]/g," ");
          bug._lctime = new Date(parseableTime);
        });

      function compare(a, b) {
        if (a._lctime < b._lctime)
          return -1;
        if (a._lctime > b._lctime)
          return 1;
        return 0;
      }

      bugs.sort(compare);
    }

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
          if (bug.priority != "--")
            row.find(".importance").text(bug.priority + NBSP +
                                         bug.severity)
                                   .addClass(bug.priority)
                                   .addClass(bug.severity);
          row.find(".last-changed").text(prettyDate(bug.last_change_time));
          row.click(
            function() {
              window.open(Bugzilla.getShowBugURL(bug.id));
            });
          table.append(row);
        });
      query.append(table);
    }

    function finalizeReports() {
      var visited = {};
      $("#reports .bug-row").each(
        function() {
          var id = $(this).attr("id");
          if (id in visited)
            $(this).remove();
          else
            visited[id] = true;
        });
      $("#loading-screen").hide();
      $("#reports").fadeIn();
    }

    function report(selector, searchTerms) {
      var newTerms = {__proto__: defaults};
      for (name in searchTerms)
        newTerms[name.replace(/_DOT_/g, ".")] = searchTerms[name];
      Bugzilla.search(newTerms,
                      function(response) {
                        showBugs($(selector), response.bugs);
                        reportsLeft--;
                        $("#loading-screen .countdown").text(reportsLeft);
                        if (!reportsLeft)
                          finalizeReports();
                      });
      reportsLeft++;
    }

    // Taken from MDC @ Core_JavaScript_1.5_Reference/Objects/Date.
    function ISODateString(d) {
      function pad(n) { return n < 10 ? '0' + n : n; }

      return (d.getUTCFullYear() + '-' +
              pad(d.getUTCMonth() + 1) + '-' +
              pad(d.getUTCDate()) + 'T' + 
              pad(d.getUTCHours()) + ':' +
              pad(d.getUTCMinutes()) + ':' +
              pad(d.getUTCSeconds()) + 'Z');
    }

    function timeAgo(ms) {
      var now = new Date();
      var then = new Date(now - ms);
      return ISODateString(then);
    }

    const NBSP = "\u00a0";
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

    $("#loading-screen .countdown").text(reportsLeft);
  });
