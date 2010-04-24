function testDateUtils() {
  var dateUtils = Require.build()("date-utils");
  var isoDate = "2010-04-13T18:02:00Z";
  var date = dateUtils.dateFromISO8601(isoDate);

  equals(date.toUTCString(), "Tue, 13 Apr 2010 18:02:00 GMT");
  equals(dateUtils.dateToISO8601(date), isoDate);
  equals(
    dateUtils.prettyDate(
      "2010-04-13T18:02:00Z",
      new Date("Tue, 13 Apr 2010 18:02:01 GMT")
    ),
    "just now"
  );
}
