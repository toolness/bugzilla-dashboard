$(window).ready(
  function() {
    const EM_DASH = "\u2014";

    var cache = buildCache("#form-cache .data");
    var config = cache.get("configuration");
    var categories;
    var queuedRespond;

    function buildCategories() {
      categories = [];
      for (product in config.product)
        for (component in config.product[product].component)
          categories.push(product + EM_DASH + component);
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

        if (!config)
          queuedRespond = respond;
        else
          respond();
      }
    };

    $("input#category").autocomplete(categoryOptions);
    $("#file-bug").submit(
      function(event) {
        event.preventDefault();
        var parts = $("input#category").val().split(EM_DASH);
        window.open(Bugzilla.BASE_UI_URL + "/enter_bug.cgi?" +
                    "product=" + escape(parts[0]) + "&" +
                    "component=" + escape(parts[1]));
      });

    Bugzilla.ajax({url: "/configuration",
                   data: {flags: 0},
                   success: function(result) {
                     config = result;
                     cache.set("configuration", result);
                     if (queuedRespond)
                       queuedRespond();
                   }});
  });
