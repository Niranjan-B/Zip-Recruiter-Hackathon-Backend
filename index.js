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
var Appointment = require('./models/appointment_model');

var cors = require('cors')
//mongoose.connect('mongodb://ec2-204-236-195-193.compute-1.amazonaws.com:27017/ziprecruiter');
mongoose.connect('mongodb://test1:nbv12345@ds157278.mlab.com:57278/todo');
//var accessToken = 'ya29.GlxDBObXHsBugc642qJZ5tJLzhXiBzdnfU_2GoP7IUNTUkP1gY8n1tM0L4kw2P6VG6X0Zer1dKw25zGXonv2Rx4vXULDl3zd52CnHIFD61PzCkkXLxg598VNoPJzwg';
var accessToken;

var port = 8082;
{
    app.use(bodyParser.urlencoded({ extended: false }))
    app.use(bodyParser.json())
    app.use(cookieParser());
    app.use(session({ secret: 'keyboard cat' }));
     app.use(function(req, res, next) { //allow cross origin requests
        //res.setHeader("Access-Control-Allow-Methods", "*");
        res.header("Access-Control-Expose-Headers", "OPTIONS");
        res.header("Access-Control-Allow-Origin", "*");
        res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
        next();
    });
    app.use(passport.initialize());

    app.use('/api', router);
    app.use(cors());
}

passport.use(new GoogleStrategy({
    clientID: config.web.client_id,
    clientSecret: config.web.client_secret,
    //callbackURL: "http://ec2-204-236-195-193.compute-1.amazonaws.com:8082/auth/callback",
    callbackURL: "http://ec2-204-236-195-193.compute-1.amazonaws.com:8082/auth/callback",
    scope: ['openid', 'email', 'https://www.googleapis.com/auth/calendar'] 
  },
  function(accessToken, refreshToken, profile, done) {
    profile.accessToken = accessToken;
    return done(null, profile);
  }
));

app.get('/auth',passport.authenticate('google', { session: false }), function(req, res) {
});

app.get('/auth/callback', 
  passport.authenticate('google', { session: false, failureRedirect: '/login' }),
  function(req, res) {
    accessToken = req.user.accessToken;
    res.redirect('/');
  });


/*
  ===========================================================================
                               Google Calendar
  ===========================================================================
*/

app.all('/', function(req, res){
    
  gcal(accessToken).calendarList.list(function(err, data) {
    if(err) return res.send(500,err);
    return res.send(data);
  });
});


app.all('/getAppointment', function(req, res){
//     console.log("Before  token")

// if(!req.session.access_token) 
//  {
//     console.log(req.session.access_token)

//   return res.redirect('/auth');
//   }
//     console.log("After token")
//   var accessToken = req.session.access_token;
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
  console.log(body)
  console.log(accessToken)
  gcal(accessToken).freebusy.query(body, function(err, data) {
    if(err) return res.send(500,err);
    return res.send(data.calendars.primary.busy);

  });

});

app.all('/createAppointment', function(req, res){
  
  // if(!req.session.access_token) return res.redirect('/auth');
  // var accessToken = req.session.access_token;
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
  var referanceEmail = req.body.referrance_email;
  var availableDateTimes = req.body.date_times;
  var dateTimeArrayModel = [];

 var parsedJson = JSON.parse(availableDateTimes);

 var confirmSlotsModel = new ConfirmSlotModel();
  confirmSlotsModel.hr_email = hrEmail;
  confirmSlotsModel.referral_email = referanceEmail;

 for (var i=0; i<parsedJson.length; i++) {
      confirmSlotsModel.available_dates.push(JSON.stringify(parsedJson[i]));
  }
  confirmSlotsModel.save(function(error) {
    if (error) {
      console.log(error);
    } else {
      console.log(referanceEmail)
      mailController.sendMail(referanceEmail , function(err){
        if (err) console.log(err)
          else
        res.json({status: "saved in DB"});

      });

    }
  });
});

// ----------------------------------------------------------------------------------------------------
app.all('/SelectTimeSlot', function(req,res) {
  var hr_email = req.query.hr_email 
  var referral_email = req.query.referrel_email

  ConfirmSlotModel.findOne({'hr_email':hr_email} , function(err, slot) {
    if (err) {
      res.json({"status": "error during db transaction" + err});
    } 
    else {
      console.log(slot)
      res.render("selectChoice.jade", {layout:false, slotObj:slot});
    }
  })


});

app.all('/updateTimeSlot', function(req,res) {
  var hr_email = req.body.hr_email 
  var referral_email = req.body.referral_email
  var selectedDate = req.body.selectedDate
  var appoint = new Appointment({
    hr_email:hr_email,
    referral_email:referral_email,
    selectedDate:selectedDate,
  });
 appoint.save(function(err) {
   if (err) {
      res.json({"status": "error during db transaction" + err});
    } else {
      res.send("Appointment selected for "+selectedDate+". Recruiter will soon schedule an Appointment at same time");
  }
});

});

app.all('/getSelectedTimeSlot/:referral_email', function(req,res) {
  var referral_email = req.params.referral_email

 Appointment.findOne({referral_email:referral_email},function(err,app) {
   if (err) {
      res.json({"status": "error during db transaction" + err});
    } else {
      res.json(app)
  }
});

});


router.post('/send_mail', mailController.sendMailToSpecifiedUser);
app.all('/sendmail', mailController.sendMail);


app.listen(process.env.PORT || port);
