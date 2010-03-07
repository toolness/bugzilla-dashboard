$(window).ready(
  function() {
    function showBugs(query, bugs) {
      var table = $("#templates .bugs").clone();
      var row = table.find(".bug-row").remove();
      bugs.reverse();
      bugs.forEach(
        function(bug) {
          row.find(".summary").text(bug.summary);
          row.find(".summary").attr("href", 
                                    Bugzilla.getShowBugURL(bug.id));
          row.find(".priority").text(bug.priority);
          table.append(row.clone());
        });
      query.append(table);
    }

    function report(selector, searchTerms) {
      var newTerms = {__proto__: defaults};
      for (name in searchTerms)
        newTerms[name.replace(/_DOT_/g, ".")] = searchTerms[name];
      Bugzilla.search(newTerms,
                      function(response) {
                        showBugs($(selector),
                                 response.bugs);
                      });
    }

    function timeAgo(ms) {
      var now = new Date();
      var then = new Date(now - ms);
      return then.toLocaleFormat("%Y-%m-%d");
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
            email1_assigned_to: 1});

    report("#code-reviews",
           {status: ["NEW", "UNCONFIRMED", "ASSIGNED", "REOPENED"],
            flag_DOT_requestee: "avarma@mozilla.com"});
  });
