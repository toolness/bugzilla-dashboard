$(window).ready(
  function() {
    var require = Require.build(Require.modules, {jQuery: jQuery});
    require("app/ui").init(document);
  });
