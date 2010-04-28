function getXPathForElement(el, xml) {
  var xpath = "";
  var pos, tempitem2;
  
  while (el !== xml.documentElement) {    
    pos = 0;
    tempitem2 = el;
    while (tempitem2) {
      if (tempitem2.nodeType === 1 && tempitem2.nodeName === el.nodeName) {
        // If it is ELEMENT_NODE of the same name
        pos += 1;
      }
      tempitem2 = tempitem2.previousSibling;
    }
    
    xpath = el.nodeName + "[" + pos + "]" + "/" + xpath;

    el = el.parentNode;
  }
  xpath = "/" + xml.documentElement.nodeName + "/" + xpath;
  xpath = xpath.replace(/\/$/, '');
  return xpath;
}

function onDashboardLoaded(dashboard, options) {
  var require = Require.build(Require.modules, {window: window});

  // Needed for Firebug, which won't log iframe errors to the console.
  $(dashboard).error(
    function(event) {
      console.warn("An error occurred in the dashboard iframe.");
    });

  function DOMElementToCSSSelector(element) {
    if (element.id)
      return "#" + element.id;

    var document = element.ownerDocument;

    function isUnique(selector) {
      return (document.querySelectorAll(selector).length == 1);
    }

    var parent = element.parentNode;
    while (parent) {
      if (parent.id)
        break;
      parent = parent.parentNode;
    }

    if (parent && parent.id) {
      var selector = "#" + parent.id;

      var list = element.classList;
      for (var i = 0; i < list.length; i++) {
        selector += " ." + list[i];
        if (isUnique(selector))
          return selector;
      }
    }
    return null;
  }

  dashboard.addEventListener(
    "mousedown",
    function(event) {
      var document = event.target.ownerDocument;
      var xpath = getXPathForElement(event.target, document);
      var result = document.evaluate(xpath, document, null,
                                     XPathResult.ANY_TYPE, null);
      console.log("mousedown", event.target,
                  DOMElementToCSSSelector(event.target),
                  xpath,
                  result.iterateNext());
    },
    true
  );

  var moduleExports = {};
  var dbrequire = dashboard.Require.build(dashboard.Require.modules,
                                          moduleExports);

  function delegate(method, args) {
    //console.log(method, args);
  }

  var ajaxImpl = require("mocks/bugzilla/trivial").makeAjaxImpl();
  options.cache = require("mocks/cache").create(delegate);
  options.Bugzilla = require("mocks/bugzilla").create(options.Bugzilla,
                                                      ajaxImpl,
                                                      delegate);
  dbrequire("date-utils").now = function() {
    return new Date("Tue Apr 27 2010 09:00:00 GMT");
  };
  dbrequire("app/loader").init(moduleExports, options);
}

$(window).ready(
  function() {
    var iframe = $("#dashboard").get(0);
    iframe.src = "index.html?testing=1";
  });
