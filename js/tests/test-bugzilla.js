function testBugzillaAjax() {
  var require = Require.build();
  var actual = [];
  var expected = [
    ["open",["GET",
             "https://api-dev.bugzilla.mozilla.org/latest/configuration"]],
    ["setRequestHeader",["Accept","application/json"]],
    ["setRequestHeader",["Content-Type","application/json"]],
    ["addEventListener",["load",false]],
    ["send",[null]]
  ];

  expect(expected.length);

  var xhr = require("mocks").xhr(
    function xhrDelegate(methodName, args) {
      var jsonableArgs = [];
      args.forEach(
        function(arg) {
          if (typeof(arg) != "function")
            jsonableArgs.push(arg);
        });
      ;
      same([methodName, jsonableArgs], expected.splice(0, 1)[0]);
    });

  var options = {
    xhr: xhr,
    url: "/configuration",
    success: function(result) {
      console.log("success!");
    }
  };

  Bugzilla.ajax(options);
}
