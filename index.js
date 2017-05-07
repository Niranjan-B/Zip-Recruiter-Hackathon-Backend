var express = require('express');
var app = express();
var router = express.Router();
var bodyParser = require('body-parser');
var mailController = require('./controllers/mail_controller');
var config = require('./config');
var gcal = require('./GoogleCalendar');
var passport = require('passport')
var GoogleStrategy = require('passport-google-oauth').OAuth2Strategy;
var cookieParser = require('cookie-parser');
var session = require('express-session');
var mongoose = require('mongoose');
var ConfirmSlotModel = require('./models/confirm_slot_model');
var DateTimeModel = require('./models/date_time_model');
var cors = require('cors')
//mongoose.connect('mongodb://localhost:27017/ziprecruiter');
mongoose.connect('mongodb://test1:nbv12345@ds157278.mlab.com:57278/todo');

var port = 8082;
{
    app.use(bodyParser.urlencoded({ extended: false }))
    app.use(bodyParser.json())
    app.use(cookieParser());
    app.use(session({ secret: 'keyboard cat' }));
    app.use(passport.initialize());
    app.use('/api', router);
    app.use(cors());
}

passport.use(new GoogleStrategy({
    clientID: config.web.client_id,
    clientSecret: config.web.client_secret,
    //callbackURL: "http://localhost:8082/auth/callback",
    callbackURL: "https://ziprecruiter.herokuapp.com/auth/callback",
    scope: ['openid', 'email', 'https://www.googleapis.com/auth/calendar'] 
  },
  function(accessToken, refreshToken, profile, done) {
    profile.accessToken = accessToken;
    return done(null, profile);
  }
));

app.get('/auth',passport.authenticate('google', { session: false }));

app.get('/auth/callback', 
  passport.authenticate('google', { session: false, failureRedirect: '/login' }),
  function(req, res) { 
    req.session.access_token = req.user.accessToken;
    res.redirect('/');
  });


/*
  ===========================================================================
                               Google Calendar
  ===========================================================================
*/

app.all('/', function(req, res){
  if(!req.session.access_token) return res.redirect('/auth');
  
  var accessToken = req.session.access_token;
  
  gcal(accessToken).calendarList.list(function(err, data) {
    if(err) return res.send(500,err);
    return res.send(data);
  });
});


app.all('/getAppointment', function(req, res){
    console.log("Before  token")

if(!req.session.access_token) 
 {
    console.log(req.session.access_token)

  return res.redirect('/auth');
  }
    console.log("After token")
  var accessToken = req.session.access_token;
  var body = {
  "timeMin": req.body.timeMin,
  "timeMax": req.body.timeMax,
  "timeZone": "America/Los_Angeles",
  "items": [
    {
      "id": req.body.id
    }
  ]
}
  gcal(accessToken).freebusy.query(body, function(err, data) {
    if(err) return res.send(500,err);
    return res.send(data.calendars.primary.busy);

  });

});

app.all('/createAppointment', function(req, res){
  
  if(!req.session.access_token) return res.redirect('/auth');
  var accessToken = req.session.access_token;
  var params = { "sendNotifications": true }
  var email = "primary"
  var event = {
  'summary': req.body.subject,
  'location': 'Phone Interview',
  'description': 'Reference check for candidate '+req.body.candidate,
  'start': {
    'dateTime': req.body.starttime,
    'timeZone': 'America/Los_Angeles',
  },
  'end': {
    'dateTime': req.body.endtime,
    'timeZone': 'America/Los_Angeles',
  },
  'attendees': [
    {'email': req.body.referral},
  ]
};

  gcal(accessToken).events.insert(email, event, params, function(err, data) {
    if(err) return res.send(500,err);
    return res.send(data);
  });

});



// --------------------------------------- function to confirm slot -----------------------------------
router.post('/confirm_time_slot', function(req, res) {

  var hrEmail = req.body.hr_email;
  var referanceEmail = req.body.ref_email;
  var availableDateTimes = req.body.date_times;
  var dateTimeArrayModel = [];

  ConfirmSlotModel.hr_email = hrEmail;
  ConfirmSlotModel.referral_email = referanceEmail;
  var parsedJson = JSON.parse(availableDateTimes);
  
  for (var i=0; i<parsedJson.length; i++) {
    var stringArray = [];

    for (var j=0; j<parsedJson[i].times.length; j++) {
      stringArray.push(parsedJson[i].times[j]);
    }

    var dateTimeModel = new DateTimeModel({
      avDate : parsedJson[i].date,
      times : stringArray
    });
    dateTimeArrayModel.push(dateTimeModel);
    console.log(dateTimeModel);
  }

  var confirmSlotModel = new ConfirmSlotModel({
      hr_email : hrEmail,
      referral_email : referanceEmail,
      available_dates : dateTimeArrayModel    
  });
  console.log(confirmSlotModel);
  //console.log(ConfirmSlotModel);
  confirmSlotModel.save(function(err) {
    if (err) {
      res.json({"status": "error during db transaction" + err});
    } else {
      res.json({"status": "saved in db successfully"});

      ConfirmSlotModel.find({}, function(err, data){
        var queryResult = data;
        console.log(queryResult[queryResult.length-1]);
        var date1 = queryResult[queryResult.length-1][0];
        var date2 = queryResult[queryResult.length-1][1];
        
      });
    }
  });

});

// ----------------------------------------------------------------------------------------------------
router.get('/confirm_time_slot', function(req,res) {
  var hr_email = req.query.hr_email 
  var referral_email = req.query.referral_email
 
  confirmSlotModel.findOne({'hr_email':hr_email, 'referral_email':referral_email} , function(err, slot) {
    if (err) {
      res.json({"status": "error during db transaction" + err});
    } 
    else {
      res.render("selectChoice.jade", {layout:false, slotObj:slot});
    }
  })


});


router.post('/send_mail', mailController.sendMailToSpecifiedUser);
app.all('/sendmail', mailController.sendMail);


app.listen(process.env.PORT || 8082);
