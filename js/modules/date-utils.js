Require.modules["date-utils"] = function(exports) {
  // Dynamically replace this when QA testing, for determinism.
  exports.now = function now() {
    return new Date();
  };

  // Taken from MDC @ Core_JavaScript_1.5_Reference/Objects/Date.
  exports.dateToISO8601 = function dateToISO8601(d) {
    function pad(n) { return n < 10 ? '0' + n : n; }
    
    return (d.getUTCFullYear() + '-' +
            pad(d.getUTCMonth() + 1) + '-' +
            pad(d.getUTCDate()) + 'T' + 
            pad(d.getUTCHours()) + ':' +
            pad(d.getUTCMinutes()) + ':' +
            pad(d.getUTCSeconds()) + 'Z');
  };

  // Taken from http://delete.me.uk/2005/03/iso8601.html
  exports.dateFromISO8601 = function dateFromISO8601(string) {
    var regexp = ("([0-9]{4})(-([0-9]{2})(-([0-9]{2})" +
                  "(T([0-9]{2}):([0-9]{2})(:([0-9]{2})(\.([0-9]+))?)?" +
                  "(Z|(([-+])([0-9]{2}):([0-9]{2})))?)?)?)?");
    var d = string.match(new RegExp(regexp));

    var offset = 0;
    var date = new Date(d[1], 0, 1);

    if (d[3]) { date.setMonth(d[3] - 1); }
    if (d[5]) { date.setDate(d[5]); }
    if (d[7]) { date.setHours(d[7]); }
    if (d[8]) { date.setMinutes(d[8]); }
    if (d[10]) { date.setSeconds(d[10]); }
    if (d[12]) { date.setMilliseconds(Number("0." + d[12]) * 1000); }
    if (d[14]) {
      offset = (Number(d[16]) * 60) + Number(d[17]);
      offset *= ((d[15] == '-') ? 1 : -1);
    }

    offset -= date.getTimezoneOffset();
    var time = (Number(date) + (offset * 60 * 1000));
    date.setTime(Number(time));
    return date;
  };

  /*
   * JavaScript Pretty Date
   * Copyright (c) 2008 John Resig (jquery.com)
   * Licensed under the MIT license.
   */

  // Takes an ISO time and returns a string representing how
  // long ago the date represents.
  exports.prettyDate = function prettyDate(time, now){
    if (!now)
      now = exports.now().getTime();

    var date = exports.dateFromISO8601(time),
    diff = ((now - date.getTime()) / 1000),
    day_diff = Math.floor(diff / 86400);
			
    if ( isNaN(day_diff) || day_diff < 0 || day_diff >= 31 )
      return null;
    
    return day_diff == 0 && (
      diff < 60 && "just now" ||
	diff < 120 && "1 minute ago" ||
	diff < 3600 && Math.floor( diff / 60 ) + " minutes ago" ||
	diff < 7200 && "1 hour ago" ||
	diff < 86400 && Math.floor( diff / 3600 ) + " hours ago"
    ) ||
      day_diff == 1 && "Yesterday" ||
      day_diff < 7 && day_diff + " days ago" ||
      day_diff < 31 && Math.ceil( day_diff / 7 ) + " weeks ago";
  };

  exports.timeAgo = function timeAgo(ms) {
    var then = new Date(exports.now() - ms);
    return exports.dateToISO8601(then);
  };
};
