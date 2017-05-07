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

mongoose.connect('mongodb://localhost:27017/ziprecruiter');

var port = 8082;
{
    app.use(bodyParser.urlencoded({ extended: false }))
    app.use(bodyParser.json())
    app.use(cookieParser());
    app.use(session({ secret: 'keyboard cat' }));
    app.use(passport.initialize());
    app.use('/api', router);
}

passport.use(new GoogleStrategy({
    clientID: config.web.client_id,
    clientSecret: config.web.client_secret,
    callbackURL: "http://localhost:8082/auth/callback",
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

app.all('/:calendarId', function(req, res){
  
  if(!req.session.access_token) return res.redirect('/auth');
  
  var accessToken     = req.session.access_token;
  var calendarId      = req.params.calendarId;
  
  gcal(accessToken).events.list(calendarId, function(err, data) {
    if(err) return res.send(500,err);
    return res.send(data);
  });
});

app.all('/:calendarId/add', function(req, res){
  
  if(!req.session.access_token) return res.redirect('/auth');
  
  var accessToken     = req.session.access_token;
  var calendarId      = req.params.calendarId;
  var text            = req.query.text || 'Hello World';
  
  gcal(accessToken).events.quickAdd(calendarId, text, function(err, data) {
    if(err) return res.send(500,err);
    return res.redirect('/'+calendarId);
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

app.all('/:calendarId/:eventId/remove', function(req, res){
  
  if(!req.session.access_token) return res.redirect('/auth');
  
    var accessToken     = req.session.access_token;
    var calendarId      = req.params.calendarId;
    var eventId         = req.params.eventId;
  
    gcal(accessToken).events.delete(calendarId, eventId, function(err, data) {
        if(err) return res.send(500,err);
        return res.redirect('/'+calendarId);
    });
});

router.post('/send_mail', mailController.sendMailToSpecifiedUser);


app.listen(port);
