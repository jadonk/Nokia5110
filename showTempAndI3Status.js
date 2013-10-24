// root@beaglebone:~# rm /etc/localtime
// root@beaglebone:~# ln -s /usr/share/zoneinfo/EST5EDT /etc/localtime
// root@beaglebone:~# ntpdate pool.ntp.org

var http = require('http');
var os = require('os');
var lcd, b, TMP36;

if(true) {
    b = require('bonescript');
    lcd = require('nokia5110');
    var oldLCDString = lcd.string;
    lcd.string = function(x){console.log('STRING: ' + x);oldLCDString(x);};
    var oldGotoXY = lcd.gotoXY;
    lcd.gotoXY = function(x,y){console.log('GOTOXY: ' + x + ',' + y);oldGotoXY(x,y);};
    TMP36 = "P9_39";
    lcd.PIN_SDIN = "P9_21";
    lcd.PIN_SCLK = "P9_22";
    lcd.PIN_SCE = "P9_23";
    lcd.PIN_DC = "P9_24";
    lcd.PIN_RESET = "P9_25";
    lcd.setup();
    lcd.clear();
    lcd.gotoXY(0, 0);
    lcd.string("Temp:");
    lcd.gotoXY(0, 1);
    lcd.string("  I3:");
    lcd.gotoXY(0, 2);
    lcd.string("Meet:");
    setInterval(readTMP, 3000);
} else {
    lcd = {};
    lcd.string = function(x){console.log('STRING: ' + x);};
    lcd.gotoXY = function(x,y){console.log('GOTOXY: ' + x + ',' + y);};
}

getIP();
doI3Request();
doMeetupRequest();
setInterval(doI3Request, 60000);
setInterval(doMeetupRequest, 4*60*60000);

function getIP() {
    try {
        var ipAddr = os.networkInterfaces().eth0[0].address;
        lcd.gotoXY(0, 5);
        lcd.string(ipAddr);
    } catch(ex) {
        setTimeout(getIP, 10000);
    }
}

function readTMP() {
    b.analogRead(TMP36, onReadTMP);
}

function onReadTMP(x) {
    var millivolts = x.value * 1800;
    var tempC = (millivolts - 500) / 10;
    var tempF = (tempC * 9/5) + 32;
    lcd.gotoXY(36, 0);
    lcd.string(tempF.toFixed(1) + " F");
}

var previousSpaceStatus = "";
function doI3Request() {
  var req = http.get({hostname:'www.i3detroit.org'}, i3Request);
  req.on('error', function(e) {
    console.log('Problem with request: ' + e.message);
    lcd.gotoXY(36, 1);
    lcd.string("N/A  ");
  });

  var page = "";
  function i3Request(res) {
    if(res.statusCode != 200) {
      console.log('STATUS: ' + res.statusCode);
      console.log('HEADERS: ' + JSON.stringify(res.headers));
      lcd.gotoXY(36, 1);
      lcd.string("N/A  ");
      return;
    }
    res.setEncoding('utf8');
    res.on('data', onData);
    res.on('end', onEnd);
  
    function onData(chunk) {
      page += chunk;
      //console.log('BODY: ' + chunk);
    }
  
    function onEnd() {
      var space = page.match(/The space is currently.*\n<span.*>(.*)<\/span>/mi);
      if(space.length != 2) {
        console.log("BODY doesn't contain space status: " + page);
        return;
      }
      if(space[1] != previousSpaceStatus) {
        console.log('SPACE: ' + space[1]);
        previousSpaceStatus = space[1];
        var showSpace = (space[1].match(/(open|closed)/i))[0];
        while(showSpace.length < 6) {
            showSpace = showSpace + " ";
        }
        lcd.gotoXY(36, 1);
        lcd.string(showSpace);
      }
    }
  }
}

function doMeetupRequest() {
  var req = http.get(
    {
      hostname:'www.meetup.com',
      path:'/Southeast-Michigan-BeagleBone-Users-Group/events/rss/Southeast+Michigan+BeagleBone+User%27s+Group/',
    }, meetupRequest
  );
  req.on('error', function(e) {
    console.log('Problem with request: ' + e.message);
    lcd.gotoXY(36, 2);
    lcd.string("N/A  ");
  });

  var page = "";
  function meetupRequest(res) {
    if(res.statusCode != 200) {
      //console.log('STATUS: ' + res.statusCode);
      //console.log('HEADERS: ' + JSON.stringify(res.headers));
      return;
    }
    res.setEncoding('utf8');
    res.on('data', onData);
    res.on('end', onEnd);
  
    function onData(chunk) {
      page += chunk;
      //console.log('BODY: ' + chunk);
    }
  
    function onEnd() {
      try {
        var regex = /<description>.*<p>(.*)<\/p> <p>Attending:.*<\/description>/g;
        var descriptions = regex.exec(page);
        var nextMeetup = descriptions[1];
        nextMeetup = nextMeetup.replace(/at /, "");
        //console.log(nextMeetup);
        var now = new Date();
        var meetupTime = new Date(Date.parse(nextMeetup));
        meetupTime.setFullYear(now.getFullYear());
        console.log("meetupTime = " + meetupTime);
        console.log("now = " + now);
        var meetupHours = ((meetupTime - now)/(1000*60*60)).toFixed(1) + "hrs";
        while(meetupHours.length < 6) {
            meetupHours = meetupHours + " ";
        }
        console.log("MEETUP: " + meetupHours);
        lcd.gotoXY(36, 2);
        lcd.string(meetupHours);
      } catch(ex) {
        console.log('ERROR: ' + ex);
      }
    }
  }
}
