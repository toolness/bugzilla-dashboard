$(window).ready(
  function() {
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
        currReq = Bugzilla.ajax({url: "/user",
                                 data: {match: request.term,
                                        username: $("#username").val(),
                                        password: $("#password").val()},
                                 success: success});
      }
    };
    $("input#query").autocomplete(options);
    $("#find-user").submit(
      function(event) {
        event.preventDefault();
        window.open("index.html?username=" + escape($("input#query").val()));
      });
  });
