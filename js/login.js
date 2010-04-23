PostOffice.exposedMethods = {
  getCurrentUser: function getCurrentUser(arg, cb, event) {
    console.log("from", event.origin);
    cb({user: "NO U"});
  }
};

window.addEventListener(
  "DOMContentLoaded",
  function() {
    var form = document.getElementById("find-user");
    form.addEventListener(
      "submit",
      function(event) {
        if (window.opener)
          PostOffice.send("userChanged", {user: "hi"}, window.opener);
        event.preventDefault();
      },
      false
    );
    //var pw = document.getElementById("password").value;
  },
  false
);
