// Add various methods to Javascript Date object
Date.prototype.curday = function() {
    var yy = this.getFullYear().toString().substr(2,2);
    var mm = (this.getMonth()+1).toString(); // getMonth() is zero-based
    var dd  = this.getDate().toString();
    return yy+(mm[1]?mm:"0"+mm[0])+(dd[1]?dd:"0"+dd[0]); // padding
};

Date.prototype.curhour = function() {
    var hh = this.getHours().toString() + "00";
    return (hh[3]?hh:"0000");
}

Date.prototype.addHours= function(h) {
    return this.setHours(this.getHours()+h);
};

Date.prototype.soundingString = function() {
    return this.curday()+'/'+this.curhour();
};

Date.prototype.displayString = function() {
  var yyyy = this.getFullYear().toString();
  var mm = (this.getMonth()+1).toString();
  mm = (mm[1]?mm:"0"+mm[0])  // Pad with leading 0s if needed
  var dd = this.getDate().toString();
  dd = (dd[1]?dd:"0"+dd[0])  // Pad with leading 0s if needed
  hhhh = this.getHours().toString() + "00";
  return yyyy+"-"+mm+"-"+dd+" @ "+(hhhh[3]?hhhh:"0000")+" UTC";
}



// Day of Year for Each Month
var aggregateMonths = [0, 31, 60, 91, 121, 152, 182, 213, 244, 274, 305, 335];



// If number is odd, return number; if even, increment by 1
function makeOdd(x) { return (x % 2 != 0) ? x : x+1; }

// Convert Date object to Day of Year (366 days in year)
function dateToDay(d) { return aggregateMonths[d.getMonth()]+d.getDate()+d.getHours()/24.; };

// Parse Date from Sounding File Strings
function parseDate(d) {
  var year = +d.substring(0, 2);
  if (year > 25) { year = year + 1900;
  } else { year = year + 2000; };
  return new Date(year, d.substring(2, 4) - 1,
                  d.substring(4, 6), d.substring(7, 9),
                  d.substring(13, 11));
};

// Convert, year, day-of-year to Date
function dateFromDay(year, day) {
  var date = new Date(year, 0);
  date = new Date(date.setDate(day));
  return new Date(date.setHours(Math.round((day % 1) * 24)));
};

function getCurDate() {
  var obs = new Date();
  obs.setMinutes(00);
  obs.setSeconds(00);
  obs.setMilliseconds(00);
  return obs;
};

// Get the latest 00 Time
function getLatest00() {
  var obs00 = getCurDate();
  if (obs00.getUTCHours() < 2) { obs00.addHours(-24); }
  obs00.setDate(obs00.getUTCDate());
  obs00.setHours(00);
  return obs00
};

// Get the latest 12 UTC Time
function getLatest12() {
  var obs12 = new getCurDate();
  if (obs12.getUTCHours() < 14) { obs12.addHours(-24); }
  obs12.setDate(obs12.getUTCDate());
  obs12.setHours(12);
  return obs12
}

// Get the latest 00 or 12 UTC Time
function getLatest() {
  var obs = getCurDate();
  if (obs.getUTCHours() < 1) { return getLatest12(); }
  else if (obs.getUTCHours() < 13) { return getLatest00(); }
  else { return getLatest12(); };
};

// Display Obs
function displayObs() {
  if ($("#observed").prop("checked")) { $(".obs").show(); }
  else { $(".obs").hide(); };
};
