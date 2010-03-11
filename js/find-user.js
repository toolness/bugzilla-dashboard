$(window).ready(
  function() {
    var currReq;

    var options = {
      minLength: 2,
      source: function(request, response) {
        function success(result) {
          var suggs = [];
          result.users.forEach(
            function(user) {
              suggs.push(user.real_name + " (" + user.name + ")");
            });
          response(suggs);
        }
        currReq = Bugzilla.ajax({url: "/user",
                                 data: {match: request.term,
                                        username: $("#username").val(),
                                        password: $("#password").val()},
                                 success: success});
      }
    };
    $("input#query").autocomplete(options);
  });
