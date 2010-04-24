var Require = {
  modules: {},
  build: function build(modules) {
    if (!modules)
      modules = this.modules;

    var moduleExports = {};

    return function require(module) {
      if (!(module in moduleExports)) {
        if (!(module in modules))
          throw new Error("module not found: " + module);
        var exports = {};
        var globalScope = {};
        modules[module].call(globalScope, exports, require);
        moduleExports[module] = exports;
      }
      return moduleExports[module];
    };
  }
};

function require(module) {
  throw new Error("require() not available at global scope: " + module);
}
