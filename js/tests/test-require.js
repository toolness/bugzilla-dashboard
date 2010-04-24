function testGlobalRequireRaises() {
  raises("require() not available at global scope: foo",
         function() { require("foo"); });
}

function testRequire() {
  var testModules = {
    foo: function(exports, require) {
      exports.foo = function(x) { return x + 1; };
    },
    bar: function(exports, require) {
      exports.bar = function(x) {
        return require("foo").foo(x) * 2;
      };
    }
  };

  var require = Require.build(testModules);

  equals(require("bar").bar(5), 12,
         "ensure Require.build() works");

  raises("module not found: blah",
         function() { require("blah"); });
}
